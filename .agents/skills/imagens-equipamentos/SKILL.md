---
name: imagens-equipamentos
description: Prepara e verifica localmente fotos do Pixabay para os equipamentos do Empresta Aí.
---

# Imagens de equipamentos

1. Leia a spec 009 e a [referência Pixabay](references/pixabay.md). Use apenas a chave local `PIXABAY_API_KEY`.
2. Execute `npm run images:prepare` e `npm run images:list`. Os arquivos candidatos ficam em `artifacts/images/`.
3. Revise cada candidato no tamanho final. Rejeite pessoas, marcas ou logos legíveis, texto e telas com conteúdo. Confira se a foto representa o tipo de equipamento.
4. Registre a escolha com `npm run images:review -- --patrimonio TI-0001 --id ID --decision aprovada --reviewer NOME --reason MOTIVO --checks-clean --confirm-human`. Para rejeitar, use `rejeitada` e omita `--checks-clean`.
5. Rode `npm run images:validate` e `npm run images:report`. Entregue os JPEGs aprovados e o manifesto para a carga autorizada. Esta skill prepara arquivos locais.
