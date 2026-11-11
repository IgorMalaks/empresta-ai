import { createHash } from "node:crypto";
import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import path from "node:path";

export const COUNTS = Object.freeze({
  "006": 8,
  "007": 9,
  "008": 10,
  "009": 5,
  "010": 5,
});
export const STATUSES = ["APROVADO", "REPROVADO", "PENDENTE"];
export const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");
export const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};
export const digest = (value) => sha256(canonical(value));
export function assert(condition, message) {
  if (!condition) throw new Error(message);
}
export function exactKeys(value, keys, label) {
  assert(
    value && typeof value === "object" && !Array.isArray(value),
    `${label}: object required`,
  );
  assert(
    Object.keys(value).sort().join("|") === [...keys].sort().join("|"),
    `${label}: unexpected or missing fields`,
  );
}
export function text(value, label) {
  assert(
    typeof value === "string" &&
      value.trim().length > 0 &&
      value.length <= 20000,
    `${label}: nonempty text required`,
  );
}
export function hash(value, label) {
  assert(
    typeof value === "string" && /^[a-f0-9]{64}$/.test(value),
    `${label}: sha256 required`,
  );
}
export function relative(value) {
  assert(
    typeof value === "string" &&
      value.length > 0 &&
      value.length < 1024 &&
      !value.includes("\\") &&
      !/[\x00-\x1f]/.test(value) &&
      !path.posix.isAbsolute(value) &&
      value
        .split("/")
        .every(
          (part) =>
            part && part !== "." && part !== ".." && !part.includes(":"),
        ),
    "invalid repo-relative path",
  );
  return value;
}
export async function safePath(root, ref) {
  relative(ref);
  const base = await realpath(root);
  let cursor = base;
  for (const part of ref.split("/")) {
    cursor = path.join(cursor, part);
    const stat = await lstat(cursor);
    assert(!stat.isSymbolicLink(), `symlink forbidden: ${ref}`);
  }
  const resolved = await realpath(cursor);
  assert(
    resolved.startsWith(`${base}${path.sep}`),
    `path outside root: ${ref}`,
  );
  assert((await lstat(resolved)).isFile(), `regular file required: ${ref}`);
  assert(
    (await lstat(resolved)).size <= 8 * 1024 * 1024,
    `file too large: ${ref}`,
  );
  return resolved;
}
export async function readSafe(root, ref) {
  return readFile(await safePath(root, ref));
}
const EXCLUDED = new Set([
  "node_modules",
  ".git",
  ".next",
  ".next-build-verify",
  "out",
  "coverage",
  "artifacts",
  "generated",
  "assets",
  "public",
  "images",
  "credentials",
  "secrets",
]);
const EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".json",
  ".sql",
  ".prisma",
  ".md",
  ".yml",
  ".yaml",
  ".css",
  ".txt",
]);
export function permitted(ref) {
  relative(ref);
  const parts = ref.split("/");
  return (
    !parts.some(
      (part) =>
        (EXCLUDED.has(part) &&
          !(part === "images" && parts[0] === "scripts")) ||
        part.startsWith(".env") ||
        /(?:secret|credential|private[-_]?key|\.pem$|\.key$|\.log$)/i.test(
          part,
        ),
    ) &&
    !ref.startsWith("Aula") &&
    (EXTENSIONS.has(path.posix.extname(ref)) ||
      [
        "AGENTS.md",
        ".gitignore",
        ".editorconfig",
        ".prettierignore",
        ".cursorrules",
        ".windsurfrules",
      ].includes(ref))
  );
}
export function sanitized(buffer, label) {
  const content = buffer.toString("utf8");
  assert(
    !content.includes("\u0000") && Buffer.from(content).equals(buffer),
    `non-text file forbidden: ${label}`,
  );
  assert(
    !/-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:sk_live_|sb_secret_|AKIA)[A-Za-z0-9_/-]{10,}|\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|(?:postgres(?:ql)?|mysql):\/\/[^\s/]+:[^\s@]+@|(?:password|api[_-]?key|access[_-]?token|service[_-]?role[_-]?key)\s*[:=]\s*["'][^"'\s]{12,}["']/i.test(
      content,
    ),
    `potential secret forbidden: ${label}`,
  );
  return content;
}
export async function sourceTree(root) {
  const files = {};
  async function walk(prefix = "") {
    for (const entry of (
      await readdir(path.join(root, prefix), { withFileTypes: true })
    ).sort((a, b) => a.name.localeCompare(b.name))) {
      const ref = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (
          (!EXCLUDED.has(entry.name) || ref === "scripts/images") &&
          ref !== "docs/evidencias" &&
          !entry.name.startsWith(".env") &&
          !ref.startsWith("Aula") &&
          !/(?:secret|credential)/i.test(entry.name)
        )
          await walk(ref);
      } else if (permitted(ref)) {
        assert(!entry.isSymbolicLink(), `symlink forbidden: ${ref}`);
        const buffer = await readSafe(root, ref);
        sanitized(buffer, ref);
        files[ref] = sha256(buffer);
      }
    }
  }
  await walk();
  return { sha256: digest(files), files };
}
export function specIds(id) {
  assert(Object.hasOwn(COUNTS, id), "unsupported spec");
  return Array.from(
    { length: COUNTS[id] },
    (_, i) => `CA${id}-${String(i + 1).padStart(2, "0")}`,
  );
}
export function criterionIds(content) {
  return [...content.matchAll(/^\s*- (CA\d{3}-\d{2}):/gm)].map(
    (match) => match[1],
  );
}
export function aggregate(criteria) {
  return criteria.some((ca) => ca.status === "REPROVADO")
    ? "REPROVADO"
    : criteria.some((ca) => ca.status === "PENDENTE")
      ? "PENDENTE"
      : "APROVADO";
}
function isoDate(value, label) {
  assert(
    typeof value === "string" &&
      /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString() === value &&
      Date.parse(value) <= Date.now() + 60000,
    `${label}: valid UTC timestamp required`,
  );
}
export async function validateReport(
  root,
  report,
  { historical = false, complete = false } = {},
) {
  exactKeys(
    report,
    [
      "schemaVersion",
      "round",
      "spec",
      "sourceSnapshot",
      "review",
      "criteria",
      "evidenceSnapshotSha256",
      "status",
      "humanCommits",
    ],
    "report",
  );
  assert(report.schemaVersion === 1, "unsupported schema version");
  exactKeys(report.round, ["id", "timestamp", "directory"], "round");
  assert(
    /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(report.round.id),
    "invalid round id",
  );
  isoDate(report.round.timestamp, "round timestamp");
  assert(
    report.round.directory === `artifacts/verification/${report.round.id}`,
    "round directory mismatch",
  );
  exactKeys(report.spec, ["id", "path", "sha256"], "spec");
  const expected = specIds(report.spec.id);
  assert(
    new RegExp(`^docs/specs/${report.spec.id}-[a-z0-9-]+/spec\\.md$`).test(
      report.spec.path,
    ),
    "spec path mismatch",
  );
  hash(report.spec.sha256, "spec");
  exactKeys(report.sourceSnapshot, ["sha256", "files"], "sourceSnapshot");
  hash(report.sourceSnapshot.sha256, "sourceSnapshot");
  const files = report.sourceSnapshot.files;
  assert(
    files &&
      typeof files === "object" &&
      !Array.isArray(files) &&
      Object.keys(files).length > 0,
    "source files required",
  );
  for (const [ref, value] of Object.entries(files)) {
    assert(permitted(ref), `disallowed snapshot path: ${ref}`);
    hash(value, ref);
    const data = await readSafe(
      root,
      `${report.round.directory}/snapshot/${ref}`,
    );
    sanitized(data, ref);
    assert(sha256(data) === value, `archived source changed: ${ref}`);
  }
  assert(
    files[report.spec.path] === report.spec.sha256,
    "spec missing from source snapshot",
  );
  assert(
    digest(files) === report.sourceSnapshot.sha256,
    "source snapshot hash mismatch",
  );
  const specData = await readSafe(
    root,
    `${report.round.directory}/snapshot/${report.spec.path}`,
  );
  assert(
    canonical(criterionIds(specData.toString())) === canonical(expected),
    "spec CA coverage changed",
  );
  assert(
    /Status: APROVADA PARA IMPLEMENTAÇÃO/.test(specData.toString()),
    "spec not approved for implementation",
  );
  if (!historical) {
    const current = await sourceTree(root);
    assert(
      canonical(current) === canonical(report.sourceSnapshot),
      "stale report: relevant source tree changed",
    );
  }
  exactKeys(
    report.review,
    [
      "reviewer",
      "implementer",
      "harness",
      "context",
      "readOnly",
      "productionIsolation",
    ],
    "review",
  );
  text(report.review.reviewer, "reviewer");
  text(report.review.implementer, "implementer");
  assert(
    report.review.reviewer !== report.review.implementer,
    "independent reviewer required",
  );
  text(report.review.harness, "harness");
  assert(
    report.review.context === "CLEAN" && report.review.readOnly === true,
    "clean read-only review required",
  );
  exactKeys(
    report.review.productionIsolation,
    ["status", "reason", "evidenceIds"],
    "productionIsolation",
  );
  const isolation = report.review.productionIsolation;
  assert(STATUSES.includes(isolation.status), "invalid isolation status");
  text(isolation.reason, "isolation reason");
  assert(
    Array.isArray(isolation.evidenceIds) &&
      isolation.evidenceIds.every((id) => typeof id === "string"),
    "isolation evidence IDs required",
  );
  assert(
    !/nitro/i.test(report.review.harness) || isolation.status === "PENDENTE",
    "Nitro OS isolation unproven: must remain PENDENTE",
  );
  assert(
    report.humanCommits === "PENDENTE",
    "human commits are pending in this git-free delivery",
  );
  assert(
    Array.isArray(report.criteria) &&
      report.criteria.length === expected.length,
    "all CA required",
  );
  const ids = new Set();
  const evidenceIds = new Map();
  const evidenceRecords = [];
  for (const ca of report.criteria) {
    exactKeys(ca, ["id", "status", "reason", "evidence"], "criterion");
    assert(
      expected.includes(ca.id) && !ids.has(ca.id),
      `unknown or duplicate CA: ${ca.id}`,
    );
    ids.add(ca.id);
    assert(STATUSES.includes(ca.status), `invalid CA status: ${ca.id}`);
    text(ca.reason, `${ca.id} reason`);
    assert(Array.isArray(ca.evidence), `${ca.id}: evidence array required`);
    assert(
      ca.status !== "APROVADO" || ca.evidence.length > 0,
      `${ca.id}: cannot approve without evidence`,
    );
    for (const evidence of ca.evidence) {
      exactKeys(
        evidence,
        [
          "id",
          "kind",
          "path",
          "snapshotPath",
          "sha256",
          "lines",
          "testId",
          "observation",
          "result",
          "capturedAt",
        ],
        "evidence",
      );
      text(evidence.id, "evidence id");
      assert(!evidenceIds.has(evidence.id), "duplicate evidence id");
      assert(
        ["source", "test", "human", "isolation"].includes(evidence.kind),
        "invalid evidence kind",
      );
      relative(evidence.path);
      assert(
        permitted(
          evidence.path.replace(
            /^artifacts\/verification\/[a-zA-Z0-9_-]+\/(?:evidence|snapshot|results)\//,
            "",
          ),
        ),
        "unsafe evidence file",
      );
      const sourceEvidence = Object.hasOwn(files, evidence.path);
      const prefix = `${report.round.directory}/${sourceEvidence ? "snapshot" : "evidence"}/`;
      assert(
        evidence.snapshotPath === `${prefix}${evidence.path}`,
        "evidence must use own round snapshot path",
      );
      hash(evidence.sha256, "evidence");
      isoDate(evidence.capturedAt, "evidence timestamp");
      assert(
        Date.parse(evidence.capturedAt) <= Date.parse(report.round.timestamp),
        "evidence captured after review",
      );
      assert(
        ["PASS", "FAIL", "OBSERVED"].includes(evidence.result),
        "invalid evidence result",
      );
      text(evidence.observation, "evidence observation");
      assert(
        Array.isArray(evidence.lines) &&
          evidence.lines.length === 2 &&
          evidence.lines.every(Number.isInteger) &&
          evidence.lines[0] >= 1 &&
          evidence.lines[1] >= evidence.lines[0],
        "line range required",
      );
      assert(
        evidence.testId === null ||
          (typeof evidence.testId === "string" && evidence.testId.trim()),
        "test identifier invalid",
      );
      assert(
        evidence.kind !== "test" ||
          (evidence.testId && evidence.result !== "OBSERVED"),
        "test requires identifier and PASS/FAIL",
      );
      const archived = await readSafe(root, evidence.snapshotPath);
      const content = sanitized(archived, evidence.snapshotPath);
      assert(
        sha256(archived) === evidence.sha256,
        "evidence snapshot hash mismatch",
      );
      if (!historical)
        assert(
          sha256(await readSafe(root, evidence.path)) === evidence.sha256,
          "stale evidence",
        );
      const lines = content.split("\n");
      assert(
        evidence.lines[1] <= lines.length,
        "evidence lines outside content",
      );
      const selected = lines
        .slice(evidence.lines[0] - 1, evidence.lines[1])
        .join("\n");
      assert(selected.trim().length > 0, "empty evidence range");
      if (evidence.testId !== null)
        assert(
          selected.includes(evidence.testId),
          "test identifier missing from referenced lines",
        );
      if (ca.status === "APROVADO")
        assert(
          evidence.result !== "FAIL",
          "approved criterion includes failed evidence",
        );
      evidenceIds.set(evidence.id, evidence);
      evidenceRecords.push({ criterion: ca.id, ...evidence });
    }
    if (ca.status === "APROVADO")
      assert(
        ca.evidence.some(
          (e) => ["test", "human"].includes(e.kind) && e.result === "PASS",
        ),
        `${ca.id}: source existence/inspection alone cannot approve`,
      );
    if (ca.status === "REPROVADO")
      assert(
        ca.evidence.some((e) => e.result === "FAIL"),
        `${ca.id}: rejection requires failed evidence`,
      );
  }
  hash(report.evidenceSnapshotSha256, "evidenceSnapshot");
  assert(
    digest(evidenceRecords) === report.evidenceSnapshotSha256,
    "evidence snapshot digest mismatch",
  );
  for (const id of isolation.evidenceIds)
    assert(
      evidenceIds.get(id)?.kind === "isolation" &&
        evidenceIds.get(id)?.result === "PASS",
      "isolation technical evidence missing",
    );
  assert(
    isolation.status !== "APROVADO" || isolation.evidenceIds.length > 0,
    "production isolation requires technical proof",
  );
  const caStatus = aggregate(report.criteria);
  const status =
    caStatus === "REPROVADO" || isolation.status === "REPROVADO"
      ? "REPROVADO"
      : caStatus === "PENDENTE" || isolation.status === "PENDENTE"
        ? "PENDENTE"
        : "APROVADO";
  assert(report.status === status, "report aggregate status mismatch");
  if (complete)
    assert(
      status === "APROVADO" &&
        report.criteria.every((ca) => ca.status === "APROVADO"),
      "acceptance blocked: all CA and production isolation must be APROVADO",
    );
  return report;
}
export async function loadReport(root, ref, options) {
  const data = sanitized(await readSafe(root, ref), ref);
  return validateReport(root, JSON.parse(data), options);
}
const cell = (value) =>
  String(value)
    .replace(/\|/g, "\\|")
    .replace(/[\r\n]/g, " ")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
export function markdown(report) {
  return [
    `# Spec ${report.spec.id} — ${report.status}`,
    "",
    `Rodada: ${report.round.id} | ${report.round.timestamp}`,
    `Fontes SHA256: ${report.sourceSnapshot.sha256}`,
    `Spec SHA256: ${report.spec.sha256}`,
    `Evidências SHA256: ${report.evidenceSnapshotSha256}`,
    `Isolamento produtivo: ${report.review.productionIsolation.status} — ${cell(report.review.productionIsolation.reason)}`,
    `Commits humanos: ${report.humanCommits}`,
    "",
    "| CA | Status | Justificativa | Evidências |",
    "| --- | --- | --- | --- |",
    ...report.criteria.map(
      (ca) =>
        `| ${ca.id} | ${ca.status} | ${cell(ca.reason)} | ${ca.evidence.map((e) => `${cell(e.path)}:${e.lines.join("-")} ${cell(e.testId ?? "")} [${e.result}; sha256 ${e.sha256}]`).join("; ") || "Ausentes — bloqueado"} |`,
    ),
    "",
  ].join("\n");
}
export function compare(first, second) {
  assert(first.spec.id === second.spec.id, "cannot compare different specs");
  assert(
    first.round.id !== second.round.id &&
      Date.parse(first.round.timestamp) < Date.parse(second.round.timestamp),
    "distinct chronological rounds required",
  );
  const sameSpec = first.spec.sha256 === second.spec.sha256;
  return [
    `# Comparação spec ${first.spec.id}`,
    "",
    `${first.round.id} (${first.round.timestamp}) → ${second.round.id} (${second.round.timestamp})`,
    `Spec comparável: ${sameSpec ? "SIM — mesmo hash" : "NÃO — requisitos mudaram; não interpretar como evolução equivalente"}`,
    `Fontes: ${first.sourceSnapshot.sha256} → ${second.sourceSnapshot.sha256}`,
    `Status: ${first.status} → ${second.status}`,
    `Isolamento: ${first.review.productionIsolation.status} → ${second.review.productionIsolation.status}`,
    "",
    "| CA | Rodada anterior | Rodada atual | Evidências anteriores → atuais |",
    "| --- | --- | --- | --- |",
    ...second.criteria.map((ca) => {
      const old = first.criteria.find((entry) => entry.id === ca.id);
      return `| ${ca.id} | ${old.status} | ${ca.status} | ${old.evidence.map((e) => `${cell(e.id)}:${e.sha256}`).join(", ") || "ausentes"} → ${ca.evidence.map((e) => `${cell(e.id)}:${e.sha256}`).join(", ") || "ausentes"} |`;
    }),
    "",
  ].join("\n");
}
