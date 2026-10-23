import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Entrar | Empresta Aí",
  description:
    "Tela de acesso do Empresta Aí. A autenticação ainda está em preparação.",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] px-5 py-10 text-[var(--text)] sm:px-8">
      <div className="ambient-grid" aria-hidden="true" />
      <div className="ambient-glow ambient-glow--cyan" aria-hidden="true" />
      <div className="ambient-glow ambient-glow--purple" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md">
        <header className="mb-8 flex justify-center">
          <Link href="/" className="group flex items-center gap-3">
            <span className="logo-mark" aria-hidden="true">
              E
            </span>
            <span className="font-display text-lg font-extrabold tracking-[-0.03em]">
              empresta<span className="text-[var(--cyan)]">aí</span>
            </span>
          </Link>
        </header>

        <section className="rounded-3xl border border-[var(--border)] bg-[rgba(9,18,33,.9)] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
          <div className="mb-8">
            <p className="eyebrow">Área de acesso</p>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Entre na sua conta
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Acompanhe os equipamentos compartilhados pela sua equipe.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="email">
                E-mail
              </label>
              <input
                autoComplete="username"
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(5,10,20,.75)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus-visible:border-[var(--cyan)] focus-visible:ring-2 focus-visible:ring-[rgba(0,229,255,.18)]"
                id="email"
                name="email"
                placeholder="seu@email.com"
                type="email"
              />
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium"
                htmlFor="password"
              >
                Senha
              </label>
              <input
                autoComplete="current-password"
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(5,10,20,.75)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus-visible:border-[var(--cyan)] focus-visible:ring-2 focus-visible:ring-[rgba(0,229,255,.18)]"
                id="password"
                name="password"
                placeholder="Digite sua senha"
                type="password"
              />
            </div>

            <button
              aria-describedby="login-status"
              className="button w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
              disabled
              type="button"
            >
              Entrar
            </button>
          </div>

          <p
            className="mt-4 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,.025)] px-4 py-3 text-center text-xs leading-5 text-[var(--muted)]"
            id="login-status"
            role="status"
          >
            A autenticação ainda não está ativa neste projeto.
          </p>
        </section>

        <p className="mt-7 text-center text-sm text-[var(--muted)]">
          <Link
            className="rounded-sm transition hover:text-[var(--cyan)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cyan)]"
            href="/"
          >
            <span aria-hidden="true">← </span>
            Voltar para a página inicial
          </Link>
        </p>
      </div>
    </main>
  );
}
