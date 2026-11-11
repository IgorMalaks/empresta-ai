# Verificador independente — contrato portável v1

As specs 006–009 descrevem a implementação. O aceite exige evidência. Nenhuma spec é concluída sem auditoria independente, todos os CAs aprovados e `finalize` bem-sucedido. A tabela não substitui a revisão. O gate determinístico comprova formato, cobertura, integridade e consistência; não entende a correção semântica de uma implementação nem autentica alegações de um relatório forjado pelo autor.

## Harness e contexto limpo

Nenhum harness foi escolhido pelo responsável. Não criar configurações Claude Code, allowlists executáveis ou supostos subagentes. Nitro é o ambiente disponível para revisões independentes nesta sessão. O principal deve abrir contexto novo para auditor, sem histórico de implementação, conclusões prévias nem respostas esperadas. Entregar apenas este contrato, PROMPT.md, snapshot sanitizado, PRD, ADR, rules, spec alvo e evidências já executadas. Auditor e implementador têm identificadores de sessão distintos; principal pode serializar o parecer real, não inventá-lo. Testes do gate são testes de infraestrutura e nunca uma revisão independente do produto.

### Capacidades permitidas do auditor

Somente leitura: listagem/glob, busca textual e leitura de arquivos dentro do snapshot e evidências sanitizadas. Operações correspondentes no Nitro: ler arquivo, buscar conteúdo e listar caminhos; permitir apenas caminhos do pacote. Sem terminal/shell, ferramentas de escrita/edição, execução de testes, gerenciador de pacote, banco, Storage, navegador, rede, credenciais, git, publicação, memória persistente ou tarefas que alteram arquivos. O auditor não corrige código nem testes; retorna achados, status e tabela por CA. Testes/evidências integradas são executados previamente por responsável autorizado em ambiente apropriado.

Essas restrições são contratuais, NÃO sandbox de SO. Nitro local tem capacidades amplas; nenhum confinamento técnico ou impossibilidade de atingir produção foi comprovado. Para Nitro, `productionIsolation.status` obrigatoriamente PENDENTE, motivo explícito e spec não finalizável. Não fornecer secrets, `.env`, variáveis produtivas ou conexão de produção ao contexto. Uma sandbox real futura deve impedir escrita e rede em camada externa ao prompt e fornecer prova técnica independente (kind isolation/PASS); não basta declarar que seguiu instruções. O gate somente lê e nunca executa comandos recebidos no relatório.

## Rodada e snapshot

O principal (não auditor) executa `node scripts/verification/snapshot.mjs 006 <round-id>`. ID é único; sobrescrita de rodada é recusada. Copia apenas texto selecionado; inclui código, migrations SQL, specs, ADR, PRD, rules, contratos, testes, lock/manifestos/configuração. Exclui `.git`, `.env*` inclusive exemplo, dependências, gerados, builds, assets/public/imagens reais, credenciais e segredos conhecidos. Scanner recusa potenciais secrets em vez de mascarar e afirmar equivalência. Scanner heurístico não é DLP completo: responsável inspeciona material antes de entregar. Relatórios devem ser sanitizados também. Não baixar, publicar ou executar nada.

Saída privada local em `artifacts/verification/<round-id>/snapshot`, manifesto SHA256 e `.gitignore` local ignorando o diretório inteiro. Principal deve adicionar `artifacts/verification/` ao ignore raiz antes da entrega, se necessário: fora do escopo deste agente. Hashes abrangem todo texto relevante permitido; assets reais deliberadamente ausentes não têm integridade provada por esse snapshot. Fotografias ficam pendentes até evidência externa humana real e sanitizada.

## Relatório real e evidências

Schema: report.schema.json; validação efetiva feita por core.mjs sem dependências. Nenhum relatório de aprovação é gerado automaticamente. Principal grava manualmente `report.json` com parecer real no diretório da rodada. Copiar `round`, `spec` e `sourceSnapshot` do manifesto; timestamp da rodada representa revisão final (UTC ISO milissegundos) e pode ser posterior ao manifesto. Evidências têm capturedAt anterior/igual ao timestamp da revisão.

Campos obrigatórios: schemaVersion=1, round, spec, sourceSnapshot, review, criteria, evidenceSnapshotSha256, status, humanCommits=PENDENTE. Review: reviewer/implementer distintos, harness, context=CLEAN, readOnly=true, productionIsolation={status,reason,evidenceIds}. Cobertura exata: CA006-01..08, CA007-01..09, CA008-01..10, CA009-01..05. Cada CA tem id,status,reason,evidence. Status estritos APROVADO/REPROVADO/PENDENTE. Ausência de evidência mantém PENDENTE. REPROVADO exige evidência FAIL. APROVADO exige evidência test ou human com PASS, sem FAIL; arquivo existente ou inspeção estática não bastam. Auditor verifica qualidade/proveniência/abrangência semântica, mocks não aprovam Auth, fotos, produção ou concorrência PostgreSQL real.

Cada evidência: id único, kind source/test/human/isolation, path relativo à raiz, snapshotPath, sha256 do conteúdo COMPLETO, lines=[início,fim] 1-based, testId (null fora de teste), observation específica, result=PASS/FAIL/OBSERVED, capturedAt UTC. Para fonte incluída no manifesto: snapshotPath=`<round.directory>/snapshot/<path>`. Para registro de execução sanitizado fora das fontes: snapshotPath=`<round.directory>/evidence/<path>`. Principal copia o registro para essa posição, sem adulterar resultado. Ex.: path=`artifacts/verification/round-a/results/node-tests.txt`, snapshotPath=`artifacts/verification/round-a/evidence/artifacts/verification/round-a/results/node-tests.txt`. Não colocar credenciais/dados pessoais no log. A linha selecionada deve conter testId quando presente. Não existe campo command executável.

`evidenceSnapshotSha256` é `digest(criteria.flatMap(ca => ca.evidence.map(e => ({criterion: ca.id, ...e}))))` usando canonical/digest de core.mjs (keys ordenadas recursivamente; arrays preservados). Ordem de CA/evidências fica estável entre rodadas. Conteúdo de fonte/evidência e linhas são validados; paths absolutos, traversal, symlinks e referências externas são recusados. Mudança no conjunto/hash das fontes invalida relatório corrente; fazer novo snapshot/revisão, nunca alterar hash para esconder mudança.

Agregado: qualquer CA/isolamento REPROVADO => REPROVADO; senão qualquer PENDENTE => PENDENTE; só todos APROVADO permitem APROVADO. Commits humanos continuam PENDENTE, honestamente, pois não há git aqui; não fabricam aprovação produtiva nem são realizados por agentes.

## Comandos e integração do principal

- `node scripts/verification/check.mjs check <report.json>`: valida relatório corrente, inclusive PENDENTE/REPROVADO coerente; exit 0 NÃO significa aceite.
- `node scripts/verification/check.mjs check <report.json> --complete` ou `finalize <report.json>`: mesmo gate mais todos CA/isolamento APROVADO; exit 1 bloqueia conclusão.
- `node scripts/verification/check.mjs table <report.json>`: tabela markdown validada no stdout, sem escrita pelo gate.
- `node scripts/verification/check.mjs compare <anterior.json> <atual.json>`: valida snapshots históricos, mesma spec e cronologia, mostra status/hash de evidências de cada CA. Se hash da spec mudou, informa que não são critérios equivalentes. Não libera aceite nem ignora stale report no finalize.
- `node --test tests/verification*.test.mjs`: fixtures locais de infraestrutura, sem produção; não executado pelo auditor.

Principal integra npm verify/spec:check e CI com `finalize` (não apenas check), paths explícitos das três specs; falta de relatório, erro ou PENDENTE deve quebrar job. Dependências entre specs devem ser respeitadas pelo principal. Atualizar AGENTS/processo para impedir declaração pronta sem auditor e gate; não foi alterado neste escopo. Nenhum workflow/package/app/AGENTS/rules/docs/ENTREGA é editado por este agente.

## Erro plantado e rejeição/desfazer

Fixture isolada planta mudança APROVADO no CA sem evidência e confirma recusa. Isso demonstra gate, não detecção de bug pelo auditor. Principal deve plantar defeito REAL de implementação numa cópia temporal sanitizada, rodar auditor limpo, guardar rodada REPROVADO com evidência e razão, restaurar apenas a alteração plantada na cópia, executar evidências de novo e fazer segunda revisão independente. Comparar ambas; defeito não entra na aplicação principal nem produção. Até isso acontecer, detecção independente, rejeição do defeito real e correção/desfazer ficam PENDENTE. Commits humanos de erro/rejeição/desfazer serão registrados somente após ações reais pelo responsável em outro computador.

## Integridade refinada
O snapshot inclui o código de scripts/images, não os arquivos de imagens reais. Relatórios publicados em docs/evidencias ficam fora da árvore de fonte para evitar hash circular; cada arquivo usado como evidência tem hash e cópia da própria rodada validados separadamente. Alteração no pipeline invalida relatório atual. O gate rejeita relatório defasado; comparação histórica valida os snapshots arquivados, não a implementação atual. A declaração de isolamento Nitro permanece PENDENTE nesta entrega.
