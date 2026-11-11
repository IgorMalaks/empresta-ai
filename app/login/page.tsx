import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { BrandMark } from "../_components/brand-mark";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Entrar | Empresta Aí",
  description: "Acesse o catálogo e os empréstimos do Empresta Aí.",
};

export default function LoginPage() {
  return (
    <main className="login-layout grid min-h-svh">
      <a className="skip-link" href="#acesso">
        Pular para o formulário de acesso
      </a>
      <section
        aria-labelledby="login-hero-title"
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
            <span className="login-kicker">Empréstimo de equipamentos</span>
            <h1 className="login-headline" id="login-hero-title">
              Os equipamentos de que você precisa, em um só lugar.
            </h1>
            <p className="login-description">
              Consulte os equipamentos disponíveis, solicite um empréstimo e
              acompanhe seus prazos.
            </p>
          </div>
          <div className="login-rule" aria-hidden="true" />
          <dl className="flex gap-10 text-xs text-[var(--hero-muted)]">
            <div className="flex flex-col gap-1.5">
              <dt className="order-2">itens por pessoa</dt>
              <dd className="text-2xl font-semibold text-foreground">5</dd>
            </div>
            <div className="flex flex-col gap-1.5">
              <dt className="order-2">dias úteis de prazo</dt>
              <dd className="text-2xl font-semibold text-foreground">14</dd>
            </div>
          </dl>
        </div>
        <Link
          className="text-xs text-accent-text hover:text-accent-hover"
          href="/"
        >
          Página inicial
        </Link>
      </section>

      <section
        id="acesso"
        tabIndex={-1}
        aria-labelledby="login-title"
        className="login-access flex items-center justify-center"
      >
        <div className="login-form-shell flex flex-col">
          <header className="flex flex-col gap-[10px]">
            <p className="w-fit rounded-full border border-border-frame px-3 py-1 text-[11px] tracking-[0.08em] text-muted uppercase">
              Acesso interno
            </p>
            <h2 className="login-form-title" id="login-title">
              Entrar
            </h2>
            <p className="text-[13px] leading-6 text-[var(--muted)]">
              Acesse com seu e-mail e senha para continuar.
            </p>
          </header>
          <LoginForm />
          <div className="grid gap-5">
            <div className="login-divider" aria-hidden="true" />
            <p className="text-center text-xs leading-5 text-muted">
              Precisa de acesso ou esqueceu sua senha?
              <br />
              Procure o responsável pelo projeto.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
