# Empresta Aí

Aplicação Next.js para consultar e solicitar equipamentos compartilhados. Usa PostgreSQL e Supabase Auth. O cadastro é fechado.

## Desenvolvimento

Requer Node.js 22.12 ou superior.

```sh
npm ci
npm run db:generate
npm run dev
```

A página inicial e o login abrem sem acesso ao banco. O catálogo e os empréstimos exigem uma conta Supabase e as tabelas da aplicação. A rota `/health` verifica a conexão PostgreSQL.

- [Configuração e publicação](APLICAR.md)
- [Estado da prática e decisões](ENTREGA.md)
- [Spec de integração](docs/specs/009-integracao-pixabay-e-supabase/spec.md)
- [Skill de imagens](.agents/skills/imagens-equipamentos/SKILL.md)
- [Contrato do verificador](.agents/verificador/CONTRACT.md)
