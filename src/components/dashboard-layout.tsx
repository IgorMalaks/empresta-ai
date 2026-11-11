import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/server/actions/auth";

export function DashboardLayout({
  current,
  children,
}: {
  current: "catalogo" | "emprestimos";
  children: ReactNode;
}) {
  return (
    <main className="dashboard-content">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="dashboard-header">
        <h1 id="conteudo" tabIndex={-1}>
          {current === "catalogo" ? "Catálogo" : "Meus empréstimos"}
        </h1>
        <nav aria-label="Área de empréstimos" className="dashboard-nav">
          {current === "catalogo" ? (
            <Link className="button button--small" href="/emprestimos">
              Meus empréstimos
            </Link>
          ) : (
            <Link className="button button--small" href="/catalogo">
              Catálogo
            </Link>
          )}
          <form action={logout}>
            <button className="button button--small" type="submit">
              Sair
            </button>
          </form>
        </nav>
      </header>
      {children}
    </main>
  );
}
