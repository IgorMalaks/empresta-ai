import { getPrismaClient } from "@/server/db/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await getPrismaClient().$queryRaw`SELECT 1`;

    return Response.json({ status: "ok", database: "connected" });
  } catch {
    return Response.json(
      { status: "unavailable", database: "unavailable" },
      { status: 503 },
    );
  }
}
