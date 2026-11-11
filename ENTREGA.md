# Entrega da prática

- Repositório: https://github.com/IgorMalaks/empresta-ai
- Endereço existente: https://empresta-ai-kappa.vercel.app/
- Aceite do deploy: pendente de conexão, credenciais e verificação real.

## Decisões e conflitos

- O responsável solicitou Pixabay. O enunciado exige Pexels. A diferença consta na spec 009. O catálogo exibe a fonte e o autor de cada foto.
- A versão trazida pelo responsável registra TI-0004, TI-0007 e TI-0010 em manutenção. A lista e o briefing divergem sobre TI-0010. Esta integração preserva a decisão registrada na spec 007.
- As specs 006–008 e o ADR-003 da versão trazida adotam Supabase Auth, Prisma e Server Actions para o monólito. A integração preserva esse recorte e mantém as especificações anteriores como histórico.
- O prazo da spec 008 conta segunda a sexta, incluindo feriados, no fuso de São Paulo. As operações de teste usam uma conta separada.
- A conta do professor é provisionada em Supabase Auth. Nenhuma senha é registrada neste repositório. A carga preserva senhas existentes e verifica zero empréstimos do professor.

## Imagens e verificação

A skill descreve o processo. O código valida tamanho, duplicidade, origem e metadados. Uma pessoa revisa logos, texto, pessoas e telas. A preparação local só acessa Pixabay e a carga exige um comando separado com credenciais administrativas.

O verificador recebe o código e a especificação em contexto separado e devolve o estado de cada critério com evidência. Relatórios de outra árvore de código permanecem históricos. Pendências em produção não contam como aprovadas. A tag de entrega fica para quando a versão publicada tiver sido conferida.

## Evidências desta integração

- **CA009-01 aprovado em revisão local.** A busca oficial baixou 36 candidatos. O verificador conferiu JPEGs de 800 × 600, IDs e hashes únicos, origem e autoria. A seleção visual das 12 fotos finais permanece pendente.
- **CA009-02 aprovado em revisão local.** O verificador renderizou os créditos de Pixabay e de Pexels, com os respectivos links.
- **CA009-03.** A migração `20261106000100_initial_domain` foi aplicada ao PostgreSQL do Supabase e o Prisma confirmou que o esquema está atualizado. As quatro variáveis de produção foram salvas na Vercel, com a `DATABASE_URL` como segredo. A conexão da aplicação foi testada localmente com validação do certificado oficial. A confirmação de `/health` na publicação ainda está pendente.
- **CA009-04.** A conta de Marcelo autenticou no Supabase Auth com a senha informada pelo responsável. A sessão de teste foi encerrada. Uma consulta ao PostgreSQL confirmou zero empréstimos para a conta. Falta confirmar o login completo pelo site.
- **CA009-05 pendente.** O commit `b3a7ff2` passou em 91 testes locais, incluindo SQL no PGlite. A Vercel concluiu o deploy de prévia. Faltam o teste de concorrência com PostgreSQL e múltiplas conexões e a verificação de login e carga no ambiente publicado.
