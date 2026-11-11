import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, after, describe, it } from "node:test";

let PGlite;
try {
  ({ PGlite } = await import("@electric-sql/pglite"));
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
}

describe(
  "business dates executed in PostgreSQL WASM",
  {
    skip:
      !PGlite &&
      "Install the approved exact PGlite version to execute date SQL",
  },
  () => {
    let db;
    before(async () => {
      db = new PGlite();
      await db.exec(
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
      await db?.close();
    });

    for (const [initial, expected] of [
      ["2026-11-06", "2026-11-26"], // Friday
      ["2026-11-07", "2026-11-26"], // Saturday
      ["2026-11-08", "2026-11-26"], // Sunday
      ["2026-11-09", "2026-11-27"], // Monday
      ["2026-01-30", "2026-02-19"],
      ["2026-12-18", "2027-01-07"], // Christmas and Jan 1 count
      ["2024-02-16", "2024-03-07"], // Leap day
    ]) {
      it(`should add fourteen weekdays excluding ${initial} and return ${expected}`, async () => {
        assert.equal(
          (
            await db.query("SELECT public.loan_due_on($1::date)::text AS due", [
              initial,
            ])
          ).rows[0].due,
          expected,
        );
      });
    }

    it("should count exactly fourteen weekdays for every start date across leap and year boundaries", async () => {
      const {
        rows: [result],
      } = await db.query(`SELECT bool_and(
      (SELECT count(*) FROM generate_series(1, public.loan_due_on(d::date) - d::date) n
        WHERE extract(isodow FROM d::date + n) <= 5) = 14
      AND extract(isodow FROM public.loan_due_on(d::date)) <= 5
      AND public.loan_due_on(d::date) > d::date
    ) AS valid FROM generate_series('2023-12-01'::date, '2025-01-10'::date, interval '1 day') d`);
      assert.equal(result.valid, true);
    });

    it("should use Sao Paulo civil date rather than UTC across midnight", async () => {
      for (const timezone of ["UTC", "Asia/Tokyo"]) {
        await db.exec(`SET TIME ZONE '${timezone}'`);
        const {
          rows: [result],
        } = await db.query(`SELECT
        ('2026-11-07T02:59:59Z'::timestamptz AT TIME ZONE 'America/Sao_Paulo')::date::text AS before,
        ('2026-11-07T03:00:00Z'::timestamptz AT TIME ZONE 'America/Sao_Paulo')::date::text AS after`);
        assert.deepEqual(result, { before: "2026-11-06", after: "2026-11-07" });
      }
    });

    it("should allow the entire due date and mark overdue only after Sao Paulo midnight", async () => {
      const { rows } = await db.query(`SELECT stamp,
      '2026-11-06'::date < (stamp::timestamptz AT TIME ZONE 'America/Sao_Paulo')::date AS overdue
      FROM (VALUES ('2026-11-06T03:00:00Z'), ('2026-11-07T02:59:59.999999Z'), ('2026-11-07T03:00:00Z')) samples(stamp)
      ORDER BY stamp`);
      assert.deepEqual(
        rows.map((row) => row.overdue),
        [false, false, true],
      );
    });
  },
);
