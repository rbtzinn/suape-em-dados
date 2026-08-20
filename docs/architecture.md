# Arquitetura

## Decisão principal

O sistema é um monólito modular em Next.js. A interface, as rotas de API e os serviços do domínio são publicados juntos, enquanto o Google Sheets funciona como persistência inicial gratuita dentro das cotas padrão.

O Master Plan propunha um banco relacional. A solicitação mais recente definiu Google Sheets como base. Para evitar acoplamento permanente, todas as operações passam por `GoogleSheetsRepository`; uma futura migração troca o adaptador sem reescrever as páginas ou as regras.

## Limites

- `src/app`: rotas, layouts e endpoints.
- `src/components`: apresentação reutilizável.
- `src/domain`: regras puras, normalização e tipos.
- `src/data`: montagem do snapshot usado pela interface.
- `src/infra/google-sheets`: autenticação, schema e acesso à API.
- `src/ingestion`: detecção, camada bruta, normalização, qualidade e conciliação pós-carga.
- `src/auth`: sessão, senha e usuários autorizados.

## Segurança

- A chave privada da conta de serviço existe apenas em variável do servidor.
- Não há cadastro público.
- Sessão assinada, `HttpOnly`, `SameSite=Strict` e `Secure` em produção.
- Escritas administrativas verificam perfil e origem da requisição.
- A interface não lista nomes ou CPFs da folha.
- A planilha permanece privada; somente recortes permitidos chegam às páginas públicas.
- `authorized_users` e `audit_log` são abas canônicas.

## Histórico e proveniência

Cada linha de domínio inclui competência, arquivo, aba, linha, hash da fonte, lote e referência à camada bruta. `raw_records` preserva cada linha não vazia e `source_schemas` preserva todos os cabeçalhos detectados. As cargas são append-only. Um rollback lógico marca o lote sem apagar a evidência original.

Cada conciliação Remessa × LAI recebe `reconciliation_run_id`, competência, lotes utilizados e horário. A interface lê apenas a execução mais recente, mas o histórico permanece na planilha.

## Google Sheets e escala

O repositório lê apenas as abas necessárias para o snapshot, agrupa chamadas e mantém cache curto de 60 segundos. A documentação oficial recomenda payload de até 2 MB e publica cotas por minuto; por isso a aplicação evita uma chamada por card ou por linha. Consulte os [limites oficiais da Sheets API](https://developers.google.com/workspace/sheets/api/limits).
