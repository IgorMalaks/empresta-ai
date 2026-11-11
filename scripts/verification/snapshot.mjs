import { mkdir, lstat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assert,
  canonical,
  criterionIds,
  readSafe,
  relative,
  sha256,
  sourceTree,
  specIds,
} from "./core.mjs";

export async function createSnapshot(
  root,
  { roundId, specId, timestamp = new Date().toISOString() },
) {
  assert(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(roundId), "invalid round id");
  const expected = specIds(specId);
  const tree = await sourceTree(root);
  const specPaths = Object.keys(tree.files).filter((ref) =>
    new RegExp(`^docs/specs/${specId}-[a-z0-9-]+/spec\\.md$`).test(ref),
  );
  assert(specPaths.length === 1, "exactly one spec file required");
  const specPath = specPaths[0];
  const spec = await readSafe(root, specPath);
  assert(
    canonical(criterionIds(spec.toString())) === canonical(expected),
    "unexpected spec CA coverage",
  );
  assert(
    /Status: APROVADA PARA IMPLEMENTAÇÃO/.test(spec.toString()),
    "spec not approved for implementation",
  );
  const directory = `artifacts/verification/${roundId}`;
  relative(directory);
  // Existing ancestors must not redirect writes outside the repository.
  for (const ref of ["artifacts", "artifacts/verification"]) {
    try {
      assert(
        (await lstat(path.join(root, ref))).isDirectory() &&
          !(await lstat(path.join(root, ref))).isSymbolicLink(),
        "unsafe output directory",
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  await mkdir(path.join(root, "artifacts/verification"), {
    recursive: true,
    mode: 0o700,
  });
  const ignore = path.join(root, "artifacts/verification/.gitignore");
  try {
    await writeFile(ignore, "*\n", { flag: "wx", mode: 0o600 });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    assert(!(await lstat(ignore)).isSymbolicLink(), "unsafe ignore file");
  }
  await mkdir(path.join(root, directory), { mode: 0o700 });
  for (const [ref, expectedHash] of Object.entries(tree.files)) {
    const data = await readSafe(root, ref);
    assert(
      sha256(data) === expectedHash,
      `source changed during snapshot: ${ref}`,
    );
    const destination = path.join(root, directory, "snapshot", ref);
    await mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
    await writeFile(destination, data, { flag: "wx", mode: 0o600 });
  }
  assert(
    canonical(await sourceTree(root)) === canonical(tree),
    "source changed during snapshot; discard incomplete round",
  );
  const manifest = {
    schemaVersion: 1,
    round: { id: roundId, timestamp, directory },
    spec: { id: specId, path: specPath, sha256: tree.files[specPath] },
    sourceSnapshot: tree,
  };
  await writeFile(
    path.join(root, directory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { flag: "wx", mode: 0o600 },
  );
  return manifest;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
  try {
    const [specId, roundId, ...extra] = process.argv.slice(2);
    assert(
      extra.length === 0,
      "usage: snapshot.mjs 006|007|008|009|010 <unique-round-id>",
    );
    const manifest = await createSnapshot(root, { specId, roundId });
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`Snapshot blocked: ${error.message}\n`);
    process.exitCode = 1;
  }
}
