import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_url, title } = await req.json();
    if (!image_url) {
      return new Response(JSON.stringify({ error: "image_url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openAiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!openAiApiKey) {
      return new Response(JSON.stringify({ description: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-3.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "أنت محلل صور خبير. صف الصورة بالعربية بشكل تفصيلي ومنظم، واستخرج أي نصوص أو أرقام أو معلومات مهمة فيها (OCR). اجعل الوصف غنياً بحيث يمكن لمساعد ذكي الإجابة على أسئلة حول محتوى الصورة دون رؤيتها.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: `العنوان: ${title || "بدون عنوان"}\nاوصف هذه الصورة:` },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI vision error:", aiRes.status, txt);
      return new Response(JSON.stringify({ description: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const description = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-image error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
