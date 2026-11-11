import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Compartilhar faz sentido</p>
        <h1>
          O equipamento que você precisa.
          <br />
          <span>Sem complicar.</span>
        </h1>
        <p className="lead">
          Consulte os equipamentos da equipe, solicite um empréstimo e acompanhe
          seus prazos em um só lugar.
        </p>
        <Link href="/login" className="button">
          Entrar e ver catálogo
        </Link>
        <p className="muted">
          Acesso com conta já cadastrada. Não há cadastro público.
        </p>
      </section>
      <section className="steps" aria-label="Como funciona">
        <article className="panel">
          <p className="eyebrow">01 · Escolha</p>
          <h2>Veja o catálogo</h2>
          <p>Consulte a situação dos notebooks, monitores, cabos e câmeras.</p>
        </article>
        <article className="panel">
          <p className="eyebrow">02 · Solicite</p>
          <h2>Empréstimo imediato</h2>
          <p>
            Um equipamento disponível pode ser emprestado sem fila ou aprovação.
          </p>
        </article>
        <article className="panel">
          <p className="eyebrow">03 · Acompanhe</p>
          <h2>Fique de olho no prazo</h2>
          <p>
            São 14 dias úteis, sem excluir feriados nesta versão, e até cinco
            empréstimos em aberto. Atrasos impedem novas solicitações.
          </p>
        </article>
      </section>
    </>
  );
}
