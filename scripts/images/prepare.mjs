import { mkdir, readFile, stat, writeFile, rmdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseArgs } from "node:util";
import { CATALOG } from "./catalog.mjs";
import {
  assert,
  boundedFetch,
  transformImage,
  photoMetadata,
  loadManifest,
  saveManifest,
  validateStructure,
  candidateBytes,
  validateApprovedManifest,
  reviewCandidate,
  rejectionReport,
  PIXABAY_IMAGE_HOSTS,
} from "./core.mjs";

export const IMAGE_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../artifacts/images",
);
export async function assertIgnoredArtifacts() {
  const project = resolve(IMAGE_ROOT, "../..");
  try {
    await promisify(execFile)(
      "git",
      [
        "check-ignore",
        "--no-index",
        "artifacts/images/manifest.json",
        "artifacts/images/candidates/example.jpg",
      ],
      { cwd: project },
    );
  } catch {
    throw new Error(
      "Bloqueado: responsável deve ignorar artifacts/images/ no repositório antes de gerar arquivos.",
    );
  }
}
export async function prepare(
  manifest,
  root,
  key,
  page,
  { request = boundedFetch, transform = transformImage } = {},
) {
  assert(key?.trim(), "PIXABAY_API_KEY obrigatório no ambiente local.");
  assert(
    Number.isSafeInteger(page) && page >= 1 && page <= 100,
    "Página deve estar entre 1 e 100.",
  );
  validateStructure(manifest, CATALOG);
  const ids = new Set(
    manifest.equipments.flatMap((item) =>
      item.candidates.map((candidate) => candidate.pexels_id),
    ),
  );
  const hashes = new Set(
    manifest.equipments.flatMap((item) =>
      item.candidates.map((candidate) => candidate.image_sha256),
    ),
  );
  for (const item of manifest.equipments) {
    if (item.pages.includes(page)) continue;
    const url = new URL("https://pixabay.com/api/");
    url.search = new URLSearchParams({
      q: item.busca,
      image_type: "photo",
      safesearch: "true",
      per_page: "8",
      page: String(page),
    }).toString();
    const cache = resolve(root, `search-${item.patrimonio}-${page}.json`);
    let response;
    const cachedAt = await stat(cache).catch((error) => {
      if (error.code !== "ENOENT") throw error;
      return null;
    });
    if (cachedAt && Date.now() - cachedAt.mtimeMs < 86400000) {
      response = JSON.parse(await readFile(cache, "utf8"));
    } else {
      response = await request(url, {
        hosts: ["pixabay.com"],
        key,
        json: true,
        maxBytes: 1024 * 1024,
      });
      assert(
        Array.isArray(response.hits) && response.hits.length <= 8,
        "Lista API inválida.",
      );
      await writeFile(cache, JSON.stringify({ hits: response.hits }), {
        mode: 0o600,
      });
    }
    assert(
      Array.isArray(response.hits) && response.hits.length <= 8,
      "Lista API inválida.",
    );
    for (const photo of response.hits) {
      if (
        item.candidates.filter((candidate) => candidate.api_page === page)
          .length >= 3
      )
        break;
      if (
        photo.type !== "photo" ||
        !Number.isSafeInteger(photo.user_id) ||
        photo.user_id <= 0
      )
        continue;
      const metadata = photoMetadata({
        ...photo,
        photographer_url: `https://pixabay.com/users/${encodeURIComponent(photo.user)}-${photo.user_id}/`,
      });
      if (ids.has(metadata.pexels_id)) continue;
      const original = await request(metadata.download_url, {
        hosts: PIXABAY_IMAGE_HOSTS,
      });
      const final = await transform(original);
      if (hashes.has(final.image_sha256)) continue;
      const file = `candidates/${item.patrimonio}/${metadata.pexels_id}-${final.image_sha256}.jpg`;
      await mkdir(resolve(root, "candidates", item.patrimonio), {
        recursive: true,
      });
      await writeFile(resolve(root, file), final.bytes, {
        flag: "wx",
        mode: 0o600,
      }).catch(async (error) => {
        if (error.code !== "EEXIST") throw error;
        await candidateBytes(root, { file, image_sha256: final.image_sha256 });
      });
      item.candidates.push({
        ...metadata,
        file,
        width: final.width,
        height: final.height,
        image_sha256: final.image_sha256,
        obtained_at: new Date().toISOString(),
        api_query: item.busca,
        api_page: page,
        reviews: [],
      });
      ids.add(metadata.pexels_id);
      hashes.add(final.image_sha256);
      await saveManifest(root, manifest);
    }
    item.pages.push(page);
    await saveManifest(root, manifest);
  }
  return manifest;
}
export async function main(args = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      page: { type: "string", default: "1" },
      patrimonio: { type: "string" },
      id: { type: "string" },
      decision: { type: "string" },
      reviewer: { type: "string" },
      reason: { type: "string" },
      "checks-clean": { type: "boolean" },
      "confirm-human": { type: "boolean" },
    },
  });
  const command = positionals[0];
  assert(
    positionals.length === 1 &&
      ["prepare", "list", "review", "report", "validate"].includes(command),
    "Comando: prepare | list | review | report | validate.",
  );
  await assertIgnoredArtifacts();
  await mkdir(IMAGE_ROOT, { recursive: true });
  const lock = resolve(IMAGE_ROOT, ".lock");
  await mkdir(lock).catch(() => {
    throw new Error(
      "Processo concorrente ou lock pendente; responsável deve conferir antes de liberar.",
    );
  });
  try {
    let manifest;
    try {
      manifest = await loadManifest(IMAGE_ROOT);
    } catch (error) {
      assert(
        error.code === "ENOENT" && command === "prepare",
        "Manifesto ausente ou inválido.",
      );
      manifest = {
        version: 1,
        equipments: CATALOG.map((item) => ({
          ...item,
          candidates: [],
          pages: [],
          selected_id: null,
        })),
      };
      await saveManifest(IMAGE_ROOT, manifest);
    }
    validateStructure(manifest, CATALOG);
    if (command === "prepare") {
      await prepare(
        manifest,
        IMAGE_ROOT,
        process.env.PIXABAY_API_KEY,
        Number(values.page),
      );
      console.log(
        "Candidatos preparados; nenhuma aprovação automática. Use list e revisão humana.",
      );
    } else if (command === "review") {
      const item = manifest.equipments.find(
        (entry) => entry.patrimonio === values.patrimonio,
      );
      const candidate = item?.candidates.find(
        (entry) => entry.pexels_id === Number(values.id),
      );
      assert(candidate, "Candidato não encontrado.");
      await candidateBytes(IMAGE_ROOT, candidate);
      const { sharpAdapter } = await import("./core.mjs");
      const metadata = await (
        await sharpAdapter(await candidateBytes(IMAGE_ROOT, candidate))
      ).metadata();
      assert(
        metadata.width === 800 &&
          metadata.height === 600 &&
          metadata.format === "jpeg",
        "Revisão bloqueada por dimensões/formato.",
      );
      reviewCandidate(manifest, values.patrimonio, Number(values.id), {
        decision: values.decision,
        reviewer: values.reviewer,
        reason: values.reason,
        checksClean: values["checks-clean"],
        confirmHuman: values["confirm-human"],
      });
      await saveManifest(IMAGE_ROOT, manifest);
      console.log(
        "Decisão registrada com hash final; histórico anterior preservado.",
      );
    } else if (command === "validate") {
      await validateApprovedManifest(IMAGE_ROOT, manifest, CATALOG);
      console.log(
        "12 imagens únicas, revisadas, hashes e dimensões conferidos localmente. Carga não executada.",
      );
    } else if (command === "report") {
      console.log(
        JSON.stringify(
          {
            status: "histórico registrado, não avaliação automática",
            rejections: rejectionReport(manifest),
          },
          null,
          2,
        ),
      );
    } else {
      console.log(
        JSON.stringify(
          manifest.equipments.map((item) => ({
            patrimonio: item.patrimonio,
            selected_id: item.selected_id,
            candidates: item.candidates.map((candidate) => ({
              pexels_id: candidate.pexels_id,
              file: resolve(IMAGE_ROOT, candidate.file),
              photographer: candidate.photographer,
              source_url: candidate.source_url,
              image_sha256: candidate.image_sha256,
              last_review: candidate.reviews.at(-1)?.decision ?? "pendente",
            })),
          })),
          null,
          2,
        ),
      );
    }
  } finally {
    await rmdir(lock);
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch(() => {
    console.error(
      "Operação bloqueada. Confira manifesto, revisão, argumentos, dependências, ignore e ambiente; nenhum detalhe de credencial é registrado.",
    );
    process.exitCode = 1;
  });
}
