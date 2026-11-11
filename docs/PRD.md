# PRD — prática Empresta Aí

Status: regras aprovadas pelo responsável em 06/11/2026 nesta sessão. A implementação ainda depende da aprovação das specs. O ZIP não contém o PRD anterior; este documento não afirma recuperar decisões ausentes.

## Objetivo e usuários
Disponibilizar o catálogo de equipamentos para colaboradores autenticados, permitir empréstimo imediato e mostrar os próprios empréstimos. O professor terá uma conta exclusiva, inicialmente sem empréstimos. Não há cadastro público.

## Regras aprovadas
- RN01: solicitar cria o empréstimo imediatamente, sem aprovação nem fila.
- RN02: catálogo fixo de 12 itens da lista do HTML; TI-0004, TI-0007 e TI-0010 em manutenção. Os outros nove começam disponíveis.
- RN03: só disponível pode ser solicitado; solicitação bem-sucedida deixa o item emprestado.
- RN04: máximo de cinco empréstimos em aberto por pessoa, inclusive sob concorrência.
- RN05: qualquer empréstimo em atraso bloqueia nova solicitação, com motivo visível.
- RN06: prazo de 14 dias úteis após a data da solicitação; não contar o dia inicial, sábados ou domingos. Sem feriados nesta versão.
- RN07: data civil e atraso em America/Sao_Paulo. Vencimento válido até o fim do dia previsto; atraso a partir do dia seguinte.
- RN08: catálogo e meus empréstimos exigem login. Uma pessoa não acessa empréstimos de outra.
- RN09: dois pedidos simultâneos ao mesmo equipamento produzem no máximo um empréstimo.
- RN10: fotos apenas da API Pexels, sem pessoas, marcas/logos legíveis, texto ou telas com conteúdo; 800×600 garantidos; foto não compartilhada entre itens; origem, autor e licença registrados; crédito clicável Fotos: Pexels.
- RN11: professor nunca usado para solicitar em testes. Conta separada para testes. Nenhuma senha em código, documentação gerada ou git.
- RN12: repetir preparação/carga não duplica equipamentos, contas nem objetos. Nenhum empréstimo é criado pelo seed.

## Fora de escopo
Devolução, renovação, fila, reserva futura, Operações, e-mails, cadastro/importação de equipamentos pela interface. Landing/identidade visual anterior não estavam no ZIP: reconstrução mínima deve ser identificada, não apresentada como preservação do site original.

## Fontes e conflitos
HTML anexado é briefing e contrato da prática. A lista de manutenção prevalece sobre o trecho que cita apenas dois itens, por decisão expressa do responsável. Créditos, segredo e independência prevalecem sobre pedidos conflitantes. Todas as decisões estão também nas specs e no ENTREGA.md. Commit e produção: ainda não existem evidências desta implementação.
