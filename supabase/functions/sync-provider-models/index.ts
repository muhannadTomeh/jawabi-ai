import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Verify user is admin
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roleData } = await supabaseClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!roleData) throw new Error("Forbidden: Admin only");

    // 2. Parse request
    const { provider_key } = await req.json();
    if (!provider_key) throw new Error("provider_key is required");

    const { data: provider, error: pErr } = await supabaseClient
      .from("api_providers")
      .select("*")
      .eq("provider_key", provider_key)
      .single();

    if (pErr || !provider) throw new Error("Provider not found");

    const apiKey = provider.api_key || Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey && provider_key !== 'lovable_gateway') throw new Error("API Key not found for provider");

    let models: any[] = [];

    if (provider_key === "openai") {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      models = data.data
        .filter((m: any) => m.id.startsWith("gpt-") && !m.id.includes("vision") && !m.id.includes("instruct"))
        .map((m: any) => ({ model_id: m.id, display_name: m.id }));
    } else if (provider_key === "google") {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      models = data.models
        .filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
        .map((m: any) => ({ model_id: m.name.replace("models/", ""), display_name: m.displayName || m.name }));
    } else if (provider_key === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      models = data.data.map((m: any) => ({ model_id: m.id, display_name: m.display_name || m.id }));
    } else if (provider_key === "lovable_gateway") {
      // Static list as fallback if no models endpoint
      models = [
        { model_id: "google/gemini-2.5-flash", display_name: "Gemini 2.5 Flash" },
        { model_id: "google/gemini-2.5-pro", display_name: "Gemini 2.5 Pro" },
        { model_id: "openai/gpt-4o", display_name: "GPT-4o" },
        { model_id: "openai/gpt-4o-mini", display_name: "GPT-4o mini" },
      ];
    }

    if (models.length > 0) {
      // Update DB
      await supabaseClient.from("api_provider_models").delete().eq("provider_id", provider.id);
      await supabaseClient.from("api_provider_models").insert(
        models.map(m => ({ ...m, provider_id: provider.id }))
      );
      await supabaseClient.from("api_providers").update({
        last_models_sync_at: new Date().toISOString(),
        last_validated_at: new Date().toISOString(),
      }).eq("id", provider.id);
    }

    return new Response(JSON.stringify({ success: true, count: models.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
