"use client";

import Link from "next/link";

export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main className="dashboard-content">
      <section className="panel empty-state">
        <h1>Não foi possível carregar esta página</h1>
        <p role="status">
          Tente novamente. Se o problema continuar, procure o responsável pelo
          projeto.
        </p>
        <div className="actions">
          <button className="button" type="button" onClick={() => retry()}>
            Tentar novamente
          </button>
          <Link className="button button--ghost" href="/">
            Voltar ao início
          </Link>
        </div>
      </section>
    </main>
  );
}
