"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthClient } from "../auth/supabase";
import { assertActionOrigin } from "../auth/origin";

const loginInput = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
});

export async function login(
  _previousState: { message: string },
  formData: FormData,
): Promise<{ message: string }> {
  const parsed = loginInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { message: "Informe email e senha válidos." };
  try {
    await assertActionOrigin();
    const client = await getAuthClient(true);
    const { error } = await client.auth.signInWithPassword(parsed.data);
    if (error)
      return {
        message:
          "Não foi possível entrar. Confira os dados ou tente novamente.",
      };
  } catch {
    return {
      message:
        "Não foi possível entrar. Confira a configuração ou tente novamente.",
    };
  }
  redirect("/catalogo");
}

export async function logout() {
  await assertActionOrigin();
  const client = await getAuthClient(true);
  const { error } = await client.auth.signOut();
  if (error) throw new Error("Não foi possível sair. Tente novamente.");
  redirect("/login");
}
