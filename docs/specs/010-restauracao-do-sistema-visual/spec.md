# Spec 010 — Sistema visual da referência EmpresTI

Status: APROVADA PARA IMPLEMENTAÇÃO pelo pedido de seguir a referência EmpresTI. Aceite final pendente de verificação.

## Escopo

Aplicar o design system do [EmpresTI na tag entrega-pratica](https://github.com/MatheusBastosCastilho/EmpresTI/tree/entrega-pratica), commit `d9fb245df899b914474d083fb65181d3b5bd0b85`. Manter a página inicial do Empresta Aí com a mesma paleta, a rota separada de empréstimos e as regras de autenticação e empréstimo das specs 006–009.

## Critérios de aceite

- CA010-01: a página inicial usa os tokens e a tipografia da referência e encaminha para o login.
- CA010-02: o login reproduz o painel azul em duas colunas, os controles e o botão contornado da referência. O formulário mantém o envio e os estados de erro e permite mostrar e ocultar a senha.
- CA010-03: o catálogo segue a composição da referência, com cabeçalho, empréstimos em aberto e grade de equipamentos. A página de empréstimos continua acessível, com as mesmas superfícies e controles.
- CA010-04: a interface mantém foco visível, movimento reduzido e adaptação a telas estreitas. Lint, tipos e build passam.
- CA010-05: o login em produção leva ao catálogo protegido, com conexão ativa ao Supabase.
