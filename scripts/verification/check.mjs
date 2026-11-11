import path from "node:path";
import { fileURLToPath } from "node:url";
import { assert, compare, loadReport, markdown } from "./core.mjs";

const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const [command, ...args] = process.argv.slice(2);
try {
  if (command === "check" || command === "finalize") {
    const complete = command === "finalize" || args.includes("--complete");
    const refs = args.filter((arg) => arg !== "--complete");
    assert(
      refs.length === 1 &&
        args.length === refs.length + (args.includes("--complete") ? 1 : 0),
      "usage: check.mjs check|finalize <repo-relative-report.json> [--complete]",
    );
    const report = await loadReport(root, refs[0], { complete });
    process.stdout.write(markdown(report));
  } else if (command === "table") {
    assert(args.length === 1, "usage: check.mjs table <report.json>");
    process.stdout.write(markdown(await loadReport(root, args[0])));
  } else if (command === "compare") {
    assert(
      args.length === 2,
      "usage: check.mjs compare <earlier.json> <later.json>",
    );
    const first = await loadReport(root, args[0], { historical: true });
    const second = await loadReport(root, args[1], { historical: true });
    process.stdout.write(compare(first, second));
  } else {
    throw new Error(
      "usage: check.mjs check|finalize|table|compare ...; check validates format, finalize requires acceptance",
    );
  }
} catch (error) {
  process.stderr.write(`Verification gate blocked: ${error.message}\n`);
  process.exitCode = 1;
}
