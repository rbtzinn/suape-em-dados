# Publicação na Vercel

## Fluxo

1. Conecte o repositório GitHub à Vercel.
2. Use o framework detectado `Next.js` e o comando padrão `npm run build`.
3. Configure, em Production e Preview, as variáveis da `.env.example`.
4. Compartilhe o Google Sheets somente com o e-mail da conta de serviço.
5. Mantenha `DEMO_MODE=false` e use uma `SESSION_SECRET` aleatória.
6. Publique primeiro como homologação e valide login, leitura, importação e privacidade.

## Variáveis obrigatórias

- `GOOGLE_SHEETS_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `SESSION_SECRET`
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD_HASH`
- `DEMO_MODE=false`

## Plano

A [documentação do plano Hobby](https://vercel.com/docs/plans/hobby) restringe esse plano a uso pessoal e não comercial. Antes de tratar a URL como portal institucional oficial, confirme o enquadramento com a organização; o caminho seguro para produção institucional é um plano/ambiente autorizado. A conexão com Git e o ciclo de deployments estão descritos na [documentação oficial de deployments](https://vercel.com/docs/deployments).
