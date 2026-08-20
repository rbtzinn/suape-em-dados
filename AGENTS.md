# SUAPE em Dados — instruções para agentes

## Antes de alterar

- Leia `docs/MASTER_PLAN.md` e o documento do módulo afetado.
- Preserve arquivos recebidos: nunca altere planilhas ou PDFs originais.
- Não inclua planilhas, PDFs, dados pessoais, tokens ou chaves no repositório.
- Trate `docs/architecture.md` e `docs/google-sheets-setup.md` como decisões vigentes.

## Regras de implementação

- Use Next.js, React e TypeScript com componentes pequenos e tipados.
- Mantenha o acesso ao Google Sheets exclusivamente no servidor.
- Dependa da interface do repositório, não de chamadas ao Sheets dentro de componentes.
- Valores monetários ficam em centavos inteiros. Não use `float` para persistência.
- Toda linha importada precisa de competência, origem, linha, hash e lote.
- Uma competência nova acrescenta histórico; nunca sobrescreva silenciosamente a anterior.
- Campo ausente não é evidência de irregularidade.
- Correspondências ambíguas exigem decisão humana e razões visíveis.
- Proteja rotas administrativas por perfil no servidor.

## Verificação mínima

Execute antes de entregar:

```bash
npm run lint
npm test
npm run build
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
