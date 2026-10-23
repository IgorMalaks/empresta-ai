import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "../_components/brand-mark";

export const metadata: Metadata = {
  title: "Entrar | Empresta Aí",
  description:
    "Tela de acesso do Empresta Aí. A autenticação ainda está em preparação.",
};

export default function LoginPage() {
  return (
    <main className="login-layout grid min-h-screen">
      <section
        aria-label="Sobre o Empresta Aí"
        className="login-intro flex flex-col justify-between gap-14"
      >
        <Link href="/" className="flex w-fit items-center gap-3">
          <BrandMark />
          <span className="text-base font-semibold tracking-[0.02em]">
            Empresta Aí
          </span>
        </Link>

        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-[18px]">
            <span className="login-kicker">Equipamentos compartilhados</span>
            <h1 className="login-headline">
              O que você precisa.
              <br />
              Bem mais perto.
            </h1>
            <p className="login-description">
              O Empresta Aí reúne equipamentos compartilhados em uma experiência
              clara, para todo mundo saber o que está disponível e onde cada
              item está.
            </p>
          </div>
          <div className="login-rule" aria-hidden="true" />
          <p className="text-xs leading-6 text-[var(--muted)]">
            Uma proposta para organizar o uso compartilhado de equipamentos.
          </p>
        </div>

        <p className="text-[11px] text-[var(--faint)]">
          Empresta Aí · interface em preparação
        </p>
      </section>

      <section
        aria-label="Acesso ao Empresta Aí"
        className="login-access flex items-center justify-center"
      >
        <div className="login-form-shell flex flex-col">
          <header className="flex flex-col gap-[10px]">
            <h2 className="login-form-title">Entrar</h2>
            <p className="text-[13px] leading-6 text-[var(--muted)]">
              Acesse com seu e-mail e senha para continuar.
            </p>
          </header>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-[var(--muted)]" htmlFor="email">
                E-mail
              </label>
              <input
                autoComplete="username"
                className="login-control"
                disabled
                id="email"
                name="email"
                placeholder="voce@exemplo.com"
                type="email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-[var(--muted)]" htmlFor="password">
                Senha
              </label>
              <input
                autoComplete="current-password"
                className="login-control"
                disabled
                id="password"
                name="password"
                placeholder="Digite sua senha"
                type="password"
              />
            </div>

            <button
              aria-describedby="login-status"
              className="login-submit inline-flex items-center justify-center gap-3 disabled:cursor-not-allowed"
              disabled
              type="button"
            >
              Entrar
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

            <p className="login-status" id="login-status" role="status">
              A autenticação ainda não está ativa neste projeto.
            </p>
          </div>

          <div className="login-divider" aria-hidden="true" />

          <p className="text-center text-xs leading-[1.8] text-[var(--faint)]">
            Precisa voltar?
            <br />
            <Link
              className="text-[var(--muted)] transition hover:text-[var(--accent-text)]"
              href="/"
            >
              Voltar para a página inicial
            </Link>
            <br />
            <Link
              className="text-[var(--accent-text)] transition hover:text-[var(--accent-hover)]"
              href="/painel"
            >
              Ver prévia visual do painel
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
