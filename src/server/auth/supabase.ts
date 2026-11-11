import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookieOptions, getAuthConfig } from "./config";

export async function getAuthClient(writable = false) {
  const config = getAuthConfig();
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: authCookieOptions,
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: AbortSignal.timeout(10_000),
          cache: "no-store",
        }),
    },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (updates) => {
        if (writable)
          for (const { name, value, options } of updates)
            store.set(name, value, { ...options, ...authCookieOptions });
      },
    },
  });
}

export async function requireUser() {
  const client = await getAuthClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) redirect("/login");
  return data.user;
}
