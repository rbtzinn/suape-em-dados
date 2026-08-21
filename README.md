# SUAPE em Dados

Portal de inteligência, integridade e conformidade para contratos, terceirizados, folha, viagens e cruzamento CPL × fiscais/gestores do Remessa.

## Executar localmente

Requer Node.js 20.9 ou superior.

```bash
npm install
npm run dev
```

Sem variáveis de ambiente, o portal abre em modo demonstração local. Em produção, o login usa Firebase Authentication e o servidor acessa a base canônica privada por uma ponte autenticada do Google Apps Script, publicando apenas os recortes permitidos.

## Verificar

```bash
npm run lint
npm test
npm run build
```

## Configurar a base

Consulte [docs/google-sheets-setup.md](docs/google-sheets-setup.md). A arquitetura e as decisões de segurança estão em [docs/architecture.md](docs/architecture.md), e a publicação está em [docs/deployment-vercel.md](docs/deployment-vercel.md).

Os arquivos institucionais de origem não devem ser incluídos neste repositório.

O importador administrativo aceita planilhas LAI/Remessa em `.xlsx` e portarias de comissões em `.pdf`. As cargas preservam a fonte bruta, acrescentam histórico e geram cruzamentos explicáveis sem transformar coincidência nominal em irregularidade.

Base canônica: [SUAPE em Dados — Banco Geral](https://docs.google.com/spreadsheets/d/1qZvVOKVQ4yYB0q50HaCFW0f6l08Sy_7uaTXLLstoiYg/edit). O arquivo é privado; o link não concede acesso.
