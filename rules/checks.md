---
description: O que precisa ser verificado antes de declarar uma tarefa pronta
globs: []
alwaysApply: true
---

# Verificação de fim de tarefa

> leitor: agente

## Quando

Sempre que você for dizer "pronto", "implementado" ou "funcionando".

## Procedimento

1. Identifique quais verificações se aplicam aos arquivos alterados.
2. Se a tarefa alterou somente documentação, confira o conteúdo contra os arquivos usados como fonte e procure marcadores pendentes, caminhos quebrados e decisões não autorizadas.
3. Se a tarefa alterou código, execute os comandos de teste e build documentados no `AGENTS.md`. Se esses comandos ainda não existirem, informe que a tarefa não foi testada nem buildada; não invente comandos e não declare que está funcionando.
4. Se a tarefa tocou em migration, execute o procedimento definido em `rules/migration.md`. Enquanto esse arquivo e o ambiente local não existirem, não declare a migration concluída.
5. Se o diretório for um repositório Git, rode `git status --short` e confirme que só aparecem arquivos do escopo. Se ainda não houver Git, liste explicitamente os arquivos criados ou alterados.
6. Quando houver spec, diga qual critério de aceitação `CA-xx` a tarefa atende. Sem spec, declare que não existe critério de aceitação aplicável.

## Verificação

Uma tarefa só está pronta quando todas as verificações aplicáveis terminarem sem falha e não houver alteração inesperada fora do escopo.

## Não faça

- Não relate sucesso parcial como tarefa concluída.
- Não esconda teste, build ou verificação que não pôde ser executada.
- Não tente corrigir a mesma falha duas vezes seguidas sem mostrar a saída do erro.
- Não rode teste contra banco remoto.
