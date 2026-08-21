# Publicação na Vercel

## Fluxo

1. Conecte o repositório GitHub à Vercel.
2. Use o framework detectado `Next.js` e o comando padrão `npm run build`.
3. No Firebase Authentication, habilite **E-mail/senha** e crie manualmente os usuários permitidos.
4. Publique `apps-script/Code.gs` como aplicativo da Web executado pelo proprietário da planilha.
5. Configure, em Production e Preview, as variáveis da `.env.example`.
6. Mantenha `DEMO_MODE=false` e use segredos aleatórios e diferentes para sessão e Apps Script.
7. Depois do primeiro deploy, adicione o domínio `*.vercel.app` efetivamente usado em **Firebase > Authentication > Settings > Authorized domains**.
8. Valide login, leitura, importação, perfis e privacidade antes de divulgar a URL.

A rota de importação declara `maxDuration=300`, compatível com o limite atual de 300 segundos do Hobby com Fluid Compute. Confirme que Fluid Compute está ativo nas configurações do projeto antes de testar arquivos grandes.

## Variáveis obrigatórias

| Variável | Onde é usada | Observação |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Navegador | Configuração pública do app Firebase. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Navegador e servidor | Também define emissor e audiência aceitos no token. |
| `FIREBASE_ADMIN_EMAILS` | Servidor | E-mails ADMIN separados por vírgula. |
| `FIREBASE_ANALYST_EMAILS` | Servidor | E-mails ANALYST separados por vírgula; pode ficar vazio. |
| `FIREBASE_VIEWER_EMAILS` | Servidor | E-mails VIEWER separados por vírgula; pode ficar vazio. |
| `SESSION_SECRET` | Servidor | Segredo aleatório com pelo menos 32 bytes. |
| `GOOGLE_SHEETS_ID` | Servidor | ID da base canônica. |
| `GOOGLE_APPS_SCRIPT_URL` | Servidor | URL `/exec` da implantação do Apps Script. |
| `GOOGLE_APPS_SCRIPT_SECRET` | Servidor | Mesmo valor de `API_SECRET` nas propriedades do script. |
| `DEMO_MODE` | Servidor | Use exatamente `false` na Vercel. |

As variáveis `NEXT_PUBLIC_*` entram no JavaScript do navegador por definição e não são senhas. `SESSION_SECRET` e `GOOGLE_APPS_SCRIPT_SECRET` nunca podem receber o prefixo `NEXT_PUBLIC_`.

O formulário usa diretamente a [API REST oficial de autenticação por e-mail e senha](https://firebase.google.com/docs/reference/rest/auth#section-sign-in-email-password). Assim, não é necessário instalar o SDK completo do Firebase nem configurar variáveis de produtos que o portal não utiliza.

Um usuário só entra quando as duas condições são verdadeiras: a conta existe no Firebase Authentication e o e-mail está em uma das listas `FIREBASE_*_EMAILS`. Não existe tela de cadastro no portal.

Para gerar os dois segredos, execute o comando duas vezes e use resultados diferentes:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## Plano

A [documentação do plano Hobby](https://vercel.com/docs/plans/hobby) restringe esse plano a uso pessoal e não comercial. Antes de tratar a URL como portal institucional oficial, confirme o enquadramento com a organização; o caminho seguro para produção institucional é um plano/ambiente autorizado. A conexão com Git e o ciclo de deployments estão descritos na [documentação oficial de deployments](https://vercel.com/docs/deployments).
