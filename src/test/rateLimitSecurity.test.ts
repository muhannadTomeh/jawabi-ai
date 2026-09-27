import { describe, expect, it, vi } from "vitest";
import {
  consumeRateLimit,
  getClientFingerprint,
  type RateLimitClient,
} from "../../supabase/functions/_shared/rateLimit";

describe("edge function rate limiting", () => {
  it("creates a stable fingerprint without exposing the raw IP address", async () => {
    const request = new Request("https://example.test", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });

    const first = await getClientFingerprint(request);
    const second = await getClientFingerprint(request);

    expect(first).toBe(second);
    expect(first).toHaveLength(24);
    expect(first).not.toContain("203.0.113.7");
  });

  it("does not log a violation when a request is allowed", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
      from: vi.fn(() => ({ insert })),
    } as unknown as RateLimitClient;

    const result = await consumeRateLimit(client, {
      bucketKey: "test:allowed",
      maxRequests: 2,
      windowSeconds: 60,
      limitType: "test",
    });

    expect(result).toEqual({ allowed: true });
    expect(insert).not.toHaveBeenCalled();
  });

  it("logs denied requests for operational visibility", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
      from: vi.fn(() => ({ insert })),
    } as unknown as RateLimitClient;

    const result = await consumeRateLimit(client, {
      bucketKey: "test:denied",
      maxRequests: 1,
      windowSeconds: 60,
      limitType: "test",
      channel: "web",
    });

    expect(result).toEqual({ allowed: false });
    expect(insert).toHaveBeenCalledOnce();
  });

  it("fails closed when the rate-limit store is unavailable", async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "database unavailable" } }),
      from: vi.fn(),
    } as unknown as RateLimitClient;

    await expect(consumeRateLimit(client, {
      bucketKey: "test:error",
      maxRequests: 1,
      windowSeconds: 60,
      limitType: "test",
    })).resolves.toEqual({ allowed: false, error: "rate_limit_unavailable" });
  });
});
