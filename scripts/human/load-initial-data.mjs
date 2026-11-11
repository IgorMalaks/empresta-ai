import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOG } from "../images/catalog.mjs";
import { IMAGE_ROOT } from "../images/prepare.mjs";
import {
  assert,
  allowedUrl,
  loadManifest,
  validateApprovedManifest,
  sha256,
} from "../images/core.mjs";

export function humanConfig(args, env) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      "project-ref": { type: "string" },
      "confirm-human": { type: "boolean" },
      bucket: { type: "string", default: "equipment-images" },
    },
  });
  const ref = values["project-ref"];
  assert(
    positionals.length === 0 &&
      values["confirm-human"] &&
      /^[a-z0-9]{20}$/.test(ref ?? ""),
    "Projeto explícito e confirmação humana obrigatórios.",
  );
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "DATABASE_URL",
    "PROFESSOR_EMAIL",
    "PROFESSOR_PASSWORD",
    "TEST_ACCOUNT_EMAIL",
    "TEST_ACCOUNT_PASSWORD",
  ];
  for (const name of required)
    assert(
      typeof env[name] === "string" && env[name].trim(),
      `Variável obrigatória: ${name}.`,
    );
  const url = allowedUrl(env.SUPABASE_URL, [`${ref}.supabase.co`]);
  assert(
    url.pathname === "/" && !url.search && !url.hash,
    "URL Supabase deve corresponder exatamente ao projeto.",
  );
  const db = new URL(env.DATABASE_URL);
  assert(
    ["postgres:", "postgresql:"].includes(db.protocol) &&
      db.password &&
      db.pathname === "/postgres" &&
      !db.search &&
      !db.hash,
    "DATABASE_URL direta obrigatória, sem parâmetros que desativem TLS.",
  );
  const direct =
    db.hostname === `db.${ref}.supabase.co` && db.username === "postgres";
  const pooler =
    /^[a-z0-9-]+\.(?:pooler\.supabase\.com)$/.test(db.hostname) &&
    decodeURIComponent(db.username) === `postgres.${ref}`;
  assert(direct || pooler, "PostgreSQL não corresponde ao projeto explícito.");
  assert(
    /^[a-z0-9][a-z0-9-]{0,62}$/.test(values.bucket),
    "Nome de bucket inválido.",
  );
  const professorEmail = env.PROFESSOR_EMAIL.trim().toLowerCase();
  const testEmail = env.TEST_ACCOUNT_EMAIL.trim().toLowerCase();
  assert(
    professorEmail === "marcelo.grilo@institutojef.org.br",
    "PROFESSOR_EMAIL deve corresponder ao professor obrigatório do briefing.",
  );
  assert(
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(professorEmail) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail) &&
      professorEmail !== testEmail,
    "Professor e conta de teste devem ser emails válidos distintos.",
  );
  return {
    ref,
    url: url.origin,
    key: env.SUPABASE_SERVICE_ROLE_KEY,
    databaseUrl: env.DATABASE_URL,
    bucket: values.bucket,
    professorEmail,
    professorPassword: env.PROFESSOR_PASSWORD,
    testEmail,
    testPassword: env.TEST_ACCOUNT_PASSWORD,
  };
}
export async function findAuthUser(admin, email) {
  const target = email.toLowerCase();
  let match;
  const seen = new Set();
  for (let page = 1; page <= 10000; page++) {
    const { data, error } = await admin.listUsers({ page, perPage: 100 });
    assert(
      !error && Array.isArray(data?.users),
      "Falha ao consultar usuários Auth.",
    );
    for (const user of data.users) {
      assert(!seen.has(user.id), "Paginação Auth não avançou.");
      seen.add(user.id);
      if (user.email?.toLowerCase() === target) {
        assert(!match, "Email duplicado em Auth.");
        match = user;
      }
    }
    if (data.users.length < 100) return match;
  }
  throw new Error("Paginação Auth excedeu limite de segurança.");
}
export async function ensureAuthUser(admin, email, password) {
  const existing = await findAuthUser(admin, email);
  if (existing) return existing;
  const { data, error } = await admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data?.user) {
    const raced = await findAuthUser(admin, email);
    assert(raced, "Não foi possível provisionar conta Auth.");
    return raced;
  }
  return data.user;
}
export async function assertProfessorClear(client, user) {
  if (!user) return;
  assert(/^[a-f0-9-]{36}$/i.test(user.id), "UUID Auth inválido.");
  const { rows } = await client.query(
    "SELECT count(*)::int AS count FROM public.loans WHERE user_id = $1::uuid",
    [user.id],
  );
  assert(
    rows[0]?.count === 0,
    "Professor possui empréstimos; carga/conclusão bloqueada, nenhum empréstimo será removido.",
  );
}
export function objectPath(item, candidate) {
  return `${item.patrimonio}/${candidate.image_sha256}.jpg`;
}
export function assertExistingMatches(existing, approved, imageUrl) {
  const { item, candidate } = approved;
  const fields = {
    nome: item.nome,
    categoria: item.categoria,
    image_url: imageUrl,
    pexels_id: String(candidate.pexels_id),
    photographer: candidate.photographer,
    source_url: candidate.source_url,
    license_url: candidate.license_url,
    image_sha256: candidate.image_sha256,
  };
  for (const [field, expected] of Object.entries(fields))
    assert(
      String(existing[field]) === expected,
      `Dataset existente divergente: ${item.patrimonio}/${field}.`,
    );
  assert(
    existing.situacao === item.situacao || existing.situacao === "emprestado",
    `Situação existente divergente: ${item.patrimonio}.`,
  );
}
export async function uploadImmutable(storage, approved) {
  const path = objectPath(approved.item, approved.candidate);
  const existing = await storage.download(path);
  if (!existing.error && existing.data) {
    assert(
      sha256(Buffer.from(await existing.data.arrayBuffer())) ===
        approved.candidate.image_sha256,
      "Objeto existente com hash divergente.",
    );
    return path;
  }
  const missing =
    Number(existing.error?.status) === 404 ||
    Number(existing.error?.statusCode) === 404 ||
    existing.error?.code === "NoSuchKey";
  assert(
    missing,
    "Não foi possível confirmar ausência do objeto; upload bloqueado.",
  );
  const uploaded = await storage.upload(path, approved.bytes, {
    contentType: "image/jpeg",
    upsert: false,
    cacheControl: "31536000",
  });
  if (uploaded.error) {
    const raced = await storage.download(path);
    assert(
      !raced.error &&
        raced.data &&
        sha256(Buffer.from(await raced.data.arrayBuffer())) ===
          approved.candidate.image_sha256,
      "Upload falhou ou objeto divergente.",
    );
  }
  const check = await storage.download(path);
  assert(
    !check.error &&
      check.data &&
      sha256(Buffer.from(await check.data.arrayBuffer())) ===
        approved.candidate.image_sha256,
    "Hash no Storage divergente.",
  );
  return path;
}
export async function seedEquipments(client, records) {
  for (const { approved, imageUrl } of records) {
    const { item, candidate } = approved;
    const { rows } = await client.query(
      "SELECT * FROM public.equipments WHERE patrimonio = $1 FOR UPDATE",
      [item.patrimonio],
    );
    if (rows.length) {
      assertExistingMatches(rows[0], approved, imageUrl);
      continue;
    }
    await client.query(
      "INSERT INTO public.equipments (patrimonio,nome,categoria,situacao,image_url,pexels_id,photographer,source_url,license_url,image_sha256) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [
        item.patrimonio,
        item.nome,
        item.categoria,
        item.situacao,
        imageUrl,
        candidate.pexels_id,
        candidate.photographer,
        candidate.source_url,
        candidate.license_url,
        candidate.image_sha256,
      ],
    );
  }
}
export async function loadData(
  config,
  approved,
  { client, supabase, verifyPublic },
) {
  await client.query("BEGIN");
  try {
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('empresta-ai-initial-data'))",
    );
    // Evita empréstimos concorrentes enquanto confere as contas e preserva estados existentes.
    await client.query(
      "LOCK TABLE public.equipments, public.loans IN SHARE ROW EXCLUSIVE MODE",
    );
    const { rows: existingEquipments } = await client.query(
      "SELECT patrimonio FROM public.equipments",
    );
    const expectedPatrimonios = new Set(CATALOG.map((item) => item.patrimonio));
    assert(
      existingEquipments.every((item) =>
        expectedPatrimonios.has(item.patrimonio),
      ),
      "Catálogo existente contém patrimônio fora do dataset aprovado; carga bloqueada sem apagar itens.",
    );
    const professorExisting = await findAuthUser(
      supabase.auth.admin,
      config.professorEmail,
    );
    await assertProfessorClear(client, professorExisting);
    const { data: bucket, error: bucketError } =
      await supabase.storage.getBucket(config.bucket);
    assert(
      !bucketError && bucket?.public === true,
      "Bucket público deve ser criado/configurado pelo responsável antes da carga.",
    );
    const storage = supabase.storage.from(config.bucket);
    const records = approved.map((entry) => {
      const path = objectPath(entry.item, entry.candidate);
      const imageUrl = storage.getPublicUrl(path).data.publicUrl;
      const url = allowedUrl(imageUrl, [`${config.ref}.supabase.co`]);
      assert(
        !url.search &&
          !url.hash &&
          url.pathname === `/storage/v1/object/public/${config.bucket}/${path}`,
        "URL pública inesperada.",
      );
      return { approved: entry, imageUrl };
    });
    for (const record of records) {
      const { rows } = await client.query(
        "SELECT * FROM public.equipments WHERE patrimonio = $1",
        [record.approved.item.patrimonio],
      );
      if (rows.length)
        assertExistingMatches(rows[0], record.approved, record.imageUrl);
    }
    const professor = await ensureAuthUser(
      supabase.auth.admin,
      config.professorEmail,
      config.professorPassword,
    );
    await ensureAuthUser(
      supabase.auth.admin,
      config.testEmail,
      config.testPassword,
    );
    await assertProfessorClear(client, professor);
    for (const record of records) {
      await uploadImmutable(storage, record.approved);
      await verifyPublic(
        record.imageUrl,
        record.approved.candidate.image_sha256,
      );
    }
    await seedEquipments(client, records);
    await assertProfessorClear(client, professor);
    await client.query("COMMIT");
    return {
      equipments: records.length,
      professorLoans: 0,
      loginVerified: false,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
export async function main(args = process.argv.slice(2), env = process.env) {
  const config = humanConfig(args, env);
  const manifest = await loadManifest(IMAGE_ROOT);
  const approved = await validateApprovedManifest(
    IMAGE_ROOT,
    manifest,
    CATALOG,
  );
  const [{ Client }, { createClient }, { boundedFetch }] = await Promise.all([
    import("pg"),
    import("@supabase/supabase-js"),
    import("../images/core.mjs"),
  ]);
  const timedFetch = (url, options = {}) => {
    allowedUrl(url, [`${config.ref}.supabase.co`]);
    return fetch(url, {
      ...options,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  };
  const supabase = createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { fetch: timedFetch },
  });
  const client = new Client({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 15000,
    statement_timeout: 30000,
    application_name: "empresta-ai-human-seed",
  });
  try {
    await client.connect();
    const result = await loadData(config, approved, {
      client,
      supabase,
      verifyPublic: async (url, hash) => {
        const bytes = await boundedFetch(url, {
          hosts: [`${config.ref}.supabase.co`],
        });
        assert(
          sha256(bytes) === hash,
          "Arquivo público não corresponde ao manifesto.",
        );
      },
    });
    console.log(
      JSON.stringify({
        ...result,
        status:
          "Carga humana concluída; login e políticas de escrita ainda precisam de verificação humana.",
      }),
    );
  } finally {
    await client.end();
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch(() => {
    console.error(
      "Carga bloqueada. Conferir ambiente, projeto, manifesto, conta do professor, bucket e divergências; secrets e respostas administrativas não são registrados. Objetos/contas externos eventualmente criados não foram apagados.",
    );
    process.exitCode = 1;
  });
}
