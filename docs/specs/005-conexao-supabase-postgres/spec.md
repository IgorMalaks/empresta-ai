# Spec 005 — Conexão PostgreSQL com Supabase

**Status:** implementação preparada; verificação com o banco aguarda as URLs e a senha local.
**Projeto Supabase:** projeto já selecionado pelo responsável.

## Objetivo

Preparar a aplicação Next.js para consultar o PostgreSQL do projeto Supabase
selecionado e oferecer uma verificação mínima da conexão, sem criar tabelas ou
regras de negócio.

## Vínculo e decisões

- Projeto: Empresta Aí.
- Stack: [ADR-001](../../adr/001-stack.md), com a região do projeto atual
  registrada em [ADR-002](../../adr/002-regiao-supabase.md).
- O responsável pediu conexão ao projeto que já estava aberto no Supabase. O
  painel informa a região `us-east-2` (Ohio), diferente de `sa-east-1` em
  ADR-001; esta integração segue o projeto selecionado.
- A organização e os requisitos de negócio continuam em rascunho no PRD.

## Regras e comportamento

- Prisma ORM 7 é a única camada de acesso ao PostgreSQL nesta integração.
- Consultas de runtime usam a URL do pooler de transação do Supabase em
  `DATABASE_URL`, porta `6543`, com no máximo uma conexão do driver por instância.
- Comandos de migration usam a URL de sessão do Supabase em `DIRECT_URL`, porta
  `5432`, lida pelo `prisma.config.ts`. Os hosts e usuários devem ser copiados do
  painel Supabase; não devem ser montados a partir da região.
- Um cliente Prisma singleton executa `SELECT 1` em `GET /health`.
- A resposta de saúde informa apenas se a aplicação e o banco estão disponíveis;
  não revela URL, usuário, senha ou detalhes da exceção.
- `.env.example` documenta as variáveis com valores fictícios. Credenciais reais
  ficam em `.env.local` e nas variáveis de ambiente do host de produção, nunca no
  repositório.
- Nenhuma tabela, migration ou seed de domínio é criada enquanto o PRD não aprovar
  o modelo de dados.
- Esta entrega conecta apenas o PostgreSQL. Supabase Auth e ativação do formulário
  de login continuam fora do escopo.

## Critérios de aceitação

- **CA-01:** Prisma 7 valida o schema vazio e gera o cliente sem depender da
  disponibilidade de credenciais durante a instalação.
- **CA-02:** o cliente PostgreSQL é criado somente no servidor e reutilizado em
  desenvolvimento.
- **CA-03:** `GET /health` retorna HTTP 200 após executar `SELECT 1` no banco.
- **CA-04:** sem URL ou com o banco indisponível, `GET /health` retorna HTTP 503
  sem expor detalhes internos.
- **CA-05:** `.env.example` documenta `DATABASE_URL` e `DIRECT_URL` sem segredos;
  `.env.local` permanece ignorado pelo Git.
- **CA-06:** não são criadas tabelas de negócio, sessão, autenticação ou acesso ao
  Supabase pelo cliente do navegador.
- **CA-07:** lint, formatação, validação do schema e build passam. O teste real do
  banco só pode ser confirmado quando a senha do PostgreSQL estiver configurada.

## Fora de escopo

- Alterar ou recriar o projeto Supabase e mudar sua região.
- Redefinir ou gerar uma nova senha/credencial de banco.
- Enviar credenciais para a Vercel sem autorização específica do responsável.
- Autenticação, convites, sessão, RLS, tabelas de domínio, migrations e seed.
- Ativar ou alterar o botão de login.

## Contratos afetados

Adiciona `GET /health`, sem payload de entrada. A resposta contém somente o
estado geral e o estado do banco. Nenhum contrato de domínio ou schema é criado.
