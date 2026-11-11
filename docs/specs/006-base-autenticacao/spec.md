# Spec 006 — base executável e login

Status: APROVADA PARA IMPLEMENTAÇÃO pelo responsável em 06/11/2026 ("MANDA BALA"). Aceite final ainda pendente de verificação e evidências reais. Dependência anterior às specs 007/008. Numeração 006 escolhida para não colidir com 001–005 referenciadas no README e ausentes do ZIP.

## Motivo e decisões
O ZIP não contém app/, login nem layout. Reconstituir uma aplicação mínima responsiva, sem afirmar que preserva a landing original. Manter Next/Prisma/PostgreSQL e usar Supabase Auth (ADR-003). Sem cadastro público, redefinição de senha e permissões de Operações nesta entrega. Professor e conta de teste provisionados por script executado pelo responsável; configuração sem valores secretos. O projeto Auth exige desligar cadastro público no painel; ausência dessa configuração impede aceite de produção.

## Critérios de aceite
- CA006-01: build, lint, formatação e tipagem executam com dependências exatas e lock consistente. Sem variáveis de produção para build.
- CA006-02: login funcional com email/senha via Supabase Auth; erro genérico sem revelar existência da conta; senha nunca persistida em log/código.
- CA006-03: usuário sem sessão é impedido de acessar catálogo e empréstimos; servidor valida usuário, não confia em cookie forjado nem userId de formulário.
- CA006-04: logout encerra a sessão; cookies da sessão protegidos e mutações com proteção de origem/CSRF do framework.
- CA006-05: não há cadastro público no código e signup está desabilitado no Supabase por configuração humana comprovada.
- CA006-06: nenhuma credencial administrativa no navegador, git ou ZIP; exemplos vazios e instruções de configuração por ambiente.
- CA006-07: página inicial, login e navegação mínima responsivas; falhas de ambiente não expõem detalhes internos.
- CA006-08: verificador independente produz tabela por CA. Itens externos/configuração humana são PENDENTE até prova real, não aprovados por inspeção estática.

## Testes e conclusão
Build/tipos/lint locais; sessões inválidas e autenticação simulada em unitários; login/logout e isolamento com Auth real em ambiente de teste pelo responsável. Nunca testar solicitações com professor. Não concluir a spec com apenas mocks.

## Registro de execução e escolhas técnicas
- Aprovação antes de código: responsável autorizou as specs em 06/11/2026.
- SSR com cookies HttpOnly/Secure em produção/SameSite=Lax, validação Supabase getUser em servidor e proxy; Server Actions validam origem canônica APP_URL. Alternativa: confiar no ID enviado pelo cliente foi descartada.
- Sem SDK/Auth administrativo no navegador; inscrição pública também precisa ser desativada pelo responsável no painel Supabase. Ausência de tela não é prova dessa configuração.
- Next 16.4.3 e React 19.3.1 tiveram versões verificadas; lock e dependências diretas fixos. ESLint 9.39.1 foi preservado por compatibilidade e tem aviso de descontinuação; não há atualização automática de major. Overrides exatos source-map-js 1.2.2/minimatch 11.0.3 removeram achados do audit na rodada local.
- Landing nova e mínima sem imagens externas: a original não veio no ZIP. README atualizado para não afirmar /health, /painel ou specs 001–005 ausentes.
- Artefatos locais: build/lint/tipos/formatação/testes passaram. Smoke HTTP em loopback: / e /login 200; /catalogo e /emprestimos 307 para login sem configuração/sessão. Não comprova login/logout reais, navegador responsivo ou isolamento de pessoas autenticadas.
- Aceite final: PENDENTE. Relatórios e pendências em docs/evidencias; o gate não pode ser dispensado.
