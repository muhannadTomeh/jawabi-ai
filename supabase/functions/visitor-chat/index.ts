// Public chat for landing-page visitors. Answers questions about Jawabi platform.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  enforceRateLimits,
  getClientIp,
  rateLimitResponse,
} from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `أنت "مساعد جوابي"، مساعد ودود يجيب زوار موقع منصة جوابي باللغة العربية.

جوابي منصة عربية لإنشاء بوتات ذكاء اصطناعي لخدمة العملاء، تشمل:
- بوت ذكي يرد بالعربية وبجميع اللهجات على مدار الساعة.
- قاعدة معرفة قابلة للتدريب من نصوص، أسئلة شائعة، ملفات (حتى 10MB)، روابط مواقع، صور، وصفحات السوشال ميديا (فيسبوك/انستجرام).
- ربط مع قنوات: واتساب، تيليجرام، فيسبوك ماسنجر، انستجرام.
- محرك RAG يعتمد على Gemini عبر Lovable AI Gateway.
- إدارة عملاء تلقائية، تحليلات، وتحويل المحادثة لموظف بشري عند الحاجة.
- تجربة مجانية بدون بطاقة ائتمان.

قواعد الرد:
- أجب بإيجاز ووضوح، واستخدم نقاط عند الحاجة.
- شجّع الزائر على تجربة المنصة مجاناً عند السؤال عن الأسعار أو البدء.
- لا تخترع ميزات غير مذكورة. إن لم تعرف، اقترح التواصل عبر صفحة التسجيل.
- لا تجب عن مواضيع خارج نطاق المنصة وخدمة العملاء بشكل عام.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Rate limiting: runs BEFORE any external/paid API call ----
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const rl = await enforceRateLimits(supabase, {
      // The visitor assistant is platform-wide, so it shares one virtual bucket.
      chatbotId: "00000000-0000-0000-0000-000000000000",
      ip: getClientIp(req),
      channel: "visitor",
    });
    if (!rl.allowed) return rateLimitResponse(corsHeaders);

    // Cap context to last 20 messages
    const trimmed = messages.slice(-20);

    // Resolve model + key from the admin-configured active provider.
    // Fail-safe: falls back to Lovable AI Gateway defaults.
    let model = "google/gemini-2.5-flash";
    const { data: activeProvider } = await supabase
      .from("api_providers")
      .select("id, api_key")
      .eq("is_active", true)
      .maybeSingle();
    if (activeProvider) {
      apiKey = activeProvider.api_key || apiKey;
      const { data: providerModels } = await supabase
        .from("api_provider_models")
        .select("model_id")
        .eq("provider_id", activeProvider.id)
        .limit(1);
      if (providerModels?.length) model = providerModels[0].model_id;
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...trimmed,
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، حاول لاحقاً." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: "الرصيد غير كافٍ، تواصل مع الإدارة." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: text }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content ?? "عذراً، لم أتمكن من الرد.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});