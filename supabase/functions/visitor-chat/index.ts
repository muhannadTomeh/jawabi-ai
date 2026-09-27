import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { consumeRateLimit, getClientFingerprint } from "../_shared/rateLimit.ts";

// Public chat for landing-page visitors. Answers questions about Jawabi platform.
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
- محرك RAG يعتمد على Gemini API مباشرة.
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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json", Allow: "POST" },
    });
  }

  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const totalCharacters = messages.reduce(
      (total, message) => total + (typeof message?.content === "string" ? message.content.length : 0),
      0,
    );
    if (
      messages.some((message) =>
        !message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string"
      ) || totalCharacters > 6000
    ) {
      return new Response(JSON.stringify({ error: "Invalid or oversized messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const fingerprint = await getClientFingerprint(req);
    const minuteLimit = await consumeRateLimit(admin, {
      bucketKey: `visitor_ip_minute:${fingerprint}`,
      maxRequests: 8,
      windowSeconds: 60,
      limitType: "visitor_ip_minute",
      channel: "landing",
      identifier: fingerprint,
    });
    if (!minuteLimit.allowed) {
      return new Response(JSON.stringify({ error: "Too many requests. Try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

    const dailyLimit = await consumeRateLimit(admin, {
      bucketKey: `visitor_ip_daily:${fingerprint}`,
      maxRequests: 50,
      windowSeconds: 86400,
      limitType: "visitor_ip_daily",
      channel: "landing",
      identifier: fingerprint,
    });
    if (!dailyLimit.allowed) {
      return new Response(JSON.stringify({ error: "Daily message limit reached." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" },
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "missing GEMINI_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cap context to last 20 messages
    const trimmed = messages.slice(-20);

    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-3.5-flash-lite",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...trimmed,
        ],
        max_tokens: 512,
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
