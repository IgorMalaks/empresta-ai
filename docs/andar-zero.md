# Andar zero — proposta de verificação da stack

**Status:** rascunho baseado no material da Aula 8; não implementado nem validado.
Os critérios abaixo são uma proposta para revisão quando a stack for informada.

Isto não é uma especificação de funcionalidade do produto. O objetivo é verificar
se as tecnologias do [ADR-001](adr/001-stack.md) funcionam juntas, antes de
implementar regras de negócio. A stack ainda não está completa.

## Critérios propostos

- [ ] **AZ-01:** um comando documentado sobe a aplicação e o PostgreSQL em um ambiente limpo, com os pré-requisitos declarados.
- [ ] **AZ-02:** a aplicação conecta ao banco; quando ele está indisponível, informa uma falha clara sem expor credenciais.
- [ ] **AZ-03:** existe uma migration versionada e aplicada, suficiente para verificar a integração.
- [ ] **AZ-04:** `GET /health` responde com HTTP 200 quando o banco está acessível e informa o estado da conexão.
- [ ] **AZ-05:** uma página servida pelo frontend carrega e mostra o resultado do endpoint de saúde.
- [ ] **AZ-06:** um comando documentado executa os testes, incluindo pelo menos um teste do endpoint de saúde com PostgreSQL.
- [ ] **AZ-07:** a configuração é recebida por variáveis de ambiente, descritas em `.env.example` sem segredos.
- [ ] **AZ-08:** `.env` está excluído do controle de versão e não há credenciais reais nos arquivos versionados ou no histórico.

Nenhum critério está marcado como concluído. Ter `.gitignore` e `.env.example`
preparados não comprova a execução da aplicação nem a verificação de um histórico Git.

## Fora de escopo

Funcionalidades de produto, autenticação, telas de negócio e tabelas de domínio.
Não criar um modelo de dados com base no exemplo da aula.

## Não decidido ainda

Organização do código, ferramentas de execução e testes, migration mínima,
variáveis de ambiente, versão do PostgreSQL, porta da aplicação e formato completo
da resposta de saúde, inclusive quando o banco estiver indisponível.

O plano de implementação será escrito depois que as escolhas técnicas forem informadas.
