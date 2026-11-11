import path from "node:path";
import { fileURLToPath } from "node:url";
import { assert, COUNTS, loadReport } from "./core.mjs";

const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const reports = process.argv.slice(2);
const specs = Object.keys(COUNTS);
try {
  assert(
    reports.length === specs.length,
    `Informe os relatórios independentes das specs ${specs.join(", ")} nessa ordem. Relatório ausente impede conclusão.`,
  );
  for (const [index, ref] of reports.entries()) {
    const report = await loadReport(root, ref, { complete: true });
    assert(
      report.spec.id === specs[index],
      "Ordem/dependência de specs inválida.",
    );
    console.log(
      `${report.spec.id}: APROVADO com evidência íntegra e isolamento comprovado.`,
    );
  }
} catch (error) {
  console.error(`Aceite bloqueado: ${error.message}`);
  process.exitCode = 1;
}
