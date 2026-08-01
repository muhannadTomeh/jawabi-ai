// Shared fixed-window rate limiting backed by public.rate_limit_counters.
// All checks run BEFORE any paid/external API call.

// deno-lint-ignore no-explicit-any
type SupabaseLike = any;

export const DEFAULT_DAILY_LIMIT = 300;
export const IP_PER_MINUTE = 20;
export const CHATBOT_PER_MINUTE = 60;

export const RATE_LIMIT_MESSAGE =
  "تم الوصول للحد الأقصى المسموح من الرسائل حالياً، حاول لاحقاً";

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

async function allow(
  supabase: SupabaseLike,
  bucketKey: string,
  windowSeconds: number,
  maxRequests: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_and_increment_rate_limit", {
    p_bucket_key: bucketKey,
    p_window_seconds: windowSeconds,
    p_max_requests: maxRequests,
  });
  if (error) {
    // Fail open so a counter outage never takes the bot offline.
    console.error("rate_limit rpc error", error.message);
    return true;
  }
  return data !== false;
}

async function logViolation(
  supabase: SupabaseLike,
  row: {
    bucket_key: string;
    limit_type: string;
    chatbot_id?: string | null;
    channel?: string | null;
    identifier?: string | null;
  },
) {
  try {
    await supabase.from("rate_limit_violations").insert(row);
  } catch (e) {
    console.error("rate_limit violation log failed", e);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limitType?: "ip_per_minute" | "chatbot_per_minute" | "chatbot_daily";
}

export interface RateLimitOptions {
  chatbotId?: string | null;
  ip?: string | null;
  channel?: string;
  /** null/undefined falls back to DEFAULT_DAILY_LIMIT */
  dailyLimit?: number | null;
}

/**
 * Runs the protection layers in order: IP/minute -> chatbot/minute -> chatbot/day.
 * Returns as soon as one layer denies, and records the violation.
 */
export async function enforceRateLimits(
  supabase: SupabaseLike,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const { chatbotId, ip, channel } = opts;
  const daily = opts.dailyLimit ?? DEFAULT_DAILY_LIMIT;

  if (ip && ip !== "unknown") {
    const key = `ip:${ip}`;
    if (!(await allow(supabase, key, 60, IP_PER_MINUTE))) {
      await logViolation(supabase, {
        bucket_key: key,
        limit_type: "ip_per_minute",
        chatbot_id: chatbotId ?? null,
        channel: channel ?? null,
        identifier: ip,
      });
      return { allowed: false, limitType: "ip_per_minute" };
    }
  }

  if (chatbotId) {
    const minuteKey = `chatbot:${chatbotId}`;
    if (!(await allow(supabase, minuteKey, 60, CHATBOT_PER_MINUTE))) {
      await logViolation(supabase, {
        bucket_key: minuteKey,
        limit_type: "chatbot_per_minute",
        chatbot_id: chatbotId,
        channel: channel ?? null,
        identifier: ip ?? null,
      });
      return { allowed: false, limitType: "chatbot_per_minute" };
    }

    const dailyKey = `chatbot_daily:${chatbotId}`;
    if (!(await allow(supabase, dailyKey, 86400, daily))) {
      await logViolation(supabase, {
        bucket_key: dailyKey,
        limit_type: "chatbot_daily",
        chatbot_id: chatbotId,
        channel: channel ?? null,
        identifier: ip ?? null,
      });
      return { allowed: false, limitType: "chatbot_daily" };
    }
  }

  return { allowed: true };
}

export function rateLimitResponse(corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ error: RATE_LIMIT_MESSAGE, rate_limited: true }),
    {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    },
  );
}
