# Pixabay

- [API](https://pixabay.com/api/docs/) e [resumo da licença](https://pixabay.com/service/license-summary/).
- A chave é enviada à API de busca. Os resultados são mantidos em cache por 24 horas.
- Registre autor, página da foto, licença, ID e hash do JPEG. A aplicação serve os arquivos aprovados a partir do Supabase Storage.
- A coluna histórica `pexels_id` armazena o ID numérico da foto. A URL de origem indica o provedor. A migração do ZIP mantém seu checksum.
