import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { before, after, describe, it } from "node:test";

const migration = await readFile(
  new URL(
    "../prisma/migrations/20261106000100_initial_domain/migration.sql",
    import.meta.url,
  ),
  "utf8",
);
let PGlite;
try {
  ({ PGlite } = await import("@electric-sql/pglite"));
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
}

// Single in-memory connection: real SQL execution, NOT evidence of concurrent locks.
describe(
  "domain SQL on local PGlite (not multi-connection concurrency)",
  {
    skip:
      !PGlite &&
      "Install the approved exact PGlite version to execute SQL tests",
  },
  () => {
    let db;
    before(async () => {
      db = new PGlite();
      await db.exec("CREATE ROLE anon; CREATE ROLE authenticated;");
      await db.exec(migration);
    });
    after(async () => {
      await db?.close();
    });
    let photo = 0;
    async function equipment(situacao = "disponivel") {
      photo += 1;
      const id = randomUUID();
      await db.query(
        `INSERT INTO public.equipments
      (id, patrimonio, nome, categoria, situacao, image_url, pexels_id, photographer, source_url, license_url, image_sha256)
      VALUES ($1, $2, 'Synthetic test equipment', 'notebook', $3, 'https://example.invalid/photo', $4,
      'Synthetic test', 'https://example.invalid/source', 'https://example.invalid/license', $5)`,
        [
          id,
          `TEST-${photo}`,
          situacao,
          photo,
          photo.toString(16).padStart(64, "0"),
        ],
      );
      return id;
    }
    async function request(user, item) {
      return (
        await db.query(
          "SELECT * FROM public.request_loan($1::uuid, $2::uuid)",
          [user, item],
        )
      ).rows[0];
    }
    async function historicalLoan(user, item, offset, returned = false) {
      await db.query(
        `INSERT INTO public.loans(user_id, equipment_id, requested_at, due_on, returned_at)
      SELECT $1, $2, stamp, public.loan_due_on((stamp AT TIME ZONE 'America/Sao_Paulo')::date),
        CASE WHEN $4 THEN clock_timestamp() ELSE NULL END
      FROM (SELECT clock_timestamp() - ($3::int * interval '1 day') AS stamp) AS fixture`,
        [user, item, offset, returned],
      );
    }

    it("should atomically create a loan and change equipment using database time", async () => {
      const item = await equipment();
      const user = randomUUID();
      const result = await request(user, item);
      assert.equal(result.code, "SUCCESS");
      assert.ok(result.loan_id);
      const {
        rows: [state],
      } = await db.query(
        `SELECT e.situacao, l.user_id,
      l.due_on = public.loan_due_on((l.requested_at AT TIME ZONE 'America/Sao_Paulo')::date) AS correct_due,
      abs(extract(epoch FROM clock_timestamp() - l.requested_at)) < 10 AS recent
      FROM public.loans l JOIN public.equipments e ON e.id = l.equipment_id WHERE l.id = $1`,
        [result.loan_id],
      );
      assert.deepEqual(state, {
        situacao: "emprestado",
        user_id: user,
        correct_due: true,
        recent: true,
      });
    });

    it("should refuse missing or invalid inputs without writing", async () => {
      assert.deepEqual(await request(null, randomUUID()), {
        code: "INVALID_REQUEST",
        loan_id: null,
        due_on: null,
      });
      assert.equal(
        (await request(randomUUID(), randomUUID())).code,
        "EQUIPMENT_NOT_FOUND",
      );
    });

    it("should reject maintenance and already borrowed equipment without adding loans", async () => {
      for (const state of ["manutencao", "emprestado"]) {
        const item = await equipment(state);
        assert.equal(
          (await request(randomUUID(), item)).code,
          "EQUIPMENT_UNAVAILABLE",
        );
        assert.equal(
          (
            await db.query(
              "SELECT count(*)::int AS n FROM public.loans WHERE equipment_id=$1",
              [item],
            )
          ).rows[0].n,
          0,
        );
      }
    });

    it("should count all five open loans and leave rejected equipment available", async () => {
      const user = randomUUID();
      for (let i = 0; i < 5; i += 1)
        assert.equal((await request(user, await equipment())).code, "SUCCESS");
      const item = await equipment();
      assert.equal((await request(user, item)).code, "LIMIT_REACHED");
      assert.equal(
        (
          await db.query("SELECT situacao FROM public.equipments WHERE id=$1", [
            item,
          ])
        ).rows[0].situacao,
        "disponivel",
      );
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM public.loans WHERE user_id=$1",
            [user],
          )
        ).rows[0].n,
        5,
      );
    });

    it("should block overdue loans even when five are already open", async () => {
      const user = randomUUID();
      await historicalLoan(user, await equipment(), 60);
      for (let i = 0; i < 4; i += 1)
        await historicalLoan(user, await equipment(), 0);
      assert.equal((await request(user, await equipment())).code, "OVERDUE");
    });

    it("should not count returned loans or block on their old due date", async () => {
      const user = randomUUID();
      for (let i = 0; i < 6; i += 1)
        await historicalLoan(user, await equipment(), 60, true);
      assert.equal((await request(user, await equipment())).code, "SUCCESS");
    });

    it("should allow an open loan due today on any valid business due date", async (t) => {
      // Request dates are selected by database clock; no client timestamp is accepted by the operation.
      const {
        rows: [calendar],
      } = await db.query(
        `SELECT extract(isodow FROM (clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date)::int AS weekday`,
      );
      // A valid due date cannot be a weekend. Boundary semantics are also tested for every weekday in date tests.
      if (calendar.weekday > 5) {
        t.skip(
          "Current Sao Paulo day is a weekend; valid business due dates cannot fall today",
        );
        return;
      }
      {
        const user = randomUUID();
        await db.query(
          `INSERT INTO public.loans(user_id, equipment_id, requested_at, due_on)
        SELECT $1, $2, (initial::timestamp AT TIME ZONE 'America/Sao_Paulo'), today
        FROM (SELECT today, today - n AS initial FROM
          (SELECT (clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date AS today) d,
          generate_series(1, 25) n WHERE public.loan_due_on(today - n) = today LIMIT 1) x`,
          [user, await equipment()],
        );
        assert.equal((await request(user, await equipment())).code, "SUCCESS");
      }
    });

    it("should enforce partial uniqueness but allow another loan after return", async () => {
      const item = await equipment();
      const user = randomUUID();
      await historicalLoan(user, item, 0);
      await assert.rejects(() => historicalLoan(randomUUID(), item, 0), {
        code: "23505",
      });
      await db.query(
        "UPDATE public.loans SET returned_at = clock_timestamp() WHERE equipment_id=$1",
        [item],
      );
      await historicalLoan(user, item, 0);
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM public.loans WHERE equipment_id=$1",
            [item],
          )
        ).rows[0].n,
        2,
      );
    });

    it("should enforce category, status, photo identity, dates and foreign keys", async () => {
      const item = await equipment();
      for (const sql of [
        "UPDATE public.equipments SET categoria='invalid' WHERE id=$1",
        "UPDATE public.equipments SET situacao='invalid' WHERE id=$1",
        "UPDATE public.equipments SET image_sha256='invalid' WHERE id=$1",
        "UPDATE public.equipments SET pexels_id=-1 WHERE id=$1",
      ])
        await assert.rejects(() => db.query(sql, [item]), { code: "23514" });
      const second = await equipment();
      for (const field of ["patrimonio", "pexels_id", "image_sha256"]) {
        await assert.rejects(
          () =>
            db.query(
              `UPDATE public.equipments SET ${field}=(SELECT ${field} FROM public.equipments WHERE id=$1) WHERE id=$2`,
              [item, second],
            ),
          { code: "23505" },
        );
      }
      await assert.rejects(
        () =>
          db.query(
            `INSERT INTO public.loans(user_id,equipment_id,due_on) VALUES ($1,$2,current_date)`,
            [randomUUID(), item],
          ),
        { code: "23514" },
      );
      await assert.rejects(
        () => historicalLoan(randomUUID(), randomUUID(), 0),
        { code: "23503" },
      );
      await historicalLoan(randomUUID(), item, 0);
      await assert.rejects(
        () =>
          db.query(
            "UPDATE public.loans SET returned_at=requested_at - interval '1 second' WHERE equipment_id=$1",
            [item],
          ),
        { code: "23514" },
      );
    });

    it("should roll back inserted loan when equipment update fails", async () => {
      const item = await equipment();
      await db.exec(`CREATE FUNCTION public.test_fail_update() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'synthetic update failure'; END $$;
      CREATE TRIGGER test_fail_update BEFORE UPDATE ON public.equipments FOR EACH ROW EXECUTE FUNCTION public.test_fail_update();`);
      try {
        await assert.rejects(
          () => request(randomUUID(), item),
          /synthetic update failure/,
        );
        assert.equal(
          (
            await db.query(
              "SELECT count(*)::int AS n FROM public.loans WHERE equipment_id=$1",
              [item],
            )
          ).rows[0].n,
          0,
        );
        assert.equal(
          (
            await db.query(
              "SELECT situacao FROM public.equipments WHERE id=$1",
              [item],
            )
          ).rows[0].situacao,
          "disponivel",
        );
      } finally {
        await db.exec(
          "DROP TRIGGER test_fail_update ON public.equipments; DROP FUNCTION public.test_fail_update();",
        );
      }
    });

    it("should reject stronger isolation rather than use a stale per-user snapshot", async () => {
      await db.exec("BEGIN ISOLATION LEVEL REPEATABLE READ");
      try {
        await assert.rejects(() => request(randomUUID(), randomUUID()), {
          code: "25000",
        });
      } finally {
        await db.exec("ROLLBACK");
      }
    });

    it("should enable RLS, expose no policies and revoke browser role privileges", async () => {
      const { rows } =
        await db.query(`SELECT relname, relrowsecurity FROM pg_class
      WHERE oid IN ('public.equipments'::regclass, 'public.loans'::regclass) ORDER BY relname`);
      assert.equal(rows.length, 2);
      assert.ok(rows.every((row) => row.relrowsecurity));
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM pg_policies WHERE schemaname='public' AND tablename IN ('equipments','loans')",
          )
        ).rows[0].n,
        0,
      );
      for (const role of ["anon", "authenticated"]) {
        for (const table of ["equipments", "loans"]) {
          assert.equal(
            (
              await db.query(
                "SELECT has_table_privilege($1,$2,'SELECT,INSERT,UPDATE,DELETE') AS allowed",
                [role, `public.${table}`],
              )
            ).rows[0].allowed,
            false,
          );
        }
        assert.equal(
          (
            await db.query(
              "SELECT has_function_privilege($1,'public.request_loan(uuid,uuid)','EXECUTE') AS allowed",
              [role],
            )
          ).rows[0].allowed,
          false,
        );
        await db.exec(`SET ROLE ${role}`);
        try {
          await assert.rejects(
            () =>
              db.query("SELECT * FROM public.request_loan($1::uuid,$2::uuid)", [
                randomUUID(),
                randomUUID(),
              ]),
            { code: "42501" },
          );
          await assert.rejects(() => db.query("SELECT * FROM public.loans"), {
            code: "42501",
          });
          await assert.rejects(
            () =>
              db.query("UPDATE public.equipments SET situacao='disponivel'"),
            { code: "42501" },
          );
        } finally {
          await db.exec("RESET ROLE");
        }
      }
    });
  },
);
