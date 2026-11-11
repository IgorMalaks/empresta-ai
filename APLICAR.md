# Configuração do Empresta Aí

## Supabase e Vercel

Use o mesmo projeto Supabase para Auth, PostgreSQL e Storage. Em desenvolvimento, copie `.env.example` para `.env.local` e preencha somente os valores necessários. Na Vercel, configure `APP_URL` com a origem do ambiente publicado, `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` com os dados do projeto e `DATABASE_URL` com a conexão do pooler de transação (porta 6543). Deixe `DIRECT_URL` no ambiente onde rodará o Prisma, com a conexão direta ou o pooler de sessão (porta 5432).

Confira o histórico antes de aplicar a migração ao banco selecionado:

```sh
npx prisma migrate status
npx prisma migrate deploy
```

No Supabase, mantenha cadastro público desabilitado. Em **Authentication → Users**, crie a conta de Marcelo Grilo com a função comum de usuário. Use uma senha temporária aleatória e compartilhe-a em canal privado. Faça as operações de empréstimo com uma conta de teste separada. Credenciais administrativas ficam fora da Vercel e do Git.

## Fotos e dados iniciais

A spec 009 adota Pixabay. Coloque `PIXABAY_API_KEY` em `.env.local` e rode `npm run images:prepare`. Revise os arquivos listados por `npm run images:list`, registre as escolhas seguindo os parâmetros da skill. Rode `npm run images:validate` para confirmar 12 JPEGs revisados. Os arquivos de trabalho ficam em `artifacts/images/`.

Para a carga, crie o bucket público `equipment-images` no Supabase. O comando `npm run human:seed -- --project-ref <ref> --confirm-human` valida as imagens, usa as variáveis do processo descritas em `scripts/human/load-initial-data.mjs`, reaproveita contas existentes e verifica que o professor tem zero empréstimos. Para esse comando, `DATABASE_URL` deve conter a conexão direta ou do pooler de sessão sem parâmetros. Nenhum comando de carga roda no build.

## Verificação

Rode `npm run verify` localmente. Em um ambiente configurado, confirme `/health` com HTTP 200, login com a conta de teste, 12 imagens no catálogo, bloqueio de equipamentos em manutenção e atualização de Meus empréstimos. A suíte de concorrência com múltiplas conexões exige um PostgreSQL local descartável. Confira `tests/db-concurrency.test.mjs`.
