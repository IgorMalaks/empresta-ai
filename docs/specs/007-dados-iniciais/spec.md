# Spec 007 — dados iniciais e skill

Status: APROVADA PARA IMPLEMENTAÇÃO pelo responsável em 06/11/2026 ("MANDA BALA"). Aceite final ainda pendente de verificação e evidências reais. Dependência: 006 e skill imagens-equipamentos. Corresponde à entrega de dados iniciais do HTML, não à spec antiga 002 de login.

## Decisões aprovadas e conflitos
Seguir lista exata de 12 itens e buscas do HTML: TI-0004, TI-0007 e TI-0010 em manutenção. São nove disponíveis, não dez. sharp autorizado somente com versão exata verificada; nenhuma outra origem de imagem. A senha do professor é configurada pelo responsável fora de arquivos versionados. O seed não cria empréstimos. Revisão humana obrigatória para semântica de fotos; garantia programática de dimensões, identidade única e integridade dos arquivos. Crédito Pexels obrigatório na tela que usa as fotos.

## Desenho aprovado
Preparar candidatos e arquivos localmente pela API pública Pexels; não confundir palavras de busca com garantia de ausência de marca/texto. Só manifesto aprovado para os 12 itens pode liberar carga. Revisão registra aprovação ou reprovação, razão, responsável, foto Pexels e hash da imagem final; transformação usa crop 800×600 e revalidação. Chave não aparece em URL/log. URLs e downloads restritos a api.pexels.com e images.pexels.com, sem seguir redirects externos.

Separar preparação de upload/carga. Ferramenta humana solicita secrets no ambiente local, protege segredo e exige seleção explícita do projeto. Caminhos de objetos determinísticos por patrimônio/hash e criação imutável sem duplicação (refinamento técnico do upsert); troca de foto não apaga imagens antigas automaticamente. Reexecutar seed não altera situação de item já existente, principalmente emprestado, nem recria usuário/limpa empréstimos. Divergência com dataset aprovado produz relatório/bloqueio, não uma atualização destrutiva silenciosa. Professor existente com empréstimos impede declaração de pronto, nunca os apaga.

## Critérios de aceite
- CA007-01: 12 patrimônios únicos com nomes/categorias exatos da lista e situações iniciais aprovadas; quatro notebooks, três monitores, três cabos e duas câmeras.
- CA007-02: imagens efetivamente obtidas pela API Pexels com metadata de foto, fotógrafo, URL de origem e licença Pexels.
- CA007-03: 12 fotos diferentes por ID e conteúdo/hash, todas fisicamente 800×600; arquivo inválido bloqueia processo.
- CA007-04: revisão humana registrada de cada imagem final; pessoa, marca/logo legível, texto ou tela com conteúdo implica reprovação.
- CA007-05: URLs públicas Supabase abrem sem login; bucket só permite leitura pública, escrita administrativa não exposta ao cliente.
- CA007-06: repetir preparação e carga não duplica itens/contas/objetos, não reabre equipamento emprestado e não cria empréstimos.
- CA007-07: conta do professor existe, entra pelo login e tem zero empréstimos; conta separada de teste. Senha não aparece em código, documentação ou histórico.
- CA007-08: o agente prepara apenas; upload, migrations e seed de produção são ações humanas. Não há credenciais produtivas no verificador.
- CA007-09: tabela independente por CA e evidências reais de idempotência/produção. Sem fotos, revisão ou carga real, status PENDENTE.

## Fora de escopo nesta spec
Tela de catálogo (008), cadastro de item na interface, planilha e alterações de imagens externas ao catálogo.

## Registro de execução e escolhas técnicas
- Lista exata em scripts/images/catalog.mjs; situações 0004/0007/0010 manutenção.
- Imagem final JPEG com crop central 800×600 via sharp; tamanho e hash dos bytes revalidados. API/download com allowlists separadas, redirecionamento proibido, timeout e limites de payload/pixels. Busca não garante direitos: revisão humana vinculada ao hash final obrigatória.
- SKILL.md explica fluxo/fronteiras; references/ guarda fontes e limitações de consulta; scripts garantem invariantes verificáveis. Fotos reais/reprovadas: não executado, não afirmar zero rejeições.
- Refinamento do armazenamento: em vez de upsert sobrescrevendo bytes, objetos create-only PATRIMONIO/SHA256.jpg; conteúdo existente só reutilizado se hash igual. Alternativa overwrite rejeitada por tornar link estável mutável; idempotência mantida. Nenhum objeto é apagado automaticamente.
- Seed transacional e idempotente: bloqueia patrimônios fora da lista e divergências sem apagar registros; preserva situação emprestado. Auth existente não tem senha redefinida; professor com qualquer empréstimo histórico bloqueia, sem limpeza.
- Auth/Storage não compartilham transação PostgreSQL: falha pode deixar contas/objetos órfãos. Reexecução retoma; revisão humana decide sobre resíduos, sem delete automático.
- Upload/carga exigem variáveis administrativas diretas, projeto explícito e flag humana, mas flags não são sandbox anti-agente. Credenciais e rede produtiva devem ficar fora do harness.
- Regressão adicionada para catálogo excedente, bloqueando antes das escritas externas. Testes de imagens sintéticas e upload simulado não provam Pexels real ou bucket do deploy.
- Aceite final: PENDENTE até fotos/revisão/configuração/carga e evidências humanas.
