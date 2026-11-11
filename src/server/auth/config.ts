import { z } from "zod";

const authEnvironment = z.object({
  SUPABASE_URL: z.url().refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      /^[a-z0-9]+\.supabase\.co$/.test(url.hostname) &&
      !url.username &&
      !url.password
    );
  }),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

export function getAuthConfig() {
  const parsed = authEnvironment.safeParse(process.env);
  if (!parsed.success) throw new Error("Autenticação não configurada.");
  return {
    url: parsed.data.SUPABASE_URL,
    key: parsed.data.SUPABASE_PUBLISHABLE_KEY,
  };
}

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
