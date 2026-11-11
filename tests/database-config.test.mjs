import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { databaseConfig } from "../src/server/db/config.ts";
import { supabaseDatabaseCa } from "../src/server/db/supabase-ca.ts";

const project = "https://example.supabase.co";

describe("database transport boundary", () => {
  it("should require verified TLS for Supabase production", () =>
    assert.deepEqual(
      databaseConfig(
        "postgresql://db.example.supabase.co/postgres",
        true,
        project,
      ).ssl,
      { rejectUnauthorized: true, ca: supabaseDatabaseCa },
    ));
  it("should reject an explicit SSL disable option", () =>
    assert.throws(() =>
      databaseConfig(
        "postgresql://db.example.supabase.co/postgres?sslmode=disable",
        true,
        project,
      ),
    ));
  it("should reject production on loopback", () =>
    assert.throws(() =>
      databaseConfig("postgresql://localhost/test", true, project),
    ));
  it("should allow plaintext only for local development", () =>
    assert.equal(
      databaseConfig("postgresql://localhost/test", false).ssl,
      false,
    ));
  it("should reject URL host overrides", () =>
    assert.throws(() =>
      databaseConfig(
        "postgresql://db.example.supabase.co/postgres?host=evil.example",
        true,
        project,
      ),
    ));
  it("should reject an unrelated database protocol", () =>
    assert.throws(() => databaseConfig("https://example.com", false)));
  it("should reject a missing connection string without leaking it", () =>
    assert.throws(() => databaseConfig(undefined, true), /não configurado/));
  it("requires Auth and the database to belong to the same Supabase project", () => {
    const pooler =
      "postgresql://postgres.example@aws-0-us-east-2.pooler.supabase.com:6543/postgres";
    assert.deepEqual(databaseConfig(pooler, true, project).ssl, {
      rejectUnauthorized: true,
      ca: supabaseDatabaseCa,
    });
    assert.throws(() =>
      databaseConfig(pooler, true, "https://other.supabase.co"),
    );
  });
});
