export default function Loading() {
  return (
    <section className="panel empty-state" aria-busy="true">
      <p role="status" aria-live="polite">
        Carregando…
      </p>
      <p className="muted">Estamos preparando a página.</p>
    </section>
  );
}
