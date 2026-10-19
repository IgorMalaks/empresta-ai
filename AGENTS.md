# Empresta Aí

Projeto web em preparação para organizar equipamentos compartilhados. A página
inicial existe, mas os fluxos e as regras de negócio ainda não foram aprovados no PRD.
As decisões técnicas estão no ADR-001.

## Onde olhar

- `README.md`: estado da preparação e próximos passos.
- `docs/PRD.md`: rascunho de requisitos; ainda não é um PRD aprovado.
- `docs/specs/`: especificações e critérios de cada implementação.
- `docs/adr/001-stack.md`: registro parcial das escolhas técnicas.
- `rules/restrictions.md`: ler antes de qualquer tarefa.
- `docs/andar-zero.md`: proposta de critérios para o esqueleto técnico.

O HTML da Aula 8 e sua pasta de recursos são material de referência,
não uma especificação aprovada do produto.

## Precedência

Seguir as instruções explícitas do responsável. Uma especificação aprovada
prevalece sobre o código. Conflitos com decisões aceitas devem ser comunicados
antes de implementar a parte afetada. Rascunhos não são decisões aceitas.

## Processo

- Ler o ADR e as restrições antes de propor mudanças estruturais.
- Não preencher as escolhas pendentes por conta própria.
- Executar mudanças dentro do escopo autorizado e relatar sua verificação.
- Registrar comandos apenas depois de executados com sucesso neste projeto.

## Comandos verificados

- Instalar dependências: `npm install`.
- Iniciar localmente: `npm run dev`.
- Verificar lint: `npm run lint`.
- Verificar formatação: `npm run format:check`.
- Gerar build de produção: `npm run build`.

## Mapa atual

- `app/`: layout, rota inicial e estilos globais da aplicação Next.js.
- `docs/`: requisitos, decisões técnicas e critérios do andar zero.
- `rules/`: limites e verificações do trabalho no repositório.

## Estado atual do projeto

Existe uma página inicial responsiva em `/`, criada com Next.js, TypeScript e
Tailwind CSS. O lint, a formatação e o build foram verificados. Não há banco
provisionado, API, migrations, autenticação ou suíte de testes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
