# Spec 004 — Painel inicial

**Status:** prévia visual solicitada; autenticação não implementada.
**Rota:** `/painel`

## Objetivo

Criar uma primeira tela para a área interna do Empresta Aí, usando o sistema
visual existente e deixando explícito que se trata de uma prévia sem login.

## Vínculo

- Projeto: Empresta Aí.
- Contexto técnico: [ADR-001](../../adr/001-stack.md).
- Identidade visual: [Sistema visual](../../design-system.md).
- O PRD permanece em rascunho e não é alterado por esta implementação.

## Regras e comportamento

- A rota `/painel` apresenta a estrutura visual de uma página inicial após o
  login, mas permanece pública enquanto autenticação e autorização não existem.
- A página identifica visivelmente que é uma prévia demonstrativa, sem sessão
  iniciada.
- A página não apresenta dados, contagens, pessoas, equipamentos ou estados
  fictícios como se fossem registros reais.
- A página não define módulos, fluxos, permissões nem regras de negócio ainda
  pendentes no PRD.
- Os únicos controles funcionais são navegação para `/` e `/login`; ações de
  produto não são simuladas.
- `/login` oferece um link identificado como prévia para `/painel`. O botão
  “Entrar” continua desabilitado e não inicia uma sessão.
- A composição usa os tokens compartilhados do sistema visual e se adapta a
  telas pequenas e grandes, com foco visível e suporte a movimento reduzido.

## Critérios de aceitação

- **CA-01:** `/painel` carrega uma interface em português com a identidade do
  Empresta Aí.
- **CA-02:** o estado de prévia sem autenticação fica claro e não sugere sessão
  iniciada.
- **CA-03:** não há dados fictícios apresentados como dados reais nem regras de
  negócio novas.
- **CA-04:** links de navegação funcionam para `/` e `/login`; ações de produto
  permanecem indisponíveis.
- **CA-05:** `/login` permite abrir `/painel` como prévia sem habilitar o login.
- **CA-06:** as telas permanecem utilizáveis em larguras pequenas e grandes e
  conservam foco visível e movimento reduzido.
- **CA-07:** lint, formatação e build de produção terminam sem erros.

## Fora de escopo

- Autenticação, sessões, cookies, middleware ou autorização de rotas.
- Consultas ou gravações no PostgreSQL, API ou integração com Supabase.
- Aprovação de módulos, fluxos ou regras de negócio do produto.
- Dados de demonstração que possam ser confundidos com registros reais.

## Contratos afetados

Nenhum contrato de API ou banco. A entrega adiciona a interface pública de
`/painel` e um link de prévia em `/login`.
