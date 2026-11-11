# ADR-002 — Região do projeto Supabase existente

**Status:** aceita para a integração inicial, conforme pedido explícito do responsável.
**Data:** 2026-11-05

## Contexto

O ADR-001 previa `sa-east-1` (São Paulo). Ao pedir a conexão com o projeto já
aberto no Supabase, o responsável selecionou o projeto existente. O painel desse
projeto mostra `us-east-2` (Ohio). A região é definida na criação do projeto; a
Supabase orienta criar outro projeto e migrar os dados para mudar de região.

## Decisão

Conectar a integração inicial ao projeto Supabase que o responsável já criou,
na região `us-east-2` (Ohio), sem criar outro projeto nem migrar dados nesta
etapa. Esta decisão substitui a região indicada em ADR-001 para a instância
existente.

## Consequências

- A região e a instância selecionadas pelo responsável são preservadas.
- A latência será maior para usuários no Brasil do que seria com um banco em
  São Paulo.
- Para mudar de região será necessário criar outro projeto e planejar uma
  migração; não se deve tentar editar a região do projeto atual.
- As variáveis de conexão devem usar os hosts exatos fornecidos pelo painel do
  Supabase.

## Referências

- [Regiões disponíveis no Supabase](https://supabase.com/docs/guides/platform/regions).
- [Como mudar a região de um projeto Supabase](https://supabase.com/kb/troubleshooting/change-project-region-eWJo5Z).
