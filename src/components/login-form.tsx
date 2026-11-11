"use client";

import { useActionState, useState } from "react";
import { login } from "@/server/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, { message: "" });
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form action={action} className="flex flex-col gap-5" aria-busy={pending}>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-[var(--label)]" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className="login-control"
          placeholder="voce@exemplo.com"
          required
          maxLength={254}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-[var(--label)]" htmlFor="password">
          Senha
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="login-control login-password"
            placeholder="Digite sua senha"
            required
          />
          <button
            type="button"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            aria-controls="password"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-0 grid w-[42px] cursor-pointer place-items-center rounded-lg text-muted hover:text-foreground"
          >
            <svg
              aria-hidden="true"
              className="size-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
              <circle cx="12" cy="12" r="2.5" />
              {showPassword && <path d="m4 3 16 18" />}
            </svg>
          </button>
        </div>
      </div>
      <button
        className="login-submit inline-flex items-center justify-center gap-3"
        type="submit"
        disabled={pending}
        aria-describedby="login-status"
      >
        {pending ? "Entrando…" : "Entrar"}
        <svg
          aria-hidden="true"
          className="size-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        >
          <path d="M5 12h14m-5-5 5 5-5 5" />
        </svg>
      </button>
      <p
        id="login-status"
        className={
          state.message ? "login-status login-status--error" : "login-status"
        }
        role="status"
        aria-live="polite"
      >
        {pending ? "Entrando…" : state.message}
      </p>
    </form>
  );
}
