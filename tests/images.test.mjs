import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CATALOG } from "../scripts/images/catalog.mjs";
import {
  allowedUrl,
  boundedFetch,
  transformImage,
  photoMetadata,
  sha256,
  reviewCandidate,
  rejectionReport,
  validateStructure,
  validateApprovedManifest,
} from "../scripts/images/core.mjs";
import { prepare } from "../scripts/images/prepare.mjs";
import {
  humanConfig,
  findAuthUser,
  ensureAuthUser,
  assertProfessorClear,
  assertExistingMatches,
  seedEquipments,
  uploadImmutable,
  loadData,
} from "../scripts/human/load-initial-data.mjs";

const factory = async () => ({
  metadata: async () => ({ width: 800, height: 600, format: "jpeg" }),
});
function fixture() {
  return {
    version: 1,
    equipments: CATALOG.map((item, index) => {
      const id = index + 1;
      const hash = sha256(Buffer.from(item.patrimonio));
      return {
        ...item,
        pages: [],
        selected_id: id,
        candidates: [
          {
            pexels_id: id,
            photographer: "Fixture Photographer",
            photographer_url: "https://pixabay.com/users/fixture-1/",
            source_url: `https://pixabay.com/photos/equipment-${id}/`,
            license_url: "https://pixabay.com/service/license-summary/",
            download_url: `https://cdn.pixabay.com/photo/equipment-${id}.jpg`,
            file: `candidates/${item.patrimonio}/${id}-${hash}.jpg`,
            width: 800,
            height: 600,
            image_sha256: hash,
            reviews: [
              {
                decision: "aprovada",
                reviewer: "Synthetic unit fixture",
                reason: "Not real visual approval",
                checks_clean: true,
                image_sha256: hash,
                reviewed_at: "2026-01-01T00:00:00Z",
              },
            ],
          },
        ],
      };
    }),
  };
}
const ref = "abcdefghijklmnopqrst";
const databaseUrl = new URL(`postgresql://db.${ref}.supabase.co:5432/postgres`);
databaseUrl.username = "postgres";
databaseUrl.password = "synthetic";
const env = {
  SUPABASE_URL: `https://${ref}.supabase.co`,
  SUPABASE_SERVICE_ROLE_KEY: "synthetic",
  DATABASE_URL: databaseUrl.href,
  PROFESSOR_EMAIL: "marcelo.grilo@institutojef.org.br",
  PROFESSOR_PASSWORD: "synthetic",
  TEST_ACCOUNT_EMAIL: "test@example.test",
  TEST_ACCOUNT_PASSWORD: "synthetic",
};
const args = ["--project-ref", ref, "--confirm-human"];

describe("images catalog and network boundary", () => {
  it("matches twelve items with nine available and three maintenance", () => {
    assert.equal(CATALOG.length, 12);
    assert.equal(new Set(CATALOG.map((item) => item.patrimonio)).size, 12);
    assert.deepEqual(
      CATALOG.filter((item) => item.situacao === "manutencao").map(
        (item) => item.patrimonio,
      ),
      ["TI-0004", "TI-0007", "TI-0010"],
    );
    assert.deepEqual(
      ["notebook", "monitor", "cabo", "camera"].map(
        (category) =>
          CATALOG.filter((item) => item.categoria === category).length,
      ),
      [4, 3, 3, 2],
    );
  });
  it("rejects insecure URLs, credentials, ports and lookalike hosts", () => {
    for (const url of [
      "http://cdn.pixabay.com/a",
      "https://cdn.pixabay.com.evil.test/a",
      "https://u:p@cdn.pixabay.com/a",
      "https://cdn.pixabay.com:444/a",
    ])
      assert.throws(() => allowedUrl(url, ["cdn.pixabay.com"]));
    assert.throws(() =>
      photoMetadata({
        id: 1,
        pageURL: "https://pixabay.com/photos/equipment-2/",
        user: "X",
        photographer_url: "https://pixabay.com/users/x-1/",
        largeImageURL: "https://cdn.pixabay.com/photo/a.jpg",
      }),
    );
  });
  it("keeps authorization API-only and disables redirects", async () => {
    let calls = 0;
    await boundedFetch("https://pixabay.com/api/?q=test", {
      hosts: ["pixabay.com"],
      key: "synthetic",
      json: true,
      fetchImpl: async (url, options) => {
        calls++;
        assert.equal(options.redirect, "error");
        assert.equal(url.searchParams.get("key"), "synthetic");
        assert.equal(options.headers.Authorization, undefined);
        return new Response('{"hits":[]}', {
          headers: { "content-type": "application/json" },
        });
      },
    });
    assert.equal(calls, 1);
    await assert.rejects(
      boundedFetch("https://cdn.pixabay.com/a", {
        hosts: ["cdn.pixabay.com"],
        key: "synthetic",
      }),
    );
  });
  it("blocks oversized streams, incorrect MIME and redirect responses", async () => {
    for (const response of [
      new Response("abcdef", { headers: { "content-type": "image/jpeg" } }),
      new Response("x", { headers: { "content-type": "text/html" } }),
      new Response("", {
        status: 302,
        headers: { location: "https://evil.test" },
      }),
    ]) {
      await assert.rejects(
        boundedFetch("https://cdn.pixabay.com/a", {
          hosts: ["cdn.pixabay.com"],
          maxBytes: 3,
          fetchImpl: async () => response,
        }),
      );
    }
  });
  it("aborts a slow request at timeout", async () => {
    await assert.rejects(
      boundedFetch("https://cdn.pixabay.com/a", {
        hosts: ["cdn.pixabay.com"],
        timeoutMs: 5,
        fetchImpl: (_url, { signal }) =>
          new Promise((_ok, reject) =>
            signal.addEventListener("abort", () =>
              reject(new Error("timeout")),
            ),
          ),
      }),
    );
  });
  it("requires exact resize and revalidated metadata", async () => {
    const chain = {
      metadata: async () => ({ format: "jpeg", width: 800, height: 600 }),
      rotate() {
        return this;
      },
      resize(w, h, options) {
        assert.deepEqual([w, h, options.fit], [800, 600, "cover"]);
        return this;
      },
      jpeg() {
        return this;
      },
      toBuffer: async () => Buffer.from("synthetic"),
    };
    assert.equal(
      (await transformImage(Buffer.from("x"), async () => chain)).image_sha256,
      sha256(Buffer.from("synthetic")),
    );
    await assert.rejects(
      transformImage(Buffer.from("x"), async () => ({
        ...chain,
        metadata: async () => ({ format: "jpeg", width: 799, height: 600 }),
      })),
    );
  });
});
describe("images review and local integrity", () => {
  it("never silently approves and keeps real recorded rejection history", () => {
    const manifest = fixture();
    const candidate = manifest.equipments[0].candidates[0];
    candidate.reviews = [];
    assert.throws(() =>
      reviewCandidate(manifest, "TI-0001", 1, {
        decision: "aprovada",
        reviewer: "X",
        reason: "Y",
        confirmHuman: true,
      }),
    );
    reviewCandidate(manifest, "TI-0001", 1, {
      decision: "rejeitada",
      reviewer: "X",
      reason: "Visible logo in synthetic test",
      confirmHuman: true,
    });
    assert.equal(manifest.equipments[0].selected_id, null);
    assert.equal(rejectionReport(manifest).length, 1);
    reviewCandidate(manifest, "TI-0001", 1, {
      decision: "aprovada",
      reviewer: "X",
      reason: "Synthetic only",
      confirmHuman: true,
      checksClean: true,
    });
    assert.equal(candidate.reviews.length, 2);
    assert.equal(rejectionReport(manifest).length, 1);
  });
  it("blocks duplicate equipment, partial manifests and missing reviews", async () => {
    const manifest = fixture();
    manifest.equipments.pop();
    assert.throws(() => validateStructure(manifest, CATALOG));
    const duplicate = fixture();
    duplicate.equipments[1] = duplicate.equipments[0];
    assert.throws(() => validateStructure(duplicate, CATALOG));
    const pending = fixture();
    pending.equipments[0].candidates[0].reviews = [];
    await assert.rejects(
      validateApprovedManifest("unused", pending, CATALOG, factory),
      /pendente/,
    );
  });
  it("validates twelve final hashes and rejects changed bytes or duplicate content", async () => {
    const root = await mkdtemp(join(tmpdir(), "images-unit-"));
    try {
      const manifest = fixture();
      for (const item of manifest.equipments) {
        await mkdir(join(root, "candidates", item.patrimonio), {
          recursive: true,
        });
        await writeFile(
          join(root, item.candidates[0].file),
          Buffer.from(item.patrimonio),
        );
      }
      assert.equal(
        (await validateApprovedManifest(root, manifest, CATALOG, factory))
          .length,
        12,
      );
      const first = manifest.equipments[0].candidates[0];
      await writeFile(join(root, first.file), "tampered");
      await assert.rejects(
        validateApprovedManifest(root, manifest, CATALOG, factory),
        /Hash/,
      );
      await writeFile(join(root, first.file), Buffer.from("TI-0001"));
      const second = manifest.equipments[1].candidates[0];
      second.image_sha256 = first.image_sha256;
      second.file = `candidates/TI-0002/2-${first.image_sha256}.jpg`;
      second.reviews[0].image_sha256 = first.image_sha256;
      await assert.rejects(
        validateApprovedManifest(root, manifest, CATALOG, factory),
        /duplicadas/,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  it("prepares once per exact search page without automatic reviews", async () => {
    const root = await mkdtemp(join(tmpdir(), "images-prepare-unit-"));
    try {
      const manifest = {
        version: 1,
        equipments: CATALOG.map((item) => ({
          ...item,
          pages: [],
          candidates: [],
          selected_id: null,
        })),
      };
      let calls = 0;
      const request = async (url) => {
        calls++;
        assert.equal(
          new URL(url).searchParams.get("q"),
          CATALOG[calls - 1].busca,
        );
        return { hits: [] };
      };
      await prepare(manifest, root, "synthetic", 1, { request });
      await prepare(manifest, root, "synthetic", 1, { request });
      assert.equal(calls, 12);
      assert.equal(
        manifest.equipments.flatMap((item) => item.candidates).length,
        0,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
describe("images human loading safety", () => {
  it("requires explicit matching project, direct secrets and separate test account", () => {
    assert.equal(humanConfig(args, env).ref, ref);
    for (const [badArgs, badEnv] of [
      [[], env],
      [args, { ...env, SUPABASE_URL: "https://other.supabase.co" }],
      [args, { ...env, TEST_ACCOUNT_EMAIL: env.PROFESSOR_EMAIL }],
      [args, { ...env, DATABASE_URL: env.DATABASE_URL + "?sslmode=disable" }],
      [args, { ...env, PROFESSOR_PASSWORD: "" }],
    ])
      assert.throws(() => humanConfig(badArgs, badEnv));
  });
  it("paginates users and reuses existing email without changing password", async () => {
    let pages = 0;
    let creations = 0;
    const admin = {
      listUsers: async ({ page }) => {
        pages++;
        return {
          data: {
            users:
              page === 1
                ? Array.from({ length: 100 }, (_, i) => ({
                    id: String(i),
                    email: `x${i}@example.test`,
                  }))
                : [
                    {
                      id: "existing",
                      email: env.PROFESSOR_EMAIL.toUpperCase(),
                    },
                  ],
          },
        };
      },
      createUser: async () => {
        creations++;
      },
    };
    assert.equal(
      (await findAuthUser(admin, env.PROFESSOR_EMAIL)).id,
      "existing",
    );
    assert.equal(
      (await ensureAuthUser(admin, env.PROFESSOR_EMAIL, "synthetic")).id,
      "existing",
    );
    assert.equal(creations, 0);
    assert.equal(pages, 4);
  });
  it("detects create-user races without silently changing password", async () => {
    let calls = 0;
    const admin = {
      listUsers: async () => ({
        data: {
          users:
            ++calls === 1
              ? []
              : [{ id: "existing", email: env.PROFESSOR_EMAIL }],
        },
      }),
      createUser: async () => ({ error: { message: "already exists" } }),
    };
    assert.equal(
      (await ensureAuthUser(admin, env.PROFESSOR_EMAIL, "synthetic")).id,
      "existing",
    );
  });
  it("blocks any professor loans without deletion", async () => {
    await assert.rejects(
      assertProfessorClear(
        {
          query: async (sql, params) => {
            assert.match(sql, /WHERE user_id = \$1::uuid/);
            assert.equal(params.length, 1);
            return { rows: [{ count: 1 }] };
          },
        },
        { id: "11111111-1111-4111-8111-111111111111" },
      ),
      /Professor/,
    );
  });
  it("preserves borrowed equipment and blocks differing dataset", async () => {
    const item = fixture().equipments[0];
    const candidate = item.candidates[0];
    const approved = { item, candidate };
    const imageUrl = "https://example.test/photo";
    const existing = {
      ...item,
      ...candidate,
      image_url: imageUrl,
      situacao: "emprestado",
    };
    assert.doesNotThrow(() =>
      assertExistingMatches(existing, approved, imageUrl),
    );
    assert.throws(() =>
      assertExistingMatches({ ...existing, nome: "other" }, approved, imageUrl),
    );
    const statements = [];
    await seedEquipments(
      {
        query: async (sql, params) => {
          statements.push(sql);
          assert.deepEqual(params, [item.patrimonio]);
          return { rows: [existing] };
        },
      },
      [{ approved, imageUrl }],
    );
    assert.equal(statements.length, 1);
    assert.ok(!statements.some((sql) => /^(UPDATE|INSERT|DELETE)\b/.test(sql)));
  });
  it("uses parameterized insert without loans or state-reset updates", async () => {
    const item = fixture().equipments[0];
    const statements = [];
    await seedEquipments(
      {
        query: async (sql, params) => {
          statements.push([sql, params]);
          return { rows: [] };
        },
      },
      [
        {
          approved: { item, candidate: item.candidates[0] },
          imageUrl: "https://example.test",
        },
      ],
    );
    assert.match(statements[1][0], /VALUES \(\$1,\$2/);
    assert.equal(statements[1][1].length, 10);
    assert.ok(
      !statements.some(([sql]) => /loans|DELETE|UPDATE public/.test(sql)),
    );
  });
  it("reuses immutable storage bytes and refuses collisions", async () => {
    const item = fixture().equipments[0];
    const approved = {
      item,
      candidate: item.candidates[0],
      bytes: Buffer.from(item.patrimonio),
    };
    let uploads = 0;
    const storage = {
      download: async () => ({ data: new Blob([approved.bytes]) }),
      upload: async () => {
        uploads++;
      },
    };
    await uploadImmutable(storage, approved);
    await uploadImmutable(storage, approved);
    assert.equal(uploads, 0);
    await assert.rejects(
      uploadImmutable(
        { ...storage, download: async () => ({ data: new Blob(["wrong"]) }) },
        approved,
      ),
      /hash/,
    );
  });
  it("rejects an extra equipment before external calls and rolls back without deleting", async () => {
    const statements = [];
    let externalCalls = 0;
    const client = {
      query: async (sql) => {
        statements.push(sql);
        return {
          rows:
            sql === "SELECT patrimonio FROM public.equipments"
              ? [
                  ...CATALOG.map(({ patrimonio }) => ({ patrimonio })),
                  { patrimonio: "TI-9999" },
                ]
              : [],
        };
      },
    };
    const external = () => {
      externalCalls++;
      throw new Error("No external calls allowed for an invalid catalog");
    };
    const supabase = {
      auth: { admin: { listUsers: external, createUser: external } },
      storage: { getBucket: external, from: external },
    };
    const approved = fixture().equipments.map((item) => ({
      item,
      candidate: item.candidates[0],
      bytes: Buffer.from(item.patrimonio),
    }));
    await assert.rejects(
      loadData(humanConfig(args, env), approved, {
        client,
        supabase,
        verifyPublic: external,
      }),
      /patrimônio fora do dataset aprovado/,
    );
    assert.equal(externalCalls, 0);
    assert.equal(statements[0], "BEGIN");
    assert.ok(
      statements.indexOf("SELECT patrimonio FROM public.equipments") >
        statements.findIndex((sql) => sql.startsWith("LOCK TABLE")),
    );
    assert.equal(statements.at(-1), "ROLLBACK");
    assert.ok(!statements.includes("COMMIT"));
    assert.ok(!statements.some((sql) => /^(INSERT|UPDATE|DELETE)/.test(sql)));
  });
  it("rolls back PostgreSQL when professor precheck fails", async () => {
    const statements = [];
    const client = {
      query: async (sql) => {
        statements.push(sql);
        if (sql === "SELECT patrimonio FROM public.equipments")
          return { rows: [] };
        return { rows: [{ count: 2 }] };
      },
    };
    const supabase = {
      auth: {
        admin: {
          listUsers: async () => ({
            data: {
              users: [
                {
                  id: "11111111-1111-4111-8111-111111111111",
                  email: env.PROFESSOR_EMAIL,
                },
              ],
            },
          }),
        },
      },
    };
    await assert.rejects(
      loadData(humanConfig(args, env), [], { client, supabase }),
      /Professor possui empréstimos/,
    );
    assert.equal(statements.at(-1), "ROLLBACK");
    assert.ok(!statements.includes("COMMIT"));
  });
});

describe("images synthetic sharp and full mocked loading", () => {
  it("processes a generated solid-color buffer with real sharp into JPEG 800x600", async () => {
    const { default: sharp } = await import("sharp");
    const source = await sharp({
      create: { width: 1200, height: 400, channels: 3, background: "#557799" },
    })
      .png()
      .toBuffer();
    const final = await transformImage(source);
    const metadata = await sharp(final.bytes).metadata();
    assert.deepEqual(
      [metadata.width, metadata.height, metadata.format],
      [800, 600, "jpeg"],
    );
    assert.equal(final.image_sha256, sha256(final.bytes));
    await assert.rejects(transformImage(Buffer.from("not an image")));
  });
  it("uploads a missing immutable object only once and never overwrites", async () => {
    const item = fixture().equipments[0];
    const approved = {
      item,
      candidate: item.candidates[0],
      bytes: Buffer.from(item.patrimonio),
    };
    let bytes;
    let uploads = 0;
    const storage = {
      download: async () =>
        bytes
          ? { data: new Blob([bytes]) }
          : { error: { status: 400, statusCode: "404" } },
      upload: async (_path, value, options) => {
        uploads++;
        assert.equal(options.upsert, false);
        bytes = value;
        return { data: {} };
      },
    };
    await uploadImmutable(storage, approved);
    await uploadImmutable(storage, approved);
    assert.equal(uploads, 1);
  });
  it("blocks generic HTTP 400 and permission errors without attempting upload", async () => {
    const item = fixture().equipments[0];
    const approved = {
      item,
      candidate: item.candidates[0],
      bytes: Buffer.from(item.patrimonio),
    };
    for (const error of [
      { status: 400 },
      { status: 400, statusCode: "400" },
      { status: 403, statusCode: "403" },
    ]) {
      let uploads = 0;
      const storage = {
        download: async () => ({ error }),
        upload: async () => {
          uploads++;
          return { data: {} };
        },
      };
      await assert.rejects(
        uploadImmutable(storage, approved),
        /ausência do objeto/,
      );
      assert.equal(uploads, 0);
    }
  });
  it("repeats full mocked load without duplicate equipment, users or storage objects", async () => {
    const config = humanConfig(args, env);
    const rows = new Map();
    const objects = new Map();
    const users = [];
    const statements = [];
    let uploads = 0;
    let creations = 0;
    let professorChecks = 0;
    const approved = fixture().equipments.map((item) => ({
      item,
      candidate: item.candidates[0],
      bytes: Buffer.from(item.patrimonio),
    }));
    const client = {
      query: async (sql, params = []) => {
        statements.push(sql);
        if (sql.includes("count(*)")) {
          professorChecks++;
          return { rows: [{ count: 0 }] };
        }
        if (sql === "SELECT patrimonio FROM public.equipments")
          return {
            rows: [...rows.keys()].map((patrimonio) => ({ patrimonio })),
          };
        if (sql.startsWith("SELECT * FROM public.equipments"))
          return { rows: rows.has(params[0]) ? [rows.get(params[0])] : [] };
        if (sql.startsWith("INSERT INTO public.equipments")) {
          const fields = [
            "patrimonio",
            "nome",
            "categoria",
            "situacao",
            "image_url",
            "pexels_id",
            "photographer",
            "source_url",
            "license_url",
            "image_sha256",
          ];
          rows.set(
            params[0],
            Object.fromEntries(fields.map((field, i) => [field, params[i]])),
          );
        }
        return { rows: [] };
      },
    };
    const storage = {
      getPublicUrl: (path) => ({
        data: {
          publicUrl: `${config.url}/storage/v1/object/public/${config.bucket}/${path}`,
        },
      }),
      download: async (path) =>
        objects.has(path)
          ? { data: new Blob([objects.get(path)]) }
          : { error: { statusCode: 404 } },
      upload: async (path, bytes, options) => {
        assert.equal(options.upsert, false);
        uploads++;
        objects.set(path, bytes);
        return { data: {} };
      },
    };
    const supabase = {
      auth: {
        admin: {
          listUsers: async () => ({ data: { users } }),
          createUser: async ({ email }) => {
            creations++;
            const user = {
              id: `${creations === 1 ? "11111111" : "22222222"}-1111-4111-8111-111111111111`,
              email,
            };
            users.push(user);
            return { data: { user } };
          },
        },
      },
      storage: {
        getBucket: async () => ({ data: { public: true } }),
        from: () => storage,
      },
    };
    const verifyPublic = async (url, hash) => {
      const path = url.split(`/public/${config.bucket}/`)[1];
      assert.equal(sha256(objects.get(path)), hash);
    };
    await loadData(config, approved, { client, supabase, verifyPublic });
    // Uma base parcialmente carregada também deve completar sem duplicar recursos externos.
    rows.delete("TI-0012");
    rows.get("TI-0001").situacao = "emprestado";
    await loadData(config, approved, { client, supabase, verifyPublic });
    assert.equal(rows.size, 12);
    assert.equal(objects.size, 12);
    assert.equal(users.length, 2);
    assert.equal(uploads, 12);
    assert.equal(creations, 2);
    assert.equal(rows.get("TI-0001").situacao, "emprestado");
    assert.ok(professorChecks >= 5);
    assert.equal(statements.filter((sql) => sql === "COMMIT").length, 2);
    assert.ok(
      !statements.some(
        (sql) =>
          /^(DELETE|UPDATE)/.test(sql) ||
          sql.startsWith("INSERT INTO public.loans"),
      ),
    );
  });
});
