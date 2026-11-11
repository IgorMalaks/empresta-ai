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
