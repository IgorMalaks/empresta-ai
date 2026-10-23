# Spec 003 — Sistema visual

**Status:** adaptação visual solicitada pelo responsável com base no projeto EmpresTI.
**Rotas:** `/` e `/login`

## Objetivo

Alinhar a identidade visual do Empresta Aí ao sistema visual observado no
projeto EmpresTI, mantendo os textos, a marca e o comportamento já definidos
para o Empresta Aí.

## Vínculo

- Projeto: Empresta Aí.
- Contexto técnico: [ADR-001](../../adr/001-stack.md).
- Tokens e referência visual: [Sistema visual](../../design-system.md).
- A inspiração visual não importa as regras de negócio do EmpresTI.
- O PRD permanece em rascunho e não é alterado por esta implementação.

## Regras e comportamento

- Usar a paleta azul-marinho e azul, Open Sans, superfícies escuras, bordas
  discretas e raio de 8 px da referência visual.
- Centralizar os tokens compartilhados em `app/globals.css` e aplicá-los às
  rotas `/` e `/login`.
- Apresentar `/login` em duas colunas em telas largas, com painel de identidade
  à esquerda e área de acesso à direita; empilhar as áreas em telas estreitas.
- Preservar a marca Empresta Aí, os textos e o conteúdo ilustrativo atuais.
- Não importar nomes, limites, prazos ou regras de acesso definidos pelo
  EmpresTI.
- Manter campos e botão de login desabilitados até haver autenticação
  implementada; não enviar nem armazenar credenciais.
- Preservar as seções, navegação e funcionamento responsivo da página inicial.
- Manter foco visível e suporte à preferência de movimento reduzido.

## Critérios de aceitação

- **CA-01:** `/` e `/login` usam a mesma paleta, tipografia e estilo de controles.
- **CA-02:** a página inicial preserva suas seções, conteúdo e navegação.
- **CA-03:** a tela de login usa o layout dividido em telas largas e empilhado em telas pequenas.
- **CA-04:** a tela continua identificada como Empresta Aí e não inclui regras de negócio da referência.
- **CA-05:** campos e botão de login ficam desabilitados e nenhuma credencial é transmitida.
- **CA-06:** foco por teclado e movimento reduzido continuam suportados.
- **CA-07:** lint, formatação e build de produção terminam sem erros.

## Fora de escopo

- Alteração de fluxos ou regras do PRD.
- Autenticação, sessão, integração com Supabase ou envio de credenciais.
- Mudanças em banco, API, autorização ou infraestrutura.
- Cópia de código de produto ou conteúdo específico do EmpresTI.

## Contratos afetados

Nenhum contrato de API ou banco. A entrega altera somente estilos globais e a
apresentação das rotas públicas `/` e `/login`.
