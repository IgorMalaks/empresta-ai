# ADR-003 — stack e fronteira de escrita

Status: aceito pelo responsável em 06/11/2026 junto às specs 006/007/008. Os ADRs 001/002 referenciados no README não vieram no ZIP e não foram recriados por suposição.

## Decisão
Manter Next.js, TypeScript, Prisma e PostgreSQL/Supabase; usar Supabase Auth para autenticação. Server Actions/API validam identidade no servidor; acesso ao banco de domínio é somente pelo servidor. Não expor credenciais PostgreSQL ou administrativas ao navegador. Credenciais de produção não entram no pacote nem no processo do verificador.

Centralizar solicitação numa operação PostgreSQL transacional que serializa por usuário e bloqueia o equipamento. Revalidar limite, atraso e situação depois dos bloqueios. Usar índice único parcial para empréstimo em aberto por equipamento e restrições SQL. Impedir acesso anônimo/authenticated diretamente às tabelas e funções de domínio; identidade vem da autenticação validada no servidor, nunca de campo submetido pelo cliente.

## Alternativas
- Checar só na interface: simples, mas permite bypass e corrida.
- Checar somente equipamento: impede duplicação de item, mas duas solicitações do mesmo usuário podem ultrapassar cinco.
- Aprovação/fila: conflita com fluxo aprovado.
- Reimplementar senha/sessão: aumenta superfície de segurança; Auth gerenciado é preferido.

## Consequências
Necessário testar com PostgreSQL real a corrida entre usuários e entre itens do mesmo usuário. Testes unitários não provam locks reais. Migração, seeds, bucket e uploads no deploy são executados exclusivamente pelo responsável. A aplicação, quando publicada pelo responsável, escreve empréstimos por ação de usuários autenticados; isso não autoriza o agente a realizar essas ações em produção.

## Dependências
Promover sharp a dependência direta apenas após conferir versão exata e idade mínima de sete dias. Mesma política para bibliotecas Auth. O manifesto original usa ranges; fixar versões verificadas sem trocar stack por conveniência. Se versões do ZIP não estiverem publicamente disponíveis, parar e apresentar opções, não inventar versão.

## Refinamentos verificados durante implementação
1. TLS com validação de certificado obrigatório no runtime produtivo; query params não podem alterar SSL/host. Sem rejectUnauthorized=false.
2. Timeout servidor SQL e locks; timeout cliente isolado foi rejeitado após leitura de pg: seu callback pode informar falha enquanto consulta continua. Em ruptura de rede o resultado ainda pode ser desconhecido; reconsultar estado.
3. Storage create-only por hash com conferência pré/pós-download: alternativa upsert sobrescrever objeto rejeitada. Não criar rotina automática para apagar órfãos.
4. Snapshot inclui código de scripts/images, exclui fotos reais, .env e artefatos. docs/evidencias fica fora da árvore de fonte para evitar autoreferência; evidências são obrigatoriamente hasheadas individualmente. Gate é consistência/integridade, não autenticação do autor de relatório.
5. Versões publicadas e idade conferidas em docs/evidencias/registro-publico-npm.json. Auditoria inicialmente achou 9 vulnerabilidades (1 alta, 8 moderadas); patches transitivos exatos removeram os achados. Zero no audit não significa ausência absoluta de vulnerabilidade.
