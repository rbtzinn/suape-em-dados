# Arquitetura

## Decisão principal

O sistema é um monólito modular em Next.js. A interface, as rotas de API e os serviços do domínio são publicados juntos, enquanto o Google Sheets funciona como persistência inicial gratuita dentro das cotas padrão.

O Master Plan propunha um banco relacional. A solicitação mais recente definiu Google Sheets como base. Para evitar acoplamento permanente, todas as operações passam por `GoogleSheetsRepository`; uma futura migração troca o adaptador sem reescrever as páginas ou as regras.

## Limites

- `src/app`: rotas, layouts e endpoints.
- `src/components`: apresentação reutilizável.
- `src/domain`: regras puras, normalização e tipos.
- `src/data`: montagem do snapshot usado pela interface.
- `src/infra/google-sheets`: schema, repositório e ponte server-only do Apps Script.
- `src/ingestion`: detecção, camada bruta, normalização, qualidade e conciliação pós-carga.
- `src/auth`: Firebase Auth, autorização por e-mail e sessão assinada do portal.

## Segurança

- Não existe chave privada de conta de serviço no projeto ou na Vercel.
- O Firebase autentica e-mail e senha pela API REST oficial; a Vercel valida a assinatura do token nas chaves públicas oficiais do Firebase.
- Somente e-mails presentes nas listas `FIREBASE_*_EMAILS` recebem uma sessão, mesmo que alguém crie outra conta no projeto Firebase.
- A autorização é revalidada em cada requisição; remover um e-mail da lista e publicar as variáveis novamente encerra o acesso, mesmo que ainda exista um cookie anterior.
- Sessão assinada, `HttpOnly`, `SameSite=Strict` e `Secure` em produção.
- Escritas administrativas verificam perfil e origem da requisição.
- A interface não lista nomes ou CPFs da folha.
- A planilha permanece privada; o Apps Script executa como o proprietário e aceita somente o segredo da Vercel e a ID fixada nas propriedades do script.
- `audit_log` permanece como trilha canônica. A aba `authorized_users` é mantida por compatibilidade, mas senhas e papéis ativos ficam fora dela.

## Histórico e proveniência

Cada linha de domínio inclui competência, arquivo, aba, linha, hash da fonte, lote e referência à camada bruta. `raw_records` preserva cada linha não vazia e `source_schemas` preserva todos os cabeçalhos detectados. As cargas são append-only. Um rollback lógico marca o lote sem apagar a evidência original.

Cada conciliação Remessa × LAI recebe `reconciliation_run_id`, competência, lotes utilizados e horário. A interface lê apenas a execução mais recente, mas o histórico permanece na planilha.

## Google Sheets e escala

O repositório lê somente as abas necessárias, agrupa chamadas e mantém cache curto de 60 segundos. Escritas usam lotes de até 400 linhas, também limitados pelo tamanho serializado, e bloqueio no script para evitar concorrência acidental. A rota administrativa pode executar por até 300 segundos. O Apps Script possui cotas diárias e limite de 6 minutos por execução; por isso a aplicação evita uma chamada por card ou linha. Consulte as [cotas oficiais do Apps Script](https://developers.google.com/apps-script/guides/services/quotas) e os [limites das Vercel Functions](https://vercel.com/docs/functions/limitations).
