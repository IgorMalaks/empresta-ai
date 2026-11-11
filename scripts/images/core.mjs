import { createHash } from "node:crypto";
import { readFile, writeFile, rename, realpath, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";

export const LICENSE_URL = "https://pixabay.com/service/license-summary/";
export const PIXABAY_IMAGE_HOSTS = ["pixabay.com", "cdn.pixabay.com"];
export const sha256 = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
export function assert(condition, message) {
  if (!condition) throw new Error(message);
}
export function allowedUrl(value, hosts) {
  const url = new URL(value);
  assert(
    url.protocol === "https:" &&
      hosts.includes(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.port,
    "URL fora da allowlist HTTPS.",
  );
  return url;
}
export async function boundedFetch(
  value,
  {
    hosts,
    key,
    maxBytes = 20 * 1024 * 1024,
    timeoutMs = 15000,
    fetchImpl = fetch,
    json = false,
  } = {},
) {
  const url = allowedUrl(value, hosts);
  assert(
    !key ||
      (url.origin === "https://pixabay.com" &&
        url.pathname === "/api/" &&
        json),
    "Chave somente para API Pixabay.",
  );
  if (key) url.searchParams.set("key", key);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let reader;
  try {
    const response = await fetchImpl(url, {
      redirect: "error",
      signal: controller.signal,
      headers: json ? { Accept: "application/json" } : {},
    });
    assert(
      response.ok && !response.redirected,
      `Resposta remota recusada (HTTP ${response.status}).`,
    );
    const mime = response.headers.get("content-type")?.split(";")[0];
    assert(
      json
        ? mime === "application/json"
        : ["image/jpeg", "image/png", "image/webp"].includes(mime),
      "Tipo remoto recusado.",
    );
    const length = Number(response.headers.get("content-length"));
    assert(!length || length <= maxBytes, "Resposta excede limite.");
    assert(response.body, "Resposta vazia.");
    reader = response.body.getReader();
    let size = 0;
    const chunks = [];
    while (true) {
      const { value: chunk, done } = await reader.read();
      if (done) break;
      size += chunk.byteLength;
      assert(size <= maxBytes, "Resposta excede limite.");
      chunks.push(Buffer.from(chunk));
    }
    const bytes = Buffer.concat(chunks);
    return json ? JSON.parse(bytes.toString("utf8")) : bytes;
  } finally {
    controller.abort();
    if (reader) await reader.cancel().catch(() => {});
    clearTimeout(timer);
  }
}
export async function sharpAdapter(bytes) {
  const { default: sharp } = await import("sharp");
  return sharp(bytes, {
    limitInputPixels: 40000000,
    failOn: "warning",
    animated: false,
  });
}
export async function transformImage(bytes, factory = sharpAdapter) {
  const image = await factory(bytes);
  const original = await image.metadata();
  assert(
    ["jpeg", "png", "webp"].includes(original.format) &&
      (original.pages ?? 1) === 1,
    "Formato de imagem recusado.",
  );
  const final = await image
    .rotate()
    .resize(800, 600, {
      fit: "cover",
      position: "centre",
      withoutEnlargement: false,
    })
    .jpeg({ quality: 88 })
    .toBuffer();
  const metadata = await (await factory(final)).metadata();
  assert(
    metadata.width === 800 &&
      metadata.height === 600 &&
      metadata.format === "jpeg" &&
      (metadata.pages ?? 1) === 1,
    "Imagem final deve ser JPEG 800x600.",
  );
  return {
    bytes: final,
    image_sha256: sha256(final),
    width: metadata.width,
    height: metadata.height,
  };
}
export function photoMetadata(photo) {
  assert(
    Number.isSafeInteger(photo.id) && photo.id > 0,
    "ID Pixabay inválido.",
  );
  const source = allowedUrl(photo.pageURL, ["pixabay.com"]);
  assert(
    source.pathname.startsWith("/photos/") &&
      source.pathname.replace(/\/$/, "").endsWith(`-${photo.id}`) &&
      !source.search &&
      !source.hash,
    "Página não corresponde ao ID Pixabay.",
  );
  const photographerUrl = allowedUrl(photo.photographer_url, ["pixabay.com"]);
  assert(
    typeof photo.user === "string" &&
      photo.user.trim() &&
      photographerUrl.pathname.startsWith("/users/") &&
      !photographerUrl.search &&
      !photographerUrl.hash,
    "Fotógrafo ausente.",
  );
  const download = allowedUrl(
    photo.largeImageURL || photo.webformatURL,
    PIXABAY_IMAGE_HOSTS,
  );
  assert(
    (download.hostname === "pixabay.com"
      ? /^\/get\/[a-z0-9_]+\.(?:jpe?g|png|webp)$/i.test(download.pathname)
      : download.pathname.startsWith("/photo/")) &&
      !download.search &&
      !download.hash,
    "URL de download Pixabay inválida.",
  );
  return {
    pexels_id: photo.id,
    photographer: photo.user,
    photographer_url: photographerUrl.href,
    source_url: source.href,
    license_url: LICENSE_URL,
    download_url: download.href,
  };
}
export async function saveManifest(root, manifest) {
  const filename = resolve(root, "manifest.json");
  const temporary = `${filename}.tmp`;
  await writeFile(temporary, `${JSON.stringify(manifest, null, 2)}\n`, {
    mode: 0o600,
  });
  await rename(temporary, filename);
}
export async function loadManifest(root) {
  return JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
}
export async function candidateBytes(root, candidate) {
  assert(
    typeof candidate.file === "string" &&
      /^candidates\/TI-\d{4}\/\d+-[a-f0-9]{64}\.jpg$/.test(candidate.file),
    "Caminho de candidato inválido.",
  );
  const base = await realpath(root);
  const path = await realpath(resolve(root, candidate.file));
  assert(path.startsWith(base + sep), "Arquivo fora do diretório de imagens.");
  assert((await stat(path)).size <= 20 * 1024 * 1024, "Arquivo excede limite.");
  const bytes = await readFile(path);
  assert(sha256(bytes) === candidate.image_sha256, "Hash final divergente.");
  return bytes;
}
export function validateStructure(manifest, catalog) {
  assert(
    manifest.version === 1 &&
      Array.isArray(manifest.equipments) &&
      manifest.equipments.length === catalog.length,
    "Manifesto parcial ou versão inválida.",
  );
  for (const expected of catalog) {
    const matches = manifest.equipments.filter(
      (item) => item.patrimonio === expected.patrimonio,
    );
    assert(matches.length === 1, "Patrimônio ausente ou duplicado.");
    const item = matches[0];
    for (const field of ["nome", "categoria", "situacao", "busca"])
      assert(
        item[field] === expected[field],
        `Dataset divergente: ${expected.patrimonio}.`,
      );
    assert(
      Array.isArray(item.candidates) && Array.isArray(item.pages),
      "Candidatos/páginas ausentes.",
    );
    const ids = new Set();
    for (const candidate of item.candidates) {
      assert(!ids.has(candidate.pexels_id), "ID duplicado nos candidatos.");
      ids.add(candidate.pexels_id);
      photoMetadata({
        id: candidate.pexels_id,
        pageURL: candidate.source_url,
        user: candidate.photographer,
        photographer_url: candidate.photographer_url,
        largeImageURL: candidate.download_url,
      });
      assert(
        candidate.license_url === LICENSE_URL &&
          /^[a-f0-9]{64}$/.test(candidate.image_sha256) &&
          candidate.width === 800 &&
          candidate.height === 600 &&
          Array.isArray(candidate.reviews),
        "Metadata final inválida.",
      );
      assert(
        candidate.file ===
          `candidates/${item.patrimonio}/${candidate.pexels_id}-${candidate.image_sha256}.jpg`,
        "Caminho não corresponde ao candidato.",
      );
    }
  }
}
export function reviewCandidate(
  manifest,
  patrimonio,
  id,
  { decision, reviewer, reason, checksClean, confirmHuman },
  now = new Date().toISOString(),
) {
  assert(
    confirmHuman &&
      ["aprovada", "rejeitada"].includes(decision) &&
      reviewer?.trim() &&
      reason?.trim(),
    "Revisão exige confirmação humana, decisão, responsável e motivo.",
  );
  assert(
    decision !== "aprovada" || checksClean === true,
    "Aprovação exige confirmação visual de todos os critérios.",
  );
  const item = manifest.equipments.find(
    (entry) => entry.patrimonio === patrimonio,
  );
  const candidate = item?.candidates.find((entry) => entry.pexels_id === id);
  assert(candidate, "Candidato não encontrado.");
  if (decision === "aprovada") {
    for (const other of manifest.equipments) {
      if (other === item) continue;
      const selected = other.candidates.find(
        (entry) => entry.pexels_id === other.selected_id,
      );
      assert(
        !selected ||
          (selected.pexels_id !== id &&
            selected.image_sha256 !== candidate.image_sha256),
        "Foto já selecionada para outro equipamento.",
      );
    }
    item.selected_id = id;
  } else if (item.selected_id === id) item.selected_id = null;
  candidate.reviews.push({
    decision,
    reviewer: reviewer.trim(),
    reason: reason.trim(),
    checks_clean: checksClean === true,
    image_sha256: candidate.image_sha256,
    reviewed_at: now,
  });
}
export async function validateApprovedManifest(
  root,
  manifest,
  catalog,
  factory = sharpAdapter,
) {
  validateStructure(manifest, catalog);
  const ids = new Set();
  const hashes = new Set();
  const result = [];
  for (const item of manifest.equipments) {
    const candidate = item.candidates.find(
      (entry) => entry.pexels_id === item.selected_id,
    );
    const review = candidate?.reviews.at(-1);
    assert(
      candidate &&
        review?.decision === "aprovada" &&
        review.checks_clean === true &&
        review.reviewer?.trim() &&
        review.reason?.trim() &&
        Number.isFinite(Date.parse(review.reviewed_at)) &&
        review.image_sha256 === candidate.image_sha256,
      `Revisão humana pendente: ${item.patrimonio}.`,
    );
    assert(
      !ids.has(candidate.pexels_id) && !hashes.has(candidate.image_sha256),
      "Fotos selecionadas duplicadas por ID/conteúdo.",
    );
    ids.add(candidate.pexels_id);
    hashes.add(candidate.image_sha256);
    const bytes = await candidateBytes(root, candidate);
    const metadata = await (await factory(bytes)).metadata();
    assert(
      metadata.width === 800 &&
        metadata.height === 600 &&
        metadata.format === "jpeg" &&
        (metadata.pages ?? 1) === 1,
      "Arquivo final não é JPEG 800x600.",
    );
    result.push({ item, candidate, bytes });
  }
  return result;
}
export function rejectionReport(manifest) {
  return manifest.equipments.flatMap((item) =>
    item.candidates.flatMap((candidate) =>
      candidate.reviews
        .filter((review) => review.decision === "rejeitada")
        .map((review) => ({
          patrimonio: item.patrimonio,
          pexels_id: candidate.pexels_id,
          ...review,
        })),
    ),
  );
}
