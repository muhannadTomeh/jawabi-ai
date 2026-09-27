import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { consumeRateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function embed(text: string): Promise<number[] | null> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured; cannot generate embedding");
    return null;
  }
  const cleaned = (text || "").trim();
  if (!cleaned) return null;
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text: cleaned.slice(0, 8000) }] },
        outputDimensionality: 1536,
      }),
    });
    if (!res.ok) {
      console.error("Gemini embeddings error:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data?.embedding?.values ?? null;
  } catch (e) {
    console.error("Embedding call failed:", e);
    return null;
  }
}

function combinedText(row: {
  title?: string | null;
  question?: string | null;
  answer?: string | null;
  content?: string | null;
}): string {
  return [row.title, row.question, row.answer, row.content]
    .filter((v) => v && String(v).trim().length > 0)
    .join("\n\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json", Allow: "POST" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const bearerToken = authHeader.replace(/^Bearer\s+/i, "");
    const isServiceRole = bearerToken.length > 0 && bearerToken === serviceRoleKey;
    let userId: string | null = null;

    if (!isServiceRole) {
      const userClient = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: userData, error: userError } = await userClient.auth.getUser();
      if (userError || !userData.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = userData.user.id;
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));
    const { text, item_id, backfill, chatbot_id } = body || {};

    // Backfill mode: iterate rows with null embedding and populate.
    if (backfill) {
      if (!isServiceRole) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      let query = admin
        .from("knowledge_items")
        .select("id, title, question, answer, content")
        .is("embedding", null)
        .limit(200);
      if (chatbot_id) query = query.eq("chatbot_id", chatbot_id);
      const { data: rows, error } = await query;
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      let updated = 0;
      for (const row of rows || []) {
        const emb = await embed(combinedText(row));
        if (!emb) continue;
        const { error: uErr } = await admin
          .from("knowledge_items")
          .update({ embedding: emb })
          .eq("id", row.id);
        if (!uErr) updated++;
      }
      return new Response(
        JSON.stringify({ ok: true, scanned: rows?.length || 0, updated }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Item mode: embed a specific knowledge_items row and store on it.
    if (item_id) {
      const { data: row, error } = await admin
        .from("knowledge_items")
        .select("id, chatbot_id, title, question, answer, content")
        .eq("id", item_id)
        .maybeSingle();
      if (error || !row) {
        return new Response(
          JSON.stringify({ error: error?.message || "not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (!isServiceRole) {
        const { data: chatbot } = await admin
          .from("chatbots")
          .select("user_id")
          .eq("id", row.chatbot_id)
          .maybeSingle();
        if (!chatbot || chatbot.user_id !== userId) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const minuteLimit = await consumeRateLimit(admin, {
          bucketKey: `embedding_user_minute:${userId}`,
          maxRequests: 30,
          windowSeconds: 60,
          limitType: "embedding_user_minute",
          chatbotId: row.chatbot_id,
          channel: "knowledge",
          identifier: userId ?? undefined,
        });
        if (!minuteLimit.allowed) {
          return new Response(JSON.stringify({ error: "Too many embedding requests" }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
          });
        }
      }

      const emb = await embed(combinedText(row));
      if (!emb) {
        return new Response(JSON.stringify({ embedding: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await admin
        .from("knowledge_items")
        .update({ embedding: emb })
        .eq("id", item_id);
      return new Response(JSON.stringify({ embedding: emb }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Text mode: just return the embedding.
    if (typeof text === "string") {
      if (!isServiceRole) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const emb = await embed(text);
      return new Response(JSON.stringify({ embedding: emb }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Provide 'text', 'item_id', or 'backfill: true'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-embedding error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
