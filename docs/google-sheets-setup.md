# Configuração do Google Sheets

## Base oficial

A base inicial já foi criada como Google Sheets nativo:

- Título: `SUAPE em Dados — Banco Geral`
- ID: `1qZvVOKVQ4yYB0q50HaCFW0f6l08Sy_7uaTXLLstoiYg`
- Fuso: `America/Recife`
- Visibilidade: privada, somente o proprietário

Não torne essa planilha pública. Ela contém camada bruta e metadados de proveniência; o portal é que deve expor apenas os recortes permitidos.

## Ponte privada do Apps Script

O projeto não usa conta de serviço, chave JSON nem `GOOGLE_PRIVATE_KEY`. O Apps Script executa como o proprietário da base e entrega ao servidor somente as operações previstas no arquivo `apps-script/Code.gs`.

1. Abra a base oficial e acesse **Extensões > Apps Script**.
2. Substitua o conteúdo de `Code.gs` pelo arquivo `apps-script/Code.gs` deste repositório.
3. Em **Configurações do projeto > Propriedades do script**, crie:
   - `SPREADSHEET_ID`: `1qZvVOKVQ4yYB0q50HaCFW0f6l08Sy_7uaTXLLstoiYg`;
   - `API_SECRET`: um valor aleatório longo, gerado exclusivamente para essa ponte.
4. Acesse **Implantar > Nova implantação > Aplicativo da Web**.
5. Selecione **Executar como: eu** e o acesso necessário para que a Vercel consiga chamar a URL. O segredo do passo anterior continua obrigatório em todas as operações.
6. Autorize o script, implante e copie a URL terminada em `/exec`.
7. Defina essa URL em `GOOGLE_APPS_SCRIPT_URL` e o mesmo segredo em `GOOGLE_APPS_SCRIPT_SECRET` na Vercel.

Se o código de `Code.gs` mudar, crie uma nova versão da implantação. Nunca coloque `API_SECRET` na planilha, no GitHub ou em variável `NEXT_PUBLIC_*`.

## Variáveis

Copie `.env.example` para `.env.local` e preencha:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=cole-a-api-key-publica-do-app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=suape-compliance-controle
FIREBASE_ADMIN_EMAILS=roberto.gabriel2004@hotmail.com
FIREBASE_ANALYST_EMAILS=
FIREBASE_VIEWER_EMAILS=
SESSION_SECRET=uma-chave-longa-e-aleatoria
GOOGLE_SHEETS_ID=1qZvVOKVQ4yYB0q50HaCFW0f6l08Sy_7uaTXLLstoiYg
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/ID_DA_IMPLANTACAO/exec
GOOGLE_APPS_SCRIPT_SECRET=outro-segredo-longo-e-aleatorio
DEMO_MODE=false
```

Nunca inclua `.env.local`, os segredos ou os arquivos institucionais no Git.

## Firebase Authentication

1. No console do projeto `suape-compliance-controle`, abra **Authentication > Sign-in method**.
2. Habilite **E-mail/senha**; não habilite login anônimo.
3. Em **Users**, crie manualmente cada conta que poderá entrar.
4. Coloque o mesmo e-mail em exatamente uma lista da Vercel: `FIREBASE_ADMIN_EMAILS`, `FIREBASE_ANALYST_EMAILS` ou `FIREBASE_VIEWER_EMAILS`.
5. Em **Settings > Authorized domains**, inclua o domínio da implantação Vercel e, futuramente, o domínio oficial.

Criar a conta no Firebase não basta para entrar: a API do portal nega qualquer e-mail ausente das listas. Isso evita que uma conta criada fora do fluxo administrativo ganhe acesso aos dados.

## Estrutura da base

A planilha tem uma aba de orientação e 22 tabelas canônicas:

- Controle: `authorized_users`, `audit_log`, `source_files`, `source_schemas`, `import_batches`.
- Camada bruta: `raw_records`, `raw_record_chunks`.
- Qualidade: `data_quality_issues`, `contract_reviews`, `dashboard_metrics`.
- Domínio: `remessa_instruments`, `lai_contracts`, `outsourced`, `payroll_events`, `travel`.
- Política: `travel_policy_versions`, `travel_policy_rules`, `travel_rule_results`.
- CPL: `cpl_ordinances`, `cpl_members`, `cpl_contract_links`, `cpl_fiscal_matches`.

O botão **Preparar abas canônicas** é idempotente: cria apenas abas ausentes e realinha os cabeçalhos sem limpar dados.

## Importação LAI/Remessa e portarias

Em `/admin/importacoes`, um usuário `ADMIN` ou `ANALYST` anexa um `.xlsx` de LAI/Remessa ou um `.pdf` de portaria. A competência da portaria é inferida da vigência. O fluxo:

1. calcula SHA-256 e bloqueia o mesmo arquivo em duplicidade;
2. detecta automaticamente LAI ou Remessa;
3. preserva cada linha não vazia e todos os cabeçalhos na camada bruta;
4. normaliza tipos sem corrigir silenciosamente o original;
5. registra pendências de qualidade;
6. publica o lote somente ao final;
7. recalcula a conciliação Remessa × LAI, com execução e razões auditáveis.

Para portarias, cada página é preservada integralmente, a composição efetiva é extraída e uma nova execução CPL × Remessa é acrescentada a `cpl_fiscal_matches`.

## Primeiro administrador

Crie `roberto.gabriel2004@hotmail.com` em **Firebase Authentication > Users** e mantenha esse e-mail em `FIREBASE_ADMIN_EMAILS`. A senha fica somente no Firebase; o projeto não recebe hash nem senha administrativa.

A aba `authorized_users` continua no schema para preservar compatibilidade e histórico, mas não autentica usuários e o campo legado `password_hash` é ignorado.

## Custo e cotas

O portal usa serviços com franquias e cotas, não uma promessa de gratuidade ilimitada. O repositório aplica cache, leitura agrupada e escrita em lote para reduzir execuções. Acompanhe as [cotas oficiais do Apps Script](https://developers.google.com/apps-script/guides/services/quotas), os [limites do Firebase Authentication](https://firebase.google.com/docs/auth/limits) e o uso exibido nos respectivos consoles.
