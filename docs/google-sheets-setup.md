# Configuração do Google Sheets

## Base oficial

A base inicial já foi criada como Google Sheets nativo:

- Título: `SUAPE em Dados — Banco Geral`
- ID: `1qZvVOKVQ4yYB0q50HaCFW0f6l08Sy_7uaTXLLstoiYg`
- Fuso: `America/Recife`
- Visibilidade: privada, somente o proprietário

Não torne essa planilha pública. Ela contém camada bruta e metadados de proveniência; o portal é que deve expor apenas os recortes permitidos.

## Conta de serviço

1. Crie um projeto no Google Cloud.
2. Ative a Google Sheets API.
3. Crie uma conta de serviço e uma chave JSON.
4. Compartilhe somente a base oficial com o e-mail da conta de serviço como **Editor**.
5. Grave e-mail e chave apenas nas variáveis de ambiente do servidor/Vercel.

A autorização segue a [documentação oficial de autenticação do Google Workspace](https://developers.google.com/workspace/guides/auth-overview).

## Variáveis

Copie `.env.example` para `.env.local` e preencha:

```dotenv
GOOGLE_SHEETS_ID=1qZvVOKVQ4yYB0q50HaCFW0f6l08Sy_7uaTXLLstoiYg
GOOGLE_SERVICE_ACCOUNT_EMAIL=conta@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SESSION_SECRET=uma-chave-longa-e-aleatoria
DEMO_MODE=false
```

Nunca inclua `.env.local`, a chave JSON ou os arquivos institucionais no Git.

## Estrutura da base

A planilha tem uma aba de orientação e 22 tabelas canônicas:

- Controle: `authorized_users`, `audit_log`, `source_files`, `source_schemas`, `import_batches`.
- Camada bruta: `raw_records`, `raw_record_chunks`.
- Qualidade: `data_quality_issues`, `contract_reviews`, `dashboard_metrics`.
- Domínio: `remessa_instruments`, `lai_contracts`, `outsourced`, `payroll_events`, `travel`.
- Política: `travel_policy_versions`, `travel_policy_rules`, `travel_rule_results`.
- CPL: `cpl_ordinances`, `cpl_members`, `cpl_contract_links`, `cpl_fiscal_matches`.

O botão **Preparar abas canônicas** é idempotente: cria apenas abas ausentes e realinha os cabeçalhos sem limpar dados.

## Importação LAI/Remessa

Em `/admin/importacoes`, um usuário `ADMIN` ou `ANALYST` anexa um `.xlsx` e informa a competência. O fluxo:

1. calcula SHA-256 e bloqueia o mesmo arquivo em duplicidade;
2. detecta automaticamente LAI ou Remessa;
3. preserva cada linha não vazia e todos os cabeçalhos na camada bruta;
4. normaliza tipos sem corrigir silenciosamente o original;
5. registra pendências de qualidade;
6. publica o lote somente ao final;
7. recalcula a conciliação Remessa × LAI, com execução e razões auditáveis.

## Primeiro administrador

Gere um hash sem gravar senha no código:

```bash
npm run password:hash
```

Defina `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD_HASH`. Os demais usuários podem ser mantidos em `authorized_users` com papel `ADMIN`, `ANALYST` ou `VIEWER`.

## Custo e cotas

Em 20/08/2026, o Google informa que o uso padrão da Sheets API não tem custo adicional. A documentação também diz que exceder as cotas de requisição está planejado para gerar cobrança mais tarde em 2026. O portal usa cache, leitura em lote e cargas agrupadas; acompanhe os [limites oficiais da Sheets API](https://developers.google.com/workspace/sheets/api/limits).
