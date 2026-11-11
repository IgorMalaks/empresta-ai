import { getPrismaClient } from "./db/prisma";
import { requireUser } from "./auth/supabase";

type EquipmentRow = {
  id: string;
  patrimonio: string;
  nome: string;
  categoria: string;
  situacao: string;
  imageUrl: string;
  photographer: string;
  sourceUrl: string;
};

export async function listEquipments() {
  await requireUser();
  return getPrismaClient().$queryRaw<EquipmentRow[]>`
    SELECT id, patrimonio, nome, categoria, situacao, image_url AS "imageUrl", photographer, source_url AS "sourceUrl"
    FROM public.equipments ORDER BY patrimonio`;
}

export async function listMyLoans(userId: string) {
  const user = await requireUser();
  if (userId !== user.id) throw new Error("Acesso não permitido.");
  const rows = await getPrismaClient().$queryRaw<
    {
      id: string;
      dueOn: Date;
      requestedAt: Date;
      nome: string;
      patrimonio: string;
      imageUrl: string;
      sourceUrl: string;
    }[]
  >`
    SELECT l.id, l.due_on AS "dueOn", l.requested_at AS "requestedAt", e.nome, e.patrimonio, e.image_url AS "imageUrl", e.source_url AS "sourceUrl"
    FROM public.loans l JOIN public.equipments e ON e.id = l.equipment_id
    WHERE l.user_id = ${user.id}::uuid AND l.returned_at IS NULL ORDER BY l.due_on, l.requested_at`;
  return rows.map(
    ({ id, dueOn, requestedAt, nome, patrimonio, imageUrl, sourceUrl }) => ({
      id,
      dueOn,
      requestedAt,
      equipment: { nome, patrimonio, imageUrl, sourceUrl },
    }),
  );
}
