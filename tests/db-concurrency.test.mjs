import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { lookup } from "node:dns/promises";
import { setTimeout as delay } from "node:timers/promises";
import { before, after, describe, it } from "node:test";

// HUMAN EXECUTION ONLY. Never run against production or through a production tunnel.
// Provision an EMPTY disposable local database named empresta_test_<suffix> first.
// Set EMPRESTA_TEST_DATABASE_URL locally and EMPRESTA_TEST_CONFIRM_DATABASE to its exact name.
// Then: EMPRESTA_RUN_PG_CONCURRENCY=1 node --test tests/db-concurrency.test.mjs
// No database/schema is dropped. Keep it for inspection; disposal is a separate human action.
// PGlite is intentionally never used for this multi-connection proof.
const enabled = process.env.EMPRESTA_RUN_PG_CONCURRENCY === "1";

describe(
  "real PostgreSQL multi-connection lock proof (human opt-in only)",
  {
    skip:
      !enabled &&
      "Requires human execution on an empty disposable loopback PostgreSQL database",
  },
  () => {
    let admin, first, second;
    before(async () => {
      const raw = process.env.EMPRESTA_TEST_DATABASE_URL;
      assert.ok(
        raw,
        "A dedicated local test URL is required; application DATABASE_URL is never read",
      );
      const url = new URL(raw);
      const host = url.hostname.replace(/^\[|\]$/g, "");
      assert.ok(
        ["postgres:", "postgresql:"].includes(url.protocol),
        "PostgreSQL protocol required",
      );
      assert.ok(
        ["localhost", "127.0.0.1", "::1"].includes(host),
        "Only literal loopback/localhost hosts are allowed",
      );
      assert.equal(
        url.search,
        "",
        "URL options are prohibited (no host, service or SSL overrides)",
      );
      assert.equal(url.hash, "", "URL fragments are prohibited");
      const database = decodeURIComponent(url.pathname.slice(1));
      assert.match(
        database,
        /^empresta_test_[a-z0-9_]+$/,
        "Disposable database naming is mandatory",
      );
      assert.equal(
        process.env.EMPRESTA_TEST_CONFIRM_DATABASE,
        database,
        "Human must confirm the exact disposable database name",
      );
      assert.ok(
        decodeURIComponent(url.username),
        "Explicit database user required",
      );
      const addresses = await lookup(host, { all: true });
      assert.ok(
        addresses.length &&
          addresses.every(({ address }) =>
            ["127.0.0.1", "::1"].includes(address),
          ),
        "Every DNS result must be loopback",
      );
      const { Client } = await import("pg");
      const config = {
        host,
        port: Number(url.port || 5432),
        database,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        ssl: false,
        connectionTimeoutMillis: 5000,
        application_name: "empresta-disposable-concurrency-test",
      };
      admin = new Client(config);
      first = new Client(config);
      second = new Client(config);
      await Promise.all([admin.connect(), first.connect(), second.connect()]);
      const {
        rows: [identity],
      } = await admin.query(`SELECT current_database() AS name,
      inet_server_addr()::text AS address, EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%'
          AND c.relkind IN ('r','p','v','m','S','f')
      ) OR EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
        WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%'
      ) AS occupied`);
      assert.equal(identity.name, database);
      assert.ok(
        ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(identity.address),
        "Server endpoint must also be loopback",
      );
      assert.equal(
        identity.occupied,
        false,
        "Refuse existing schemas/tables/functions: use a new empty disposable database",
      );
      for (const client of [admin, first, second]) {
        await client.query(
          "SET statement_timeout='15s'; SET lock_timeout='10s'; SET idle_in_transaction_session_timeout='20s'; SET default_transaction_isolation='read committed'",
        );
      }
      await admin.query(
        await readFile(
          new URL(
            "../prisma/migrations/20261106000100_initial_domain/migration.sql",
            import.meta.url,
          ),
          "utf8",
        ),
      );
    });
    after(async () => {
      await Promise.allSettled(
        [admin, first, second].filter(Boolean).map(async (client) => {
          try {
            await client.query("ROLLBACK");
          } finally {
            await client.end();
          }
        }),
      );
    });

    let counter = 0;
    async function equipment() {
      counter += 1;
      return (
        await admin.query(
          `INSERT INTO public.equipments
      (patrimonio,nome,categoria,image_url,pexels_id,photographer,source_url,license_url,image_sha256)
      VALUES ($1,'Synthetic concurrency test','cabo','https://example.invalid/photo',$2,
        'Synthetic test','https://example.invalid/source','https://example.invalid/license',$3) RETURNING id`,
          [
            `CONCURRENCY-${counter}`,
            counter,
            counter.toString(16).padStart(64, "0"),
          ],
        )
      ).rows[0].id;
    }
    const request = (client, user, item) =>
      client.query("SELECT * FROM public.request_loan($1::uuid,$2::uuid)", [
        user,
        item,
      ]);

    async function race(userA, itemA, userB, itemB) {
      const pidA = (await first.query("SELECT pg_backend_pid() AS pid")).rows[0]
        .pid;
      const pidB = (await second.query("SELECT pg_backend_pid() AS pid"))
        .rows[0].pid;
      await first.query("BEGIN");
      let waiting;
      try {
        const winner = (await request(first, userA, itemA)).rows[0];
        assert.equal(winner.code, "SUCCESS");
        // Start a genuinely independent session while first still holds transaction locks.
        // Attach rejection handler immediately, so timeout failure cannot become unhandled.
        waiting = request(second, userB, itemB).then(
          (value) => ({ value }),
          (error) => ({ error }),
        );
        let blocked = false;
        const deadline = Date.now() + 5000;
        while (Date.now() < deadline) {
          const {
            rows: [row],
          } = await admin.query(
            `SELECT $1::int = ANY(pg_blocking_pids($2::int)) AS blocked`,
            [pidA, pidB],
          );
          if (row.blocked) {
            blocked = true;
            break;
          }
          await delay(25);
        }
        assert.equal(
          blocked,
          true,
          "Must observe the competing backend blocked by the first transaction",
        );
        await first.query("COMMIT");
        const outcome = await waiting;
        if (outcome.error) throw outcome.error;
        return { winner, loser: outcome.value.rows[0] };
      } finally {
        await first.query("ROLLBACK");
        if (waiting) await waiting;
      }
    }

    it("should serialize two users requesting the same equipment and create exactly one open loan", async () => {
      const item = await equipment();
      const result = await race(randomUUID(), item, randomUUID(), item);
      assert.equal(result.loser.code, "EQUIPMENT_UNAVAILABLE");
      assert.equal(
        (
          await admin.query(
            "SELECT count(*)::int AS n FROM public.loans WHERE equipment_id=$1 AND returned_at IS NULL",
            [item],
          )
        ).rows[0].n,
        1,
      );
      assert.equal(
        (
          await admin.query(
            "SELECT situacao FROM public.equipments WHERE id=$1",
            [item],
          )
        ).rows[0].situacao,
        "emprestado",
      );
    });

    it("should serialize one user at four open loans requesting two different items and stop at five", async () => {
      const user = randomUUID();
      for (let i = 0; i < 4; i += 1)
        assert.equal(
          (await request(admin, user, await equipment())).rows[0].code,
          "SUCCESS",
        );
      const itemA = await equipment();
      const itemB = await equipment();
      const result = await race(user, itemA, user, itemB);
      assert.equal(result.loser.code, "LIMIT_REACHED");
      assert.equal(
        (
          await admin.query(
            "SELECT count(*)::int AS n FROM public.loans WHERE user_id=$1 AND returned_at IS NULL",
            [user],
          )
        ).rows[0].n,
        5,
      );
      assert.equal(
        (
          await admin.query(
            "SELECT situacao FROM public.equipments WHERE id=$1",
            [itemB],
          )
        ).rows[0].situacao,
        "disponivel",
      );
    });
  },
);
