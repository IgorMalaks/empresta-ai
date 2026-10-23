"use client";

import { useState } from "react";
import { BrandMark } from "./_components/brand-mark";

type IconName =
  "search" | "calendar" | "shield" | "arrow" | "check" | "menu" | "close";

function Icon({
  name,
  className = "size-5",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.7 2.7 8.1 7 10 4.3-1.9 7-5.3 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    check: <path d="m5 12 4 4L19 6" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  );
}

const steps = [
  {
    number: "01",
    icon: "search" as const,
    title: "Encontre",
    description:
      "Veja o que está disponível em um catálogo simples e organizado.",
  },
  {
    number: "02",
    icon: "calendar" as const,
    title: "Solicite",
    description: "Escolha o período e registre seu pedido em poucos passos.",
  },
  {
    number: "03",
    icon: "shield" as const,
    title: "Acompanhe",
    description: "Consulte o andamento e mantenha cada movimentação visível.",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--text)]">
      <div className="ambient-grid" aria-hidden="true" />
      <div className="ambient-glow ambient-glow--cyan" aria-hidden="true" />
      <div className="ambient-glow ambient-glow--purple" aria-hidden="true" />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-[rgba(8,12,26,.88)] backdrop-blur-xl">
        <nav
          className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10"
          aria-label="Navegação principal"
        >
          <a
            href="#inicio"
            className="group flex items-center gap-3"
            onClick={closeMenu}
          >
            <BrandMark />
            <span className="font-display text-lg font-extrabold tracking-[-0.03em]">
              empresta<span className="text-[var(--cyan)]">aí</span>
            </span>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            <a className="nav-link" href="#como-funciona">
              Como funciona
            </a>
            <a className="nav-link" href="#beneficios">
              Benefícios
            </a>
            <a className="nav-link" href="#sobre">
              Sobre
            </a>
          </div>

          <a
            className="button button--small !hidden md:!inline-flex"
            href="#sobre"
          >
            Conhecer o projeto
            <Icon name="arrow" className="size-4" />
          </a>

          <button
            type="button"
            className="grid size-10 place-items-center rounded-xl border border-[var(--border)] text-[var(--cyan)] md:hidden"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </nav>

        {menuOpen ? (
          <div className="border-t border-[var(--border)] bg-[var(--background)] px-5 py-5 md:hidden">
            <div className="mx-auto grid max-w-7xl gap-1">
              <a
                className="mobile-link"
                href="#como-funciona"
                onClick={closeMenu}
              >
                Como funciona
              </a>
              <a className="mobile-link" href="#beneficios" onClick={closeMenu}>
                Benefícios
              </a>
              <a className="mobile-link" href="#sobre" onClick={closeMenu}>
                Sobre
              </a>
              <a
                className="button mt-3 justify-center"
                href="#sobre"
                onClick={closeMenu}
              >
                Conhecer o projeto
              </a>
            </div>
          </div>
        ) : null}
      </header>

      <section
        id="inicio"
        className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-16 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pt-24"
      >
        <div className="relative z-10 max-w-3xl">
          <div className="status-badge reveal reveal-1">
            <span className="status-dot" />
            Equipamentos em movimento
          </div>

          <p className="eyebrow reveal reveal-2">Compartilhe · Use · Devolva</p>
          <h1 className="hero-title reveal reveal-3">
            O que você precisa,
            <br />
            <span className="gradient-text">bem mais perto.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-[var(--muted)] reveal reveal-4 sm:text-lg">
            O Empresta Aí reúne equipamentos compartilhados em uma experiência
            clara, para todo mundo saber o que está disponível e onde cada item
            está.
          </p>

          <div className="mt-9 flex flex-col gap-3 reveal reveal-5 sm:flex-row">
            <a className="button justify-center" href="#como-funciona">
              Conhecer o fluxo
              <Icon name="arrow" />
            </a>
            <a className="button button--ghost justify-center" href="#sobre">
              Entender o projeto
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[var(--muted)] reveal reveal-6">
            {[
              "Catálogo centralizado",
              "Histórico visível",
              "Acesso simples",
            ].map((item) => (
              <span className="flex items-center gap-2" key={item}>
                <span className="grid size-5 place-items-center rounded-full bg-[rgba(91,127,224,.1)] text-[var(--accent-icon)]">
                  <Icon name="check" className="size-3.5" />
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-xl reveal reveal-4">
          <div className="product-window">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div className="flex gap-2" aria-hidden="true">
                <span className="window-dot bg-[var(--orange)]" />
                <span className="window-dot bg-[var(--yellow)]" />
                <span className="window-dot bg-[var(--green)]" />
              </div>
              <span className="text-[10px] uppercase tracking-[.2em] text-[var(--muted)]">
                Exemplo visual
              </span>
            </div>

            <div className="p-5 sm:p-7">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[.2em] text-[var(--accent-icon)]">
                    Olá, equipe
                  </p>
                  <h2 className="font-display mt-2 text-2xl font-bold">
                    O que vai circular hoje?
                  </h2>
                </div>
                <span className="availability-pill">
                  <span /> Dados ilustrativos
                </span>
              </div>

              <div className="mock-search">
                <Icon name="search" className="size-4" />
                <span>Buscar equipamento...</span>
                <kbd>⌘ K</kbd>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <article className="equipment-card equipment-card--active">
                  <div className="equipment-visual">
                    <svg viewBox="0 0 120 80" aria-hidden="true">
                      <rect x="28" y="13" width="64" height="44" rx="4" />
                      <path d="M18 65h84l-8-8H26l-8 8Z" />
                      <path d="M46 65h28" />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="equipment-label">Notebook</p>
                      <p className="equipment-meta">Categoria</p>
                    </div>
                    <span className="mini-status">Livre</span>
                  </div>
                </article>

                <article className="equipment-card">
                  <div className="equipment-visual equipment-visual--purple">
                    <svg viewBox="0 0 120 80" aria-hidden="true">
                      <rect x="24" y="18" width="72" height="43" rx="6" />
                      <circle cx="60" cy="39.5" r="13" />
                      <circle cx="60" cy="39.5" r="5" />
                      <path d="M39 18v-5h17v5" />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="equipment-label">Projetor</p>
                      <p className="equipment-meta">Categoria</p>
                    </div>
                    <span className="mini-status">Livre</span>
                  </div>
                </article>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,.025)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-[rgba(91,127,224,.13)] text-[var(--accent-text)]">
                    <Icon name="calendar" className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold">Próxima devolução</p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                      Acompanhamento em um só lugar
                    </p>
                  </div>
                </div>
                <Icon name="arrow" className="size-4 text-[var(--cyan)]" />
              </div>
            </div>
          </div>
          <div className="floating-chip floating-chip--top">
            <span>✓</span> Exemplo visual
          </div>
          <div className="floating-chip floating-chip--bottom">
            <span>↗</span> Menos tempo procurando
          </div>
        </div>
      </section>

      <section id="como-funciona" className="section-shell relative">
        <div className="mb-12 max-w-2xl">
          <p className="eyebrow">Como funciona</p>
          <h2 className="section-title">
            Do catálogo à devolução,
            <br />
            sem perder o fio.
          </h2>
          <p className="mt-4 leading-7 text-[var(--muted)]">
            Uma jornada direta para deixar o uso compartilhado mais previsível.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <div className="mb-12 flex items-center justify-between">
                <span className="step-icon">
                  <Icon name={step.icon} />
                </span>
                <span className="text-xs tracking-[.2em] text-[var(--accent-icon)]">
                  {step.number}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold">{step.title}</h3>
              <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--muted)]">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="beneficios"
        className="section-shell grid items-center gap-12 lg:grid-cols-2"
      >
        <div className="benefit-panel">
          <div className="benefit-orbit" aria-hidden="true">
            <span>EA</span>
          </div>
          <div className="benefit-stat benefit-stat--one">
            <b>Visível</b>
            <small>status de cada item</small>
          </div>
          <div className="benefit-stat benefit-stat--two">
            <b>Simples</b>
            <small>do pedido à devolução</small>
          </div>
          <div className="benefit-stat benefit-stat--three">
            <b>Compartilhado</b>
            <small>um catálogo para a equipe</small>
          </div>
        </div>

        <div>
          <p className="eyebrow">Por que usar</p>
          <h2 className="section-title">
            Menos ruído.
            <br />
            <span className="gradient-text">Mais circulação.</span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-[var(--muted)]">
            O Empresta Aí organiza a informação que costuma ficar espalhada e
            ajuda a equipe a encontrar respostas sem depender de mensagens
            soltas.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              [
                "Uma fonte de consulta",
                "Itens e movimentações vistos no mesmo ambiente.",
              ],
              [
                "Decisões mais rápidas",
                "Disponibilidade clara antes de fazer uma solicitação.",
              ],
              [
                "Responsabilidade visível",
                "Acompanhamento do início ao fim do empréstimo.",
              ],
              [
                "Experiência consistente",
                "O mesmo fluxo para quem solicita e para quem organiza.",
              ],
            ].map(([title, description]) => (
              <div className="benefit-item" key={title}>
                <Icon
                  name="check"
                  className="mt-0.5 size-4 shrink-0 text-[var(--green)]"
                />
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sobre" className="section-shell pb-8">
        <div className="cta-panel">
          <div>
            <p className="eyebrow">Empresta Aí</p>
            <h2 className="section-title max-w-2xl">
              Tudo pronto para transformar disponibilidade em acesso.
            </h2>
          </div>
          <div className="max-w-md lg:text-right">
            <p className="mb-6 text-sm leading-6 text-[var(--muted)]">
              A interface inicial está pronta. O acesso à plataforma será
              conectado quando os fluxos do produto forem especificados.
            </p>
            <a className="button justify-center" href="#inicio">
              Voltar ao início <Icon name="arrow" />
            </a>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-[var(--border)] px-5 py-8 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <div className="flex items-center gap-2">
          <BrandMark small />
          <span>Empresta Aí</span>
        </div>
        <p>Compartilhar começa por saber onde encontrar.</p>
      </footer>
    </main>
  );
}
