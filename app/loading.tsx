export default function Loading() {
  return (
    <main className="dashboard-content">
      <section className="panel empty-state" aria-busy="true">
        <p role="status" aria-live="polite">
          Carregando…
        </p>
      </section>
    </main>
  );
}
