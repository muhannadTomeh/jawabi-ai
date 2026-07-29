import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const targetUserId = typeof body?.target_user_id === "string" ? body.target_user_id : null;
    const redirectTo = typeof body?.redirect_to === "string" ? body.redirect_to : null;
    const reason = typeof body?.reason === "string" ? body.reason.slice(0, 500) : null;

    if (!targetUserId) return json({ error: "target_user_id is required" }, 400);
    if (targetUserId === userData.user.id) return json({ error: "لا يمكنك الدخول لحسابك أنت" }, 400);

    const { data: targetRes, error: targetErr } = await admin.auth.admin.getUserById(targetUserId);
    if (targetErr || !targetRes?.user?.email) return json({ error: "المستخدم غير موجود أو بلا بريد" }, 404);

    const targetEmail = targetRes.user.email;

    // Generate a one-time sign-in link WITHOUT sending any email to the user.
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: targetEmail,
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (linkErr || !linkData?.properties?.action_link) {
      return json({ error: linkErr?.message || "تعذّر إنشاء رابط الدخول" }, 500);
    }

    await admin.from("admin_audit_log").insert({
      action: "impersonate",
      admin_user_id: userData.user.id,
      admin_email: userData.user.email ?? null,
      target_user_id: targetUserId,
      target_email: targetEmail,
      details: { reason, redirect_to: redirectTo },
      ip_address:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("cf-connecting-ip"),
      user_agent: req.headers.get("user-agent"),
    });

    return json({ action_link: linkData.properties.action_link, target_email: targetEmail });
  } catch (e) {
    console.error("admin-impersonate error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});