import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { chatbot_id, channel, external_id, last_message, conversation_history } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    const historyText = conversation_history
      ?.map((m: any) => `${m.role === 'assistant' ? 'Bot' : 'User'}: ${m.content}`)
      .join('\n') || '';

    const systemPrompt = `أنت خبير في تحليل سلوك العملاء وتصنيفهم.
مهمتك هي تصنيف العميل بناءً على سياق المحادثة الأخيرة.
يجب أن تختار تصنيفاً واحداً فقط من القائمة التالية:
- "committed_satisfied": عميل ملتزم وراضي (منتظم أو VIP).
- "important": عميل مهم جداً يتطلب عناية خاصة.
- "has_problems": عميل لديه مشاكل أو شكاوى يجب متابعتها.
- "prospect": عميل محتمل مهتم بالشراء.
- "blacklist": عميل مسيء أو يجب حظره.
- "new": عميل جديد لم يحدد اهتمامه بعد.

أجب بالكلمة البرمجية للتصنيف فقط (مثال: prospect).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "تاريخ المحادثة:\n" + historyText + "\n\nآخر رسالة: " + last_message },
        ],
        max_tokens: 20,
      }),
    });

    if (response.ok) {
      const aiData = await response.json();
      const classification = aiData.choices?.[0]?.message?.content?.trim().toLowerCase();
      
      const validClassifications = ["committed_satisfied", "important", "has_problems", "prospect", "blacklist", "new"];
      let finalClass = "new";
      for (const c of validClassifications) {
        if (classification.includes(c)) {
          finalClass = c;
          break;
        }
      }

      await supabase
        .from("customers")
        .update({ 
          ai_classification: finalClass,
          last_classification_at: new Date().toISOString()
        })
        .match({ chatbot_id, channel, external_id });

      return new Response(JSON.stringify({ classification: finalClass }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "AI failed" }), { status: 500, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
