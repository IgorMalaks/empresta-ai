"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "../auth/supabase";
import { assertActionOrigin } from "../auth/origin";
import { getPrismaClient } from "../db/prisma";

const messages: Record<string, string> = {
  LIMIT_REACHED:
    "Vc já tem 5 empréstimos em aberto. Não é possível solicitar outro.",
  OVERDUE: "Vc tem um empréstimo em atraso. Não é possível solicitar outro.",
  EQUIPMENT_UNAVAILABLE: "Este equipamento não está disponível.",
  EQUIPMENT_NOT_FOUND: "Equipamento não encontrado.",
};

export async function requestLoan(
  _previousState: { message: string },
  formData: FormData,
): Promise<{ message: string }> {
  const user = await requireUser();
  const input = z.uuid().safeParse(formData.get("equipmentId"));
  if (!input.success) return { message: "Equipamento inválido." };
  const correlationId = randomUUID();
  try {
    await assertActionOrigin();
    const rows = await getPrismaClient().$queryRaw<
      { code: string; loan_id: string | null }[]
    >`
      SELECT code, loan_id FROM public.request_loan(${user.id}::uuid, ${input.data}::uuid)`;
    const code = rows[0]?.code;
    console.info(
      JSON.stringify({
        event: "loan.request_result",
        correlationId,
        code: code ?? "INVALID_RESPONSE",
        loanId: rows[0]?.loan_id ?? null,
      }),
    );
    if (code !== "SUCCESS")
      return {
        message:
          messages[code ?? ""] ??
          "Não foi possível solicitar. Atualize e tente novamente.",
      };
  } catch {
    console.warn(
      JSON.stringify({ event: "loan.request_failed", correlationId }),
    );
    return {
      message:
        "Não foi possível confirmar o resultado. Atualize o catálogo e confira Meus empréstimos antes de tentar novamente.",
    };
  }
  revalidatePath("/catalogo");
  revalidatePath("/emprestimos");
  return {
    message:
      "Empréstimo criado. Confira a devolução prevista em Meus empréstimos.",
  };
}
