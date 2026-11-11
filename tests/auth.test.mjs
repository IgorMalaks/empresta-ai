import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isAllowedOrigin } from "../src/server/auth/origin.ts";
import { getAuthConfig } from "../src/server/auth/config.ts";

describe("action origin", () => {
  it("should reject missing origin", () =>
    assert.equal(isAllowedOrigin(null, "https://app.example", false), false));
  it("should accept the canonical production origin", () =>
    assert.equal(
      isAllowedOrigin("https://app.example", "https://app.example", false),
      true,
    ));
  it("should reject a different production origin", () =>
    assert.equal(
      isAllowedOrigin("https://evil.example", "https://app.example", false),
      false,
    ));
  it("should reject production without configured canonical url", () =>
    assert.equal(
      isAllowedOrigin("http://localhost:3000", undefined, false),
      false,
    ));
  it("should accept localhost only in development", () =>
    assert.equal(
      isAllowedOrigin("http://localhost:3000", undefined, true),
      true,
    ));
  it("should reject localhost suffix attacks", () =>
    assert.equal(
      isAllowedOrigin("http://localhost.evil.example:3000", undefined, true),
      false,
    ));
  it("should reject malformed urls", () =>
    assert.equal(isAllowedOrigin("not a url", "bad", false), false));
});

describe("auth configuration", () => {
  it("should fail closed without auth configuration", () => {
    const before = {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_PUBLISHABLE_KEY,
    };
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    try {
      assert.throws(() => getAuthConfig(), /não configurada/);
    } finally {
      if (before.url !== undefined) process.env.SUPABASE_URL = before.url;
      if (before.key !== undefined)
        process.env.SUPABASE_PUBLISHABLE_KEY = before.key;
    }
  });
});
