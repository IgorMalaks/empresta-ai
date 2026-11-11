import Link from "next/link";
import { logout } from "@/server/actions/auth";

export function Navigation({
  current,
}: {
  current: "catalogo" | "emprestimos";
}) {
  return (
    <nav className="navigation" aria-label="Área de empréstimos">
      <Link
        href="/catalogo"
        aria-current={current === "catalogo" ? "page" : undefined}
      >
        Catálogo
      </Link>
      <Link
        href="/emprestimos"
        aria-current={current === "emprestimos" ? "page" : undefined}
      >
        Meus empréstimos
      </Link>
      <form action={logout}>
        <button className="button button-secondary" type="submit">
          Sair
        </button>
      </form>
    </nav>
  );
}
