# Empresta Aí

Projeto web para tornar mais clara a descoberta, solicitação e movimentação de
equipamentos compartilhados. A página inicial usa a identidade visual do template
local. Os fluxos de negócio ainda precisam ser especificados no PRD.

## Documentos

- [Requisitos do produto](docs/PRD.md): rascunho a preencher com o escopo real.
- [Spec da página inicial](docs/specs/001-pagina-inicial/spec.md): escopo e critérios da primeira entrega.
- [Spec da tela de login](docs/specs/002-pagina-login/spec.md): escopo visual, sem autenticação funcional.
- [Decisões de tecnologia](docs/adr/001-stack.md): PostgreSQL confirmado; demais itens pendentes.
- [Orientações do repositório](AGENTS.md): contexto e processo de trabalho.
- [Limites de atuação](rules/restrictions.md): decisões e mudanças que não devem ser feitas por conta própria.
- [Andar zero](docs/andar-zero.md): proposta de critérios para verificar o primeiro esqueleto executável.

## Executar localmente

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

## Publicar na Vercel

O projeto pode ser importado na Vercel conectando o repositório GitHub
`IgorMalaks/empresta-ai`. A Vercel reconhece Next.js e usa os comandos padrão
de build. A página inicial não precisa de variáveis de ambiente. Depois de
conectar o repositório, novos envios para `main` podem gerar uma publicação
automática.

Comandos verificados neste repositório:

- `npm run dev`: inicia o ambiente de desenvolvimento.
- `npm run lint`: verifica o código com ESLint.
- `npm run format:check`: confere a formatação.
- `npm run build`: gera o build de produção.

## Estado atual

- Página inicial responsiva em Next.js, TypeScript e Tailwind CSS.
- Navegação local entre as seções da própria página.
- Sem autenticação, API, banco provisionado, migrations ou regras de negócio.
- `.env.example` apenas com orientações, sem configuração de conexão.

Os HTMLs das Aulas 8 e 9 e suas pastas de recursos são material local de
referência e não fazem parte da aplicação. Os exemplos de produto e tecnologias
das aulas não são requisitos confirmados deste projeto.

## Próximos passos

1. Preencher o objetivo, os usuários e o escopo em `docs/PRD.md`.
2. Especificar o primeiro fluxo de produto.
3. Revisar os critérios do andar zero e planejar a integração com PostgreSQL.
4. Implementar o endpoint de saúde, a migration mínima e seu teste.

Não coloque credenciais reais na documentação ou no controle de versão.
