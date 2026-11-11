"use client";

import { useActionState } from "react";
import { login } from "@/server/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, { message: "" });
  return (
    <form action={action} className="form-stack" aria-busy={pending}>
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
        />
      </div>
      <div className="field">
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <p
        id="login-status"
        className="form-status"
        role="status"
        aria-live="polite"
      >
        {pending ? "Entrando…" : state.message}
      </p>
      <button
        className="button"
        type="submit"
        disabled={pending}
        aria-describedby="login-status"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
