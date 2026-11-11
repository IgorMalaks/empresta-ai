import { headers } from "next/headers";

export function isAllowedOrigin(
  origin: string | null,
  appUrl: string | undefined,
  development: boolean,
) {
  if (!origin) return false;
  try {
    const received = new URL(origin);
    if (appUrl) return received.origin === new URL(appUrl).origin;
    return (
      development &&
      received.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(received.hostname)
    );
  } catch {
    return false;
  }
}

export async function assertActionOrigin() {
  const requestHeaders = await headers();
  if (
    !isAllowedOrigin(
      requestHeaders.get("origin"),
      process.env.APP_URL,
      process.env.NODE_ENV !== "production",
    )
  ) {
    throw new Error("Origem da solicitação não permitida.");
  }
}
