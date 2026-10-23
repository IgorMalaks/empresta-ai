# Spec 002 — Página de login

**Status:** interface visual solicitada; autenticação não implementada.
**Rota:** `/login`

## Objetivo

Apresentar uma tela de acesso coerente com a identidade visual existente do
Empresta Aí, deixando claro que o login ainda não está ativo.

## Vínculo

- Projeto: Empresta Aí.
- Contexto técnico: [ADR-001](../../adr/001-stack.md).
- O PRD permanece em rascunho. A tela não ativa nem altera as decisões de
  autenticação registradas no ADR.

## Regras e comportamento

- A rota `/login` apresenta campos rotulados de e-mail e senha.
- Os campos usam tipos e atributos de preenchimento apropriados para acessibilidade e autocomplete, e permanecem desabilitados enquanto o login não estiver ativo.
- O botão “Entrar” fica desabilitado e a página informa que a autenticação ainda
  não está ativa.
- A tela não envia, armazena ou valida credenciais.
- Existe um link para voltar à página inicial.
- Existe um link claramente identificado para abrir a prévia visual pública de
  `/painel`, sem iniciar uma sessão.
- O layout se adapta a telas pequenas e grandes e mantém foco visível para
  navegação por teclado.

## Critérios de aceitação

- **CA-01:** acessar `/login` carrega a tela em português.
- **CA-02:** e-mail e senha têm rótulos visíveis e autocomplete apropriado.
- **CA-03:** o botão “Entrar” está desabilitado e o estado pendente está explicado.
- **CA-04:** o link de retorno abre `/`.
- **CA-05:** o link da prévia abre `/painel` sem habilitar o botão de login.
- **CA-06:** a página não envia credenciais nem simula uma sessão iniciada.
- **CA-07:** o layout permanece utilizável em telas pequenas e grandes.
- **CA-08:** o build de produção gera a rota `/login`.

## Fora de escopo

- Autenticação, sessões, cookies ou integração com Supabase Auth.
- Recuperação de senha, cadastro, convite ou confirmação de e-mail.
- Validação de credenciais ou redirecionamento após login.
- Alterações de banco, API, middleware ou autorização de rotas.

## Contratos afetados

Nenhum contrato de API ou banco. A entrega adiciona apenas a interface pública
da rota `/login` e links para `/` e para a prévia `/painel`.
