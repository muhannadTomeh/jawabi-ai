import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Must be an admin
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Collect auth users (paginated)
    const authUsers: any[] = [];
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      authUsers.push(...(data?.users || []));
      if (!data || data.users.length < 200) break;
    }

    const [
      { data: profiles },
      { data: roles },
      { data: chatbots },
      { data: channels },
      { data: connections },
      { data: customers },
    ] = await Promise.all([
      admin.from("profiles").select("*").order("created_at", { ascending: false }),
      admin.from("user_roles").select("user_id, role"),
      admin
        .from("chatbots")
        .select(
          "id, user_id, name, is_active, business_name, business_category, business_location, onboarding_completed, bot_mode, created_at"
        ),
      admin.from("channels").select("chatbot_id, platform, is_connected"),
      admin.from("social_connections").select("chatbot_id, platform"),
      admin.from("customers").select("chatbot_id, message_count, last_seen_at"),
    ]);

    const byChatbot = new Map<string, string>();
    (chatbots || []).forEach((c: any) => byChatbot.set(c.id, c.user_id));

    const channelsByUser = new Map<string, Set<string>>();
    const addChannel = (chatbotId: string, platform: string) => {
      const uid = byChatbot.get(chatbotId);
      if (!uid) return;
      if (!channelsByUser.has(uid)) channelsByUser.set(uid, new Set());
      channelsByUser.get(uid)!.add(platform);
    };
    (channels || []).forEach((c: any) => c.is_connected && addChannel(c.chatbot_id, c.platform));
    (connections || []).forEach((c: any) => addChannel(c.chatbot_id, c.platform));

    const statsByUser = new Map<string, { messages: number; customers: number; last: string | null }>();
    (customers || []).forEach((c: any) => {
      const uid = byChatbot.get(c.chatbot_id);
      if (!uid) return;
      const cur = statsByUser.get(uid) || { messages: 0, customers: 0, last: null };
      cur.messages += c.message_count || 0;
      cur.customers += 1;
      if (!cur.last || (c.last_seen_at && c.last_seen_at > cur.last)) cur.last = c.last_seen_at;
      statsByUser.set(uid, cur);
    });

    const rolesMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));
    const authMap = new Map(authUsers.map((u) => [u.id, u]));

    // Include auth users even if they have no profile row
    const profileIds = new Set((profiles || []).map((p: any) => p.user_id));
    const rows = [
      ...(profiles || []),
      ...authUsers
        .filter((u) => !profileIds.has(u.id))
        .map((u) => ({ id: u.id, user_id: u.id, full_name: null, avatar_url: null, created_at: u.created_at })),
    ];

    const users = rows.map((p: any) => {
      const au = authMap.get(p.user_id);
      const bots = (chatbots || []).filter((c: any) => c.user_id === p.user_id);
      const stats = statsByUser.get(p.user_id) || { messages: 0, customers: 0, last: null };
      return {
        ...p,
        email: au?.email ?? null,
        phone: au?.phone ?? null,
        provider: au?.app_metadata?.provider ?? "email",
        email_confirmed_at: au?.email_confirmed_at ?? null,
        last_sign_in_at: au?.last_sign_in_at ?? null,
        signed_up_at: au?.created_at ?? p.created_at,
        banned_until: au?.banned_until ?? null,
        role: rolesMap.get(p.user_id) || "user",
        chatbots_count: bots.length,
        active_chatbots: bots.filter((b: any) => b.is_active).length,
        onboarding_completed: bots.some((b: any) => b.onboarding_completed),
        business_name: bots[0]?.business_name ?? null,
        business_category: bots[0]?.business_category ?? null,
        business_location: bots[0]?.business_location ?? null,
        chatbots: bots.map((b: any) => ({ id: b.id, name: b.name, is_active: b.is_active, bot_mode: b.bot_mode })),
        channels: Array.from(channelsByUser.get(p.user_id) || []),
        messages_count: stats.messages,
        customers_count: stats.customers,
        last_activity_at: stats.last,
      };
    });

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-users error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
