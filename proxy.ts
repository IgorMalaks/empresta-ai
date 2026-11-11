import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authCookieOptions, getAuthConfig } from "./src/server/auth/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  const protectedPath =
    request.nextUrl.pathname.startsWith("/catalogo") ||
    request.nextUrl.pathname.startsWith("/emprestimos");
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    return protectedPath
      ? NextResponse.redirect(new URL("/login", request.url))
      : response;
  }
  try {
    const config = getAuthConfig();
    const client = createServerClient(config.url, config.key, {
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
        getAll: () => request.cookies.getAll(),
        setAll: (updates, cacheHeaders) => {
          for (const { name, value } of updates)
            request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of updates)
            response.cookies.set(name, value, {
              ...options,
              ...authCookieOptions,
            });
          for (const [name, value] of Object.entries(cacheHeaders))
            response.headers.set(name, value);
          response.headers.set("Cache-Control", "private, no-store, max-age=0");
        },
      },
    });
    const { data, error } = await client.auth.getUser();
    if (protectedPath && (error || !data.user)) {
      const denied = NextResponse.redirect(new URL("/login", request.url));
      for (const cookie of response.cookies.getAll())
        denied.cookies.set(cookie);
      denied.headers.set("Cache-Control", "private, no-store, max-age=0");
      return denied;
    }
    return response;
  } catch {
    return protectedPath
      ? NextResponse.redirect(new URL("/login", request.url))
      : response;
  }
}

export const config = {
  matcher: ["/login", "/catalogo/:path*", "/emprestimos/:path*"],
};
