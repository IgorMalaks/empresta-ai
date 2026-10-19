# Spec 001 — Página inicial

**Status:** escopo visual da primeira entrega, solicitado pelo responsável.
**Rota:** `/`

## Objetivo

Apresentar o Empresta Aí e explicar, em uma página pública, a proposta de
organizar o compartilhamento de equipamentos. Esta entrega é uma apresentação
visual; não comprova nem executa operações de empréstimo.

## Vínculo

- Projeto: Empresta Aí.
- Contexto técnico: [ADR-001](../../adr/001-stack.md).
- O PRD continua em rascunho; regras e fluxos de negócio dependem de aprovação
  separada.

## Regras e comportamento

- A página deve identificar o produto como Empresta Aí e apresentar sua proposta
  de forma breve.
- A página reúne as seções de apresentação, como funciona, benefícios e sobre.
- A navegação por seção usa links internos da própria página.
- Em telas pequenas, os links da navegação ficam em um menu que pode ser aberto
  e fechado; selecionar uma opção fecha o menu.
- A prévia do catálogo e seus números, itens e status são dados ilustrativos e
  devem estar identificados como demonstração.
- Nenhum botão deve sugerir que login, solicitação, inventário ou operação de
  empréstimo real já está disponível.
- A página deve se adaptar a telas pequenas e respeitar a preferência do sistema
  por movimento reduzido.

## Critérios de aceitação

- **CA-01:** acessar `/` carrega a apresentação do Empresta Aí em português.
- **CA-02:** a página exibe as seções de apresentação, como funciona, benefícios
  e sobre.
- **CA-03:** os links de navegação levam às seções correspondentes sem sair da
  página.
- **CA-04:** no layout móvel, o menu abre, fecha e fecha após selecionar um link.
- **CA-05:** a prévia do catálogo identifica claramente seus itens e números
  como ilustrativos.
- **CA-06:** as chamadas para ação levam a conteúdo informativo da página e não
  simulam um acesso autenticado ou uma operação concluída.
- **CA-07:** o conteúdo permanece legível e utilizável em telas pequenas e
  grandes, com animações reduzidas quando solicitado pelo sistema.
- **CA-08:** a aplicação gera um build de produção com a rota inicial.

## Fora de escopo

- Login, cadastro ou gestão de sessão.
- Catálogo conectado a dados reais, busca ou disponibilidade real.
- Solicitar, aprovar, retirar ou devolver equipamentos.
- API, banco, migrations, notificações ou relatórios.
- Definição das regras de negócio que faltam no PRD.

## Contratos afetados

Nenhum contrato de API ou banco. A entrega contém apenas a interface pública da
rota `/` e links internos entre seções.
