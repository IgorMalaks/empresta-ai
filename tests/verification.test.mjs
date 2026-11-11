import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  symlink,
  rm,
  access,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  aggregate,
  compare,
  digest,
  loadReport,
  markdown,
  safePath,
  sha256,
  sourceTree,
  specIds,
  validateReport,
} from "../scripts/verification/core.mjs";
import { createSnapshot } from "../scripts/verification/snapshot.mjs";

async function put(root, ref, value) {
  await mkdir(path.dirname(path.join(root, ref)), { recursive: true });
  await writeFile(path.join(root, ref), value);
}
async function fixture(
  t,
  specId = "006",
  roundId = "round-one",
  timestamp = "2026-01-01T00:00:00.000Z",
) {
  const root = await mkdtemp(path.join(os.tmpdir(), "verification-fixture-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const spec = `docs/specs/${specId}-fixture/spec.md`;
  await put(
    root,
    spec,
    `Status: APROVADA PARA IMPLEMENTAÇÃO\n${specIds(specId)
      .map((id) => `- ${id}: fixture requirement`)
      .join("\n")}\n`,
  );
  await put(root, "src/domain.mjs", "export const limit = 5;\n");
  await put(root, "rules/restrictions.md", "Independent review required.\n");
  const manifest = await createSnapshot(root, { specId, roundId, timestamp });
  const report = {
    ...manifest,
    review: {
      reviewer: "independent-session",
      implementer: "implementation-session",
      harness: "Nitro",
      context: "CLEAN",
      readOnly: true,
      productionIsolation: {
        status: "PENDENTE",
        reason: "No proven OS sandbox",
        evidenceIds: [],
      },
    },
    criteria: specIds(specId).map((id) => ({
      id,
      status: "PENDENTE",
      reason: "No real execution evidence yet",
      evidence: [],
    })),
    evidenceSnapshotSha256: digest([]),
    status: "PENDENTE",
    humanCommits: "PENDENTE",
  };
  return { root, report };
}
function refresh(report) {
  report.evidenceSnapshotSha256 = digest(
    report.criteria.flatMap((ca) =>
      ca.evidence.map((e) => ({ criterion: ca.id, ...e })),
    ),
  );
  const caStatus = aggregate(report.criteria);
  const isolation = report.review.productionIsolation.status;
  report.status =
    caStatus === "REPROVADO" || isolation === "REPROVADO"
      ? "REPROVADO"
      : caStatus === "PENDENTE" || isolation === "PENDENTE"
        ? "PENDENTE"
        : "APROVADO";
}
async function evidence(
  root,
  report,
  {
    index = 0,
    kind = "test",
    result = "PASS",
    content = "ok 1 fixture-test\n",
    source = false,
  } = {},
) {
  const ca = report.criteria[index];
  const ref = source
    ? "src/domain.mjs"
    : `${report.round.directory}/results/test-${index}.txt`;
  const snapshotPath = `${report.round.directory}/${source ? "snapshot" : "evidence"}/${ref}`;
  const data = source
    ? await readFile(path.join(root, ref))
    : Buffer.from(content);
  if (!source) {
    await put(root, ref, data);
    await put(root, snapshotPath, data);
  }
  const record = {
    id: `evidence-${index}`,
    kind,
    path: ref,
    snapshotPath,
    sha256: sha256(data),
    lines: [1, 1],
    testId: kind === "test" ? "fixture-test" : null,
    observation: "Fixture execution only, not product review",
    result,
    capturedAt: report.round.timestamp,
  };
  ca.evidence = [record];
  refresh(report);
  return record;
}

describe("fail-closed spec report validation", () => {
  for (const [spec, count] of [
    ["006", 8],
    ["007", 9],
    ["008", 10],
    ["009", 5],
  ]) {
    it(`should require exactly ${count} criteria for spec ${spec}`, async (t) => {
      const { root, report } = await fixture(t, spec);
      await validateReport(root, report);
      report.criteria.pop();
      await assert.rejects(validateReport(root, report), /all CA required/);
    });
  }
  it("should accept coherent pending format but block completion", async (t) => {
    const { root, report } = await fixture(t);
    assert.equal((await validateReport(root, report)).status, "PENDENTE");
    await assert.rejects(
      validateReport(root, report, { complete: true }),
      /acceptance blocked/,
    );
  });
  it("should reject the intentionally planted approval and accept its undo", async (t) => {
    const { root, report } = await fixture(t);
    const original = structuredClone(report);
    report.criteria[0].status = "APROVADO";
    await assert.rejects(
      validateReport(root, report, { complete: true }),
      /cannot approve without evidence/,
    );
    assert.equal(
      (await validateReport(root, original)).criteria[0].status,
      "PENDENTE",
    );
  });
  it("should reject approval based on source file existence alone", async (t) => {
    const { root, report } = await fixture(t);
    await evidence(root, report, {
      kind: "source",
      result: "OBSERVED",
      source: true,
    });
    report.criteria[0].status = "APROVADO";
    refresh(report);
    await assert.rejects(
      validateReport(root, report),
      /inspection alone cannot approve/,
    );
  });
  it("should require failed evidence for a rejection", async (t) => {
    const { root, report } = await fixture(t);
    report.criteria[0].status = "REPROVADO";
    refresh(report);
    await assert.rejects(
      validateReport(root, report),
      /rejection requires failed evidence/,
    );
    await evidence(root, report, {
      result: "FAIL",
      content: "not ok 1 fixture-test\n",
    });
    assert.equal((await validateReport(root, report)).status, "REPROVADO");
  });
  it("should reject duplicate and unknown criterion identifiers", async (t) => {
    const { root, report } = await fixture(t);
    report.criteria[1].id = report.criteria[0].id;
    await assert.rejects(validateReport(root, report), /duplicate CA/);
    report.criteria[1].id = "CA006-99";
    await assert.rejects(validateReport(root, report), /unknown/);
  });
  it("should reject untrusted command fields instead of executing them", async (t) => {
    const { root, report } = await fixture(t);
    report.command = "touch should-never-run";
    await assert.rejects(
      validateReport(root, report),
      /unexpected or missing fields/,
    );
    await assert.rejects(access(path.join(root, "should-never-run")));
  });
  it("should reject invalid aggregate and evidence digest", async (t) => {
    const { root, report } = await fixture(t);
    report.status = "APROVADO";
    await assert.rejects(
      validateReport(root, report),
      /aggregate status mismatch/,
    );
    report.status = "PENDENTE";
    report.evidenceSnapshotSha256 = "0".repeat(64);
    await assert.rejects(
      validateReport(root, report),
      /evidence snapshot digest mismatch/,
    );
  });
  it("should reject future or noncanonical timestamps and self-review", async (t) => {
    const { root, report } = await fixture(t);
    report.round.timestamp = "2099-01-01T00:00:00.000Z";
    await assert.rejects(validateReport(root, report), /UTC timestamp/);
    report.round.timestamp = "2026-01-01T00:00:00Z";
    await assert.rejects(validateReport(root, report), /UTC timestamp/);
    report.round.timestamp = "2026-01-01T00:00:00.000Z";
    report.review.reviewer = report.review.implementer;
    await assert.rejects(validateReport(root, report), /independent reviewer/);
  });
  it("should never approve unproven Nitro production isolation", async (t) => {
    const { root, report } = await fixture(t);
    for (let i = 0; i < report.criteria.length; i++) {
      await evidence(root, report, { index: i });
      report.criteria[i].status = "APROVADO";
    }
    refresh(report);
    await assert.rejects(
      validateReport(root, report, { complete: true }),
      /acceptance blocked/,
    );
    report.review.productionIsolation.status = "APROVADO";
    refresh(report);
    await assert.rejects(
      validateReport(root, report),
      /Nitro OS isolation unproven/,
    );
  });
  it("should allow complete only with every CA and externally proven isolation in a synthetic harness", async (t) => {
    const { root, report } = await fixture(t);
    for (let i = 0; i < report.criteria.length; i++) {
      await evidence(root, report, { index: i });
      report.criteria[i].status = "APROVADO";
    }
    const proof = await evidence(root, report, { index: 0, kind: "isolation" });
    // Preserve a test PASS for CA approval; the isolation is only a synthetic fixture.
    const testRecord = {
      ...proof,
      id: "test-0",
      kind: "test",
      testId: "fixture-test",
    };
    report.criteria[0].evidence.push(testRecord);
    report.review.harness = "synthetic-isolated-fixture";
    report.review.productionIsolation = {
      status: "APROVADO",
      reason: "Synthetic technical proof only",
      evidenceIds: [proof.id],
    };
    refresh(report);
    assert.equal(
      (await validateReport(root, report, { complete: true })).status,
      "APROVADO",
    );
  });
  it("should parse a persisted report without changing any file", async (t) => {
    const { root, report } = await fixture(t);
    const ref = `${report.round.directory}/report.json`;
    await put(root, ref, JSON.stringify(report));
    const before = await sourceTree(root);
    assert.equal((await loadReport(root, ref)).status, "PENDENTE");
    assert.deepEqual(await sourceTree(root), before);
  });
});

describe("evidence integrity and repository boundaries", () => {
  it("should validate line ranges and test identifiers against actual content", async (t) => {
    const { root, report } = await fixture(t);
    const e = await evidence(root, report);
    e.lines = [1, 100];
    refresh(report);
    await assert.rejects(validateReport(root, report), /lines outside content/);
    e.lines = [1, 1];
    e.testId = "missing-test";
    refresh(report);
    await assert.rejects(validateReport(root, report), /identifier missing/);
  });
  it("should reject changed evidence snapshots and live execution records", async (t) => {
    const { root, report } = await fixture(t);
    const e = await evidence(root, report);
    await put(root, e.path, "altered live output\n");
    await assert.rejects(validateReport(root, report), /stale evidence/);
    await put(root, e.snapshotPath, "altered snapshot\n");
    await assert.rejects(
      validateReport(root, report, { historical: true }),
      /snapshot hash mismatch/,
    );
  });
  it("should reject stale reports after changing relevant source, migrations, or rules", async (t) => {
    for (const ref of [
      "src/domain.mjs",
      "prisma/migrations/new/migration.sql",
      "rules/restrictions.md",
    ]) {
      const { root, report } = await fixture(t);
      await put(root, ref, "changed relevant source\n");
      await assert.rejects(validateReport(root, report), /stale report/);
      assert.equal(
        (await validateReport(root, report, { historical: true })).status,
        "PENDENTE",
      );
    }
  });
  it("should reject stale reports after source deletion", async (t) => {
    const { root, report } = await fixture(t);
    await rm(path.join(root, "src/domain.mjs"));
    await assert.rejects(validateReport(root, report), /stale report/);
  });
  it("should reject traversal, absolute paths, backslashes, and symlink ancestors", async (t) => {
    const { root } = await fixture(t);
    for (const ref of [
      "../outside.txt",
      "/etc/passwd",
      "src/../domain.mjs",
      "src\\domain.mjs",
      "src//domain.mjs",
      "file:stream",
    ])
      await assert.rejects(safePath(root, ref), /invalid repo-relative/);
    await symlink(
      path.join(root, "src"),
      path.join(root, "linked"),
      process.platform === "win32" ? "junction" : "dir",
    );
    await assert.rejects(
      safePath(root, "linked/domain.mjs"),
      /symlink forbidden/,
    );
  });
  it("should reject cross-round evidence references", async (t) => {
    const { root, report } = await fixture(t);
    const e = await evidence(root, report);
    e.snapshotPath = e.snapshotPath.replace("round-one", "round-other");
    refresh(report);
    await assert.rejects(validateReport(root, report), /own round snapshot/);
  });
  it("should reject evidence captured after review and PASS with FAIL contradiction", async (t) => {
    const { root, report } = await fixture(t);
    const e = await evidence(root, report);
    e.capturedAt = "2026-01-02T00:00:00.000Z";
    refresh(report);
    await assert.rejects(validateReport(root, report), /captured after review/);
    e.capturedAt = report.round.timestamp;
    e.result = "FAIL";
    report.criteria[0].status = "APROVADO";
    refresh(report);
    await assert.rejects(validateReport(root, report), /failed evidence/);
  });
});

describe("sanitized snapshots and comparable review rounds", () => {
  it("should include image pipeline code and invalidate a report after it changes", async (t) => {
    const { root } = await fixture(t);
    await put(root, "scripts/images/core.mjs", "export const width = 800;\n");
    await put(root, "docs/evidencias/review.json", "{}\n");
    const first = await sourceTree(root);
    assert.equal(Object.hasOwn(first.files, "scripts/images/core.mjs"), true);
    assert.equal(
      Object.hasOwn(first.files, "docs/evidencias/review.json"),
      false,
    );
    await put(root, "scripts/images/core.mjs", "export const width = 799;\n");
    assert.notEqual((await sourceTree(root)).sha256, first.sha256);
  });
  it("should exclude secrets, environment, dependencies, credentials, generated files, and real assets", async (t) => {
    const { root } = await fixture(t);
    const forbidden = [
      ".env",
      ".env.example",
      "node_modules/pkg/index.js",
      ".git/config",
      "public/photo.jpg",
      "assets/image.json",
      "credentials/config.json",
      "src/generated/prisma/client.ts",
    ];
    for (const ref of forbidden)
      await put(root, ref, "excluded private content\n");
    const manifest = await createSnapshot(root, {
      specId: "006",
      roundId: "sanitized",
    });
    for (const ref of forbidden)
      assert.equal(Object.hasOwn(manifest.sourceSnapshot.files, ref), false);
    assert.equal(
      await readFile(
        path.join(root, "artifacts/verification/.gitignore"),
        "utf8",
      ),
      "*\n",
    );
  });
  it("should reject potential hardcoded secrets and symlink output directories", async (t) => {
    const { root } = await fixture(t);
    const connection = [
      "postgresql",
      "://",
      "user",
      ":",
      "private-password",
      "@host/db",
    ].join("");
    await put(
      root,
      "src/config.ts",
      `const connection = ${JSON.stringify(connection)};\n`,
    );
    await assert.rejects(
      createSnapshot(root, { specId: "006", roundId: "unsafe" }),
      /potential secret/,
    );
    await rm(path.join(root, "src/config.ts"));
    await rm(path.join(root, "artifacts"), { recursive: true });
    await symlink(
      path.join(root, "src"),
      path.join(root, "artifacts"),
      process.platform === "win32" ? "junction" : "dir",
    );
    await assert.rejects(
      createSnapshot(root, { specId: "006", roundId: "unsafe" }),
      /unsafe output directory/,
    );
  });
  it("should reject duplicate snapshot IDs without overwriting the previous round", async (t) => {
    const { root, report } = await fixture(t);
    await assert.rejects(
      createSnapshot(root, { specId: "006", roundId: report.round.id }),
      /EEXIST/,
    );
    await validateReport(root, report);
  });
  it("should compare rejected and undone rounds coherently without accepting stale completion", async (t) => {
    const { root, report: first } = await fixture(t);
    first.criteria[0].status = "REPROVADO";
    await evidence(root, first, {
      result: "FAIL",
      content: "not ok 1 fixture-test planted-error\n",
    });
    await validateReport(root, first);
    await put(
      root,
      "src/domain.mjs",
      "export const limit = 4; // planted implementation fixture only\n",
    );
    const manifest = await createSnapshot(root, {
      specId: "006",
      roundId: "round-two",
      timestamp: "2026-01-02T00:00:00.000Z",
    });
    const second = { ...structuredClone(first), ...manifest };
    second.criteria[0].status = "APROVADO";
    await evidence(root, second);
    refresh(second);
    await validateReport(root, first, { historical: true });
    await validateReport(root, second);
    const output = compare(first, second);
    assert.match(output, /REPROVADO → PENDENTE/);
    assert.match(output, /mesmo hash/);
    assert.match(output, /CA006-01 \| REPROVADO \| APROVADO/);
    assert.match(markdown(first), /not|FAIL/);
    await assert.rejects(
      validateReport(root, first, { complete: true }),
      /stale report/,
    );
    assert.throws(() => compare(second, first), /chronological/);
    second.spec.sha256 = "a".repeat(64);
    assert.match(compare(first, second), /NÃO — requisitos mudaram/);
  });
});
