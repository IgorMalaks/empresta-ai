import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "../_components/brand-mark";

export const metadata: Metadata = {
  title: "Painel | Empresta Aí",
  description:
    "Prévia visual do painel do Empresta Aí. O acesso ainda não está ativo.",
};

export default function DashboardPreviewPage() {
  return (
    <div className="dashboard-shell">
      <aside aria-label="Navegação do painel" className="dashboard-sidebar">
        <Link
          aria-label="Empresta Aí, página inicial"
          className="dashboard-brand"
          href="/"
        >
          <BrandMark />
          <span>Empresta Aí</span>
        </Link>

        <div className="dashboard-sidebar-section">
          <p className="dashboard-sidebar-caption">ESPAÇO DE TRABALHO</p>
          <nav aria-label="Menu principal" className="dashboard-nav">
            <Link
              aria-current="page"
              className="dashboard-nav-link dashboard-nav-link--active"
              href="/painel"
            >
              <svg
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              >
                <path d="m3.5 10 8.5-7 8.5 7v9.5a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V10Z" />
                <path d="M9 20.5v-7h6v7" />
              </svg>
              Visão geral
            </Link>
          </nav>
        </div>

        <div className="dashboard-sidebar-status">
          <span aria-hidden="true" className="dashboard-sidebar-status-dot" />
          <div>
            <span>Prévia pública</span>
            <small>Sem autenticação</small>
          </div>
        </div>

        <div className="dashboard-sidebar-footer">
          <Link href="/">
            <svg
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
            >
              <path d="m14.5 18-6-6 6-6" />
            </svg>
            Voltar ao site
          </Link>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div aria-label="Localização atual" className="dashboard-breadcrumb">
            <span>Empresta Aí</span>
            <span aria-hidden="true">/</span>
            <span>Visão geral</span>
          </div>
          <Link className="dashboard-access-link" href="/login">
            Ir para acesso
            <svg
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            >
              <path d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
          </Link>
        </header>

        <main className="dashboard-content">
          <div className="dashboard-preview-banner" role="status">
            <span aria-hidden="true" className="dashboard-info-icon">
              i
            </span>
            <p>
              <strong>Prévia visual.</strong> O acesso e os recursos do painel
              ainda estão em preparação.
            </p>
          </div>

          <div className="dashboard-page-heading">
            <div>
              <p className="dashboard-eyebrow">PAINEL INICIAL</p>
              <h1>Bem-vindo ao Empresta Aí</h1>
              <p className="dashboard-page-description">
                Este é o ponto de partida da área de trabalho do projeto.
              </p>
            </div>
            <span className="dashboard-preview-pill">
              <span aria-hidden="true" />
              Demonstração
            </span>
          </div>

          <section
            aria-labelledby="dashboard-empty-title"
            className="dashboard-overview-panel"
          >
            <div className="dashboard-overview-copy">
              <p className="dashboard-eyebrow">EM PREPARAÇÃO</p>
              <h2 id="dashboard-empty-title">
                Sua área de trabalho está tomando forma.
              </h2>
              <p>
                Os módulos e as informações exibidos aqui serão definidos quando
                os requisitos do produto forem aprovados.
              </p>
              <Link className="dashboard-home-link" href="/">
                Conheça o projeto
                <svg
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                >
                  <path d="M5 12h14m-5-5 5 5-5 5" />
                </svg>
              </Link>
            </div>

            <div aria-hidden="true" className="dashboard-illustration">
              <div className="dashboard-illustration-orbit dashboard-illustration-orbit--outer" />
              <div className="dashboard-illustration-orbit dashboard-illustration-orbit--inner" />
              <div className="dashboard-illustration-center">
                <BrandMark />
              </div>
              <div className="dashboard-illustration-card dashboard-illustration-card--top">
                <span />
                <i />
                <i />
              </div>
              <div className="dashboard-illustration-card dashboard-illustration-card--bottom">
                <span />
                <i />
                <i />
              </div>
            </div>
          </section>

          <section
            aria-labelledby="dashboard-preview-details"
            className="dashboard-details"
          >
            <div className="dashboard-details-heading">
              <div>
                <h2 id="dashboard-preview-details">Sobre esta prévia</h2>
                <p>O que está disponível nesta etapa do projeto.</p>
              </div>
              <span className="dashboard-details-label">ESTADO DO PROJETO</span>
            </div>
            <dl className="dashboard-details-grid">
              <div>
                <dt>Acesso</dt>
                <dd>Autenticação ainda não ativa</dd>
              </div>
              <div>
                <dt>Informações do produto</dt>
                <dd>Aguardando definição dos requisitos</dd>
              </div>
              <div>
                <dt>Esta tela</dt>
                <dd>Prévia visual, sem dados reais</dd>
              </div>
            </dl>
          </section>

          <footer className="dashboard-footer">
            <span>Empresta Aí · interface em preparação</span>
            <Link href="/login">Voltar para a página de acesso</Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
