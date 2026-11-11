import { supabaseDatabaseCa } from "./supabase-ca";

export function databaseConfig(
  value: string | undefined,
  production: boolean,
  supabaseUrl?: string,
) {
  if (!value) throw new Error("Banco não configurado.");
  try {
    const url = new URL(value);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || url.hash)
      throw new Error();
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    const supabaseHost =
      /^db\.[a-z0-9]+\.supabase\.co$/.test(url.hostname) ||
      /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname);
    if (production) {
      const project = new URL(supabaseUrl ?? "");
      const ref = /^([a-z0-9]+)\.supabase\.co$/.exec(project.hostname)?.[1];
      if (
        !ref ||
        project.origin !== `https://${ref}.supabase.co` ||
        project.username ||
        project.password ||
        project.pathname !== "/" ||
        project.search ||
        project.hash
      )
        throw new Error();
      const direct = url.hostname === `db.${ref}.supabase.co`;
      const pooler =
        /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname) &&
        decodeURIComponent(url.username).endsWith(`.${ref}`);
      if ((!direct && !pooler) || url.pathname !== "/postgres")
        throw new Error();
      if (
        [...url.searchParams.keys()].some(
          (name) => !["pgbouncer", "connection_limit"].includes(name),
        )
      )
        throw new Error();
    } else if (
      !local &&
      [...url.searchParams.keys()].some((name) =>
        /ssl|host|service/i.test(name),
      )
    )
      throw new Error();
    return {
      connectionString: value,
      ssl:
        production || !local
          ? {
              rejectUnauthorized: true,
              ...(supabaseHost ? { ca: supabaseDatabaseCa } : {}),
            }
          : (false as const),
    };
  } catch {
    throw new Error("Configuração de banco inválida ou insegura.");
  }
}
