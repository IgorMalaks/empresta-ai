import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Empresta Aí",
  description: "Equipamentos compartilhados, empréstimos sem complicação.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <header className="site-header">
          <div className="container header-inner">
            <Link className="brand" href="/">
              Empresta <span>Aí</span>
            </Link>
            <span className="header-caption">Mais uso. Menos desperdício.</span>
          </div>
        </header>
        <main id="conteudo" className="container" tabIndex={-1}>
          {children}
        </main>
        <footer className="container site-footer">
          Empresta Aí · Equipamentos para o seu dia a dia.
        </footer>
      </body>
    </html>
  );
}
