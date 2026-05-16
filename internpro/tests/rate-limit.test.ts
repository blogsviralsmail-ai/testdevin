import { describe, it, expect } from "vitest";
import { rateLimit, authRateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests within the limit", () => {
    const ip = `test-${Date.now()}`;
    const result = rateLimit(ip, 5, 60000);
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests exceeding the limit", () => {
    const ip = `test-block-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      rateLimit(ip, 5, 60000);
    }
    const result = rateLimit(ip, 5, 60000);
    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks remaining correctly", () => {
    const ip = `test-remaining-${Date.now()}`;
    const r1 = rateLimit(ip, 3, 60000);
    expect(r1.remaining).toBe(2);
    const r2 = rateLimit(ip, 3, 60000);
    expect(r2.remaining).toBe(1);
    const r3 = rateLimit(ip, 3, 60000);
    expect(r3.remaining).toBe(0);
  });
});

describe("authRateLimit", () => {
  it("uses a stricter limit (10 per minute)", () => {
    const ip = `auth-${Date.now()}`;
    for (let i = 0; i < 10; i++) {
      const r = authRateLimit(ip);
      expect(r.ok).toBe(true);
    }
    const blocked = authRateLimit(ip);
    expect(blocked.ok).toBe(false);
  });
});
