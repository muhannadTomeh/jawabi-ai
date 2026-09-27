type RpcResult = {
  data: unknown;
  error: { message?: string } | null;
};

type InsertResult = {
  error: { message?: string } | null;
};

export type RateLimitClient = {
  rpc: (
    functionName: string,
    args: Record<string, unknown>,
  ) => PromiseLike<RpcResult>;
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => PromiseLike<InsertResult>;
  };
};

export type RateLimitOptions = {
  bucketKey: string;
  maxRequests: number;
  windowSeconds: number;
  limitType: string;
  chatbotId?: string;
  channel?: string;
  identifier?: string;
};

export async function getClientFingerprint(req: Request): Promise<string> {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwardedFor ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown";
  const encoded = new TextEncoder().encode(address.slice(0, 128));
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .slice(0, 12)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function consumeRateLimit(
  client: RateLimitClient,
  options: RateLimitOptions,
): Promise<{ allowed: boolean; error?: string }> {
  const { data, error } = await client.rpc("check_and_increment_rate_limit", {
    p_bucket_key: options.bucketKey,
    p_window_seconds: options.windowSeconds,
    p_max_requests: options.maxRequests,
  });

  if (error) {
    console.error("Rate limit RPC failed:", error.message);
    return { allowed: false, error: "rate_limit_unavailable" };
  }

  const allowed = data === true;
  if (!allowed) {
    const { error: logError } = await client.from("rate_limit_violations").insert({
      bucket_key: options.bucketKey,
      limit_type: options.limitType,
      chatbot_id: options.chatbotId ?? null,
      channel: options.channel ?? null,
      identifier: options.identifier ?? null,
    });
    if (logError) console.error("Rate limit violation log failed:", logError.message);
  }

  return { allowed };
}
