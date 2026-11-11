# Spec 009 — Integração da versão prática com Pixabay e Supabase

**Status:** escopo solicitado pelo responsável. Aceite de produção pendente de evidências.

## Escopo

- Adotar a implementação e as specs 006, 007 e 008 da versão que o responsável trouxe, incluindo login fechado, catálogo e empréstimos. O ADR-003 descreve a implementação da prática e substitui, neste escopo, tRPC e a modelagem por tenant do ADR-001. A prática trabalha com um inventário compartilhado.
- Usar exclusivamente a API do Pixabay para novas fotos do inventário, conforme a instrução mais recente. Esta é uma divergência do enunciado da prática, que exige Pexels.
- Buscar candidatos localmente, com cache de 24 horas, e preparar JPEGs de 800 × 600. Guardar autoria, página da foto, licença e hash. Mostrar o crédito da fonte na tela. A revisão visual precede a publicação.
- Separar a configuração de Auth e PostgreSQL da preparação das fotos. Os segredos ficam no ambiente local ou nas configurações do serviço correspondente.
- Usar a CA oficial do Supabase nas conexões PostgreSQL com o projeto hospedado e manter a validação do certificado e do hostname.
- Provisionar o professor pelo Supabase Auth, com acesso comum, sem alterar a senha de conta preexistente e sem criar empréstimos. Validar operações de empréstimo com outra conta e banco de teste.

## Critérios de aceite

- **CA009-01** — O fluxo local consulta Pixabay, não envia a chave ao servidor de imagens e valida formato, dimensões, duplicidade e autoria.
- **CA009-02** — O catálogo credita Pixabay para fotos dessa fonte. Registros históricos ainda exibem o crédito da fonte original.
- **CA009-03** — `/health` confirma a conexão PostgreSQL sem revelar detalhes. Catálogo e empréstimos exigem sessão válida.
- **CA009-04** — A conta do professor existe no projeto Supabase correto e começa sem empréstimos. Sua senha não consta no código nem no Git.
- **CA009-05** — O código, a migração e os testes locais passam. Login, leitura do catálogo e carga idempotente no ambiente publicado são registrados apenas após verificação.
