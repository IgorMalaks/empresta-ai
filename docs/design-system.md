# Sistema visual

O Empresta Aí adota a linguagem visual observada no projeto de referência
[EmpresTI](https://github.com/GabrielMartinsss26/EmpresTI) e em sua tela pública
de [login](https://empresti-mauve.vercel.app/login), preservando a marca e o
conteúdo próprios deste projeto.

## Fundamentos

- Fundo azul-marinho quase preto, com superfícies azuladas e contraste suave.
- Azul como cor de destaque para links, ícones, foco e ações.
- Open Sans como fonte da interface, com títulos sem uma família decorativa
  separada.
- Controles com raio de 8 px, bordas discretas e foco visível.
- Gradiente azul-marinho no painel de identidade da tela de login.
- Layout de login em duas colunas em telas largas e empilhado em telas menores.

## Tokens

| Token | Valor | Uso |
|---|---|---|
| `--page` | `#05070f` | Fundo mais profundo |
| `--background` | `#080c1a` | Fundo principal |
| `--foreground` | `#e6eaf6` | Texto principal |
| `--surface` | `#0e1530` | Cartões e superfícies |
| `--sunken` | `#0b1128` | Campos e áreas internas |
| `--muted` | `#8a93b2` | Texto secundário |
| `--dim` | `#7c86a2` | Texto auxiliar |
| `--faint` | `#5e6884` | Texto de baixo destaque |
| `--border` | `#2b3450` | Bordas de controles |
| `--border-soft` | `#1a2340` | Separadores suaves |
| `--border-frame` | `#222c4a` | Bordas de painéis |
| `--accent` | `#5b7fe0` | Ações, foco e links |
| `--accent-text` | `#b4c6f6` | Texto azul claro |
| `--accent-icon` | `#8aa6ee` | Ícones |
| `--accent-deep` | `#001449` | Fundo azul profundo |
| `--accent-border` | `#25408f` | Borda azul |
| `--error` | `#f0a0a5` | Erros de interface, quando aplicável |
| `--radius-control` | `8px` | Campos e botões |

Os tokens ficam em `app/globals.css` para que ambas as rotas compartilhem a
mesma paleta. A tela de login continua sendo apenas uma demonstração: nenhum
campo ou botão ativo deve sugerir autenticação disponível.

Este documento registra a adaptação visual do Empresta Aí. Ele não aprova os
fluxos, limites, textos de negócio ou regras do EmpresTI para o produto atual.
