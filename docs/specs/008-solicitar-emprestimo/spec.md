# Spec 008 — catálogo e solicitar empréstimo

Status: APROVADA PARA IMPLEMENTAÇÃO pelo responsável em 06/11/2026 ("MANDA BALA"). Aceite final ainda pendente de verificação e evidências reais. Dependência: 006/007. Corresponde à entrega de empréstimos do HTML, sem substituir as specs antigas 003/004 ausentes.

## Decisões aprovadas
Empréstimo imediato, sem fila/aprovação. Cinco em aberto por pessoa. Atraso bloqueia novas solicitações. Prazo de 14 dias segunda–sexta após dia inicial, sem feriados, data civil America/Sao_Paulo; válido até fim dia previsto. Catálogo privado e empréstimos somente próprios. Manutenção em TI-0004/0007/0010. Crédito Fotos: Pexels presente, apesar do briefing conflitante. Devolução, renovação, reserva futura, Operações e email fora do escopo.

## Desenho técnico para aprovação
Identidade derivada de sessão validada no servidor. Não aceitar userId, prazo ou situação do cliente. Operação transacional no banco, serializada por usuário e equipamento, com índice único parcial para empréstimo aberto por equipamento. Revalidar todas as regras após locks; negócio centralizado numa única operação, não em checagem client-side. Tabelas e função não expostas ao anon/authenticated do Supabase. Registrar apenas eventos e identificadores indispensáveis, sem segredos.

Solicitação por POST/Server Action, nunca GET; proteção CSRF/origem do framework. Catálogo mostra todos os itens (não apenas disponíveis), crédito e botão desabilitado com situação. Rejeição informa limite, atraso ou indisponibilidade sem expor dados de terceiros. Clique repetido não cria um segundo empréstimo para o mesmo item. Meus empréstimos lista apenas abertos e vencimento, com atualização após sucesso.

## Critérios de aceite
- CA008-01: usuário logado vê os 12 itens, com foto aprovada, patrimônio, nome, categoria e situação; Fotos: Pexels clicável.
- CA008-02: disponível pode ser solicitado; uma transação cria empréstimo e muda item para emprestado; qualquer falha desfaz ambas operações.
- CA008-03: manutenção e emprestado são recusados no servidor/banco, não somente por botão.
- CA008-04: limite de cinco aberto respeitado também em duas solicitações simultâneas do mesmo usuário a itens diferentes quando já tem quatro.
- CA008-05: atraso em qualquer empréstimo impede novo pedido; vencimento hoje não é atraso; dia seguinte é. Motivo visível.
- CA008-06: data de 14 dias úteis calculada no servidor/banco; cobrir início sexta/sábado/domingo, virada mês/ano e diferença UTC/SP. Feriados contam como dias úteis nesta versão.
- CA008-07: dois usuários concorrendo pelo mesmo item produzem exatamente um empréstimo e um equipamento emprestado; rejeição segura do outro.
- CA008-08: meus empréstimos mostra somente abertos do usuário atual e data prevista; userId forjado, sessão inválida e acesso direto por cliente não contornam regra.
- CA008-09: catálogo e lista são atualizados após solicitação; interfaces responsivas e erros de conexão sem detalhes sensíveis.
- CA008-10: verificação independente final por CA; concorrência exige PostgreSQL real. Unidade/mock não é evidência suficiente de produção.

## Evidências e limites
Conta de teste exclusiva. Responsável executa validação produtiva e confirma professor zerado. Repositório sem ambiente PostgreSQL/Auth disponível: registrar o que foi executado localmente e manter critérios integrados/produção pendentes.

## Registro de execução e escolhas técnicas
- Operação PostgreSQL public.request_loan retorna TABLE(code,loan_id,due_on). Sessão verificada fornece UUID; prazo/situação/userId não são aceitos do formulário.
- Lock transacional do usuário primeiro e da linha do equipamento depois. READ COMMITTED obrigatório; isolamento com snapshot obsoleto recusado. Índice único parcial cobre empréstimo aberto por equipamento, mas não substitui lock por usuário.
- Returned_at nulo significa aberto, inclusive vencido; devolução não tem interface nesta versão. Vencidos bloqueiam e contam. Datas civis SP e prazo seg–sex são calculados no banco, não no cliente.
- Tabelas com RLS sem policies e funções SECURITY INVOKER; acesso anon/authenticated revogado. Serviço backend exige role com permissões/ownership adequados, configurado pelo responsável.
- Auditoria operacional mínima com correlationId/código/loanId sem email/senha/payload. SSL produtivo com certificado validado, URLs Supabase restritas e sem override SSL.
- Timeout SQL no servidor (statement_timeout 5s, lock_timeout 3s), não query_timeout que só devolve erro ao cliente enquanto SQL pode seguir. Não garante resultado conhecido em ruptura de rede; UI orienta atualizar catálogo/lista e tentativas no mesmo item são recusadas por indisponibilidade.
- 22 casos locais de SQL/data passaram via PostgreSQL WASM PGlite. Não são prova de concorrência multiconexão. Harness opt-in separado de banco local descartável vazio prefixo empresta_test_, loopback sem túnel: execução humana pendente.
- Erro plantado em cópia isolada alterou limite de 5 para 6: teste recebeu SUCCESS em vez de LIMIT_REACHED, auditor independente reprovou CA008-04. Cópia restaurada, SQL de aplicação nunca alterado pelo experimento; testes 12/12 e hashes iguais. Dois commits pedidos pelo HTML continuam pendentes por instrução de não commitar aqui.
- Gate revisado inclui scripts/images no hash (imagens reais continuam fora); docs/evidencias não entra no hash de código para evitar circularidade de relatórios, mas cada evidência referenciada tem hash individual obrigatório.
- Aceite final: PENDENTE; não declarar produção pronta por inspeção/mocks.
