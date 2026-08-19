# SUAPE em Dados — MASTER PLAN

## 1. Visão
O SUAPE em Dados será uma plataforma interna de inteligência, consolidação, rastreabilidade e apoio ao Compliance da SUAPE. Não será apenas um dashboard: deverá centralizar fontes, preservar evidências, permitir cruzamentos, identificar divergências e manter histórico.

## 2. Objetivos
- Centralizar dados do Remessa TCE e LAI.
- Preservar todos os campos das fontes.
- Manter histórico mensal por competência.
- Cruzar Remessa x LAI.
- Cruzar fiscais/gestores x comissões.
- Consolidar terceirizados.
- Consolidar folha.
- Consolidar viagens e diárias.
- Avaliar viagens contra a Política de Viagens da SUAPE.
- Manter auditoria e rastreabilidade de cada dado.
- Ser modular e escalável.

## 3. Princípios obrigatórios
1. Nenhum dado perde sua origem.
2. Manter raw_value e normalized_value.
3. Ausência de evidência não é irregularidade.
4. Match ambíguo nunca é aceito silenciosamente.
5. Histórico mensal nunca é sobrescrito.
6. Planilha é fonte de entrada, não banco operacional.
7. Código em monólito modular, sem microserviços desnecessários.
8. Dados e PDFs internos não entram no Git.
9. Autorização deve ser validada no servidor.

## 4. Skills
Antes de qualquer código, usar o repositório:
`https://github.com/rbtzinn/skillsrbt`

Se necessário:
```bash
git clone https://github.com/rbtzinn/skillsrbt.git
```

O agente deve ler os SKILL.md relevantes de frontend, backend, arquitetura, React/Next, TypeScript, segurança, banco, APIs, testes, acessibilidade, design e performance.

Criar:
- `docs/skills-applied.md`
- `AGENTS.md`

## 5. Arquitetura
Arquitetura: monólito modular em Next.js + TypeScript + banco relacional.

Estrutura conceitual:
```text
src/
  app/
  modules/
    auth/
    dashboard/
    contracts/
    commissions/
    reconciliation/
    payroll/
    outsourced/
    travel/
    compliance/
    imports/
    audit/
  ingestion/
    parsers/
    normalizers/
    validators/
  domain/
    entities/
    rules/
    services/
    value-objects/
  infrastructure/
    database/
    auth/
    storage/
  shared/
    components/
    hooks/
    utils/
    types/
tests/
docs/
```

## 6. Segurança
Sem cadastro público.

Papéis:
- ADMIN
- ANALYST
- VIEWER

Tabela conceitual:
```text
authorized_users
id
email
name
role
active
created_at
created_by
```

Proteger páginas, APIs, server actions, endpoints, dados e arquivos no servidor.

## 7. Auditoria
Registrar:
- login;
- importação;
- publicação de dataset;
- rollback;
- usuários autorizados;
- alteração de papel;
- revisão manual de match;
- override;
- mudança de regra;
- justificativa.

Override:
```text
valor_original
valor_novo
motivo
usuario
data
```

## 8. Dashboard
Rota `/`.

Indicadores somente com dados reais:
- contratos em execução;
- valor global;
- contratos com revisão;
- divergências Remessa x LAI;
- cruzamentos fiscais x comissões;
- terceirizados;
- custo mensal;
- viagens;
- passagens;
- diárias;
- alertas de política.

## 9. Contratos
Rota `/contratos`.

Fonte principal:
- Remessa TCE;
- consolidação;
- PDFs;
- documentos complementares.

Preservar todos os campos do Remessa, inclusive:
ID do IJ, Instrumento Jurídico, PC/Modalidade, Unidade, Objeto, Natureza, Valor Global, Estágio, Parte do IJ, Vigência, Natureza/Situação da Obra, Última Atualização, Situação da análise, PDF principal, arquivo, páginas, gestor, página/evidência do gestor, fiscal, página/evidência do fiscal, Fiscal/Responsável no Remessa, correspondência, documentos, complementos, pendência, URL, SHA-256, coleta, tamanho e método de verificação.

## 10. Base definitiva do Remessa
Antes do dashboard definitivo, executar saneamento.

Fontes:
1. exportação oficial;
2. consolidada estilizada;
3. revisada;
4. PDFs;
5. documentos complementares.

Chave: `ID do IJ`.

Gerar diff:
```text
id
campo
valor_consolidada
valor_revisada
igual
conflito
fonte
evidencia
decisao_merge
```

Regras:
- consolidada preenchida + revisada vazia: preservar;
- consolidada vazia + revisada preenchida: candidato;
- iguais: preservar;
- diferentes: revisar;
- nunca apagar automaticamente;
- nunca substituir evidência forte por fraca.

Hierarquia:
```text
PDF principal com papel + nome explícitos
>
documento oficial complementar
>
confirmação visual inequívoca
>
portal Remessa
>
candidato
>
inferência
>
vazio
```

O campo `Fiscal/Responsável no Remessa` é genérico e não vira automaticamente gestor ou fiscal.

Saídas:
- `data-quality/remessa-diff.json`
- `data-quality/remessa-conflicts.json`
- `data-quality/remessa-validation-report.md`
- `lista-instrumentos-consolidada-final.xlsx`

## 11. Detalhe do contrato
Rota `/contratos/[id]`.

Exibir dados gerais, partes, objeto, valor, vigência, fiscal, gestor, documentos, evidências, complementos, pendências, histórico e origem.

Seção obrigatória: `Fontes e Evidências`.

## 12. Fiscais x Comissões
Rota `/contratos/fiscais-comissoes`.

Importar portarias e extrair:
- número;
- ano;
- comissão;
- finalidade;
- vigência;
- presidente;
- membros;
- suplentes;
- atribuições;
- processos/contratos relacionados.

Cruzar:
```text
pessoa
x contrato
x papel no contrato
x comissão
x papel na comissão
x vigência contrato
x vigência comissão
x responsabilidade da comissão
```

Classificações:
- OK
- ATENÇÃO
- POTENCIAL CONFLITO
- REVISÃO NECESSÁRIA

Ser membro de comissão, isoladamente, não é problema.

## 13. Remessa x LAI
Rota `/contratos/remessa-lai`.

Primeiro classificar:
- COMPARAVEL_COM_LAI
- FORA_DO_ESCOPO_LAI
- REVISAO_DE_ESCOPO

Matching:
1. número + ano + CNPJ;
2. número + ano + empresa;
3. número + ano + objeto;
4. objeto + CNPJ + datas + valores + processo.

Resultados:
- MATCH_EXATO
- MATCH_FORTE
- MATCH_PROVAVEL
- MATCH_AMBIGUO
- SOMENTE_REMESSA
- SOMENTE_LAI
- FORA_ESCOPO
- DIVERGENCIA

Mostrar score e motivos, nunca só percentual.

## 14. LAI Contratos
Não confiar no nome da aba para competência.

Prioridade:
1. competência informada na importação;
2. nome do arquivo;
3. data de atualização;
4. nome da aba.

Nº de ordem não é chave confiável.

Normalizar contrato, ano, CNPJ, empresa, objeto, processo, modalidade, datas, valores, fiscal, aditivos e apostilamentos.

## 15. Terceirizados
Rota `/terceirizados`.

Snapshot por competência.

Campos:
UGC, UGE, objeto, contrato, ano, empresa, CNPJ, identificador do funcionário, lotação, função, jornada, turno, remuneração e custo individual.

Não considerar identificadores como `A-1` globalmente únicos.

Análises:
quantidade, custo, empresa, contrato, função, lotação, turno, evolução, entradas, saídas, mudança de função, remuneração e custo.

## 16. Folha
Rota `/folha`.

Não inventar schema antes de ler os arquivos reais.

Criar primeiro:
`docs/payroll-source-analysis.md`

Só depois implementar parser, histórico, filtros, comparação de competências e dashboard.

## 17. Viagens
Rota `/viagens`.

Parser próprio para cabeçalhos multinível.

Campos canônicos:
UGC, UGE, favorecido, matrícula, cargo/função, finalidade, motivação, tipo, origem UF/cidade, destino UF/cidade/país, ida, volta, companhia, categoria, passagem ida/volta/total, diárias integrais/parciais, total de diárias, total geral e observações.

Executar data quality antes de compliance:
- ida > volta;
- UF inválida;
- cidade em UF;
- soma incorreta;
- valor negativo;
- quantidade negativa;
- moeda inesperada;
- campos contraditórios.

## 18. Conformidade com Política de Viagens
Rota `/viagens/conformidade`.

Versionar a Política de Viagens.

Estruturas:
- `travel_policy_versions`
- `travel_policy_rules`
- `travel_rule_results`

Engine:
`TravelComplianceEngine`

Status:
- CONFORME
- ATENCAO
- INDICIO_NAO_CONFORMIDADE
- REVISAO_NECESSARIA
- NAO_VERIFICAVEL_COM_DADOS_LAI
- NAO_APLICAVEL

Ausência de dado nunca equivale automaticamente a descumprimento.

Cada resultado deve explicar regra, dados analisados, fundamento, motivo, fonte, competência, documento e item da política.

## 19. Importações
Rota `/admin/importacoes`.

Fluxo:
```text
UPLOAD
↓
HASH
↓
VALIDAÇÃO
↓
STAGING
↓
NORMALIZAÇÃO
↓
PRÉVIA
↓
PUBLICAÇÃO
```

Cada arquivo registra nome, tipo, hash, competência, usuário, data, parser, versão e status.

Importação idempotente. Mesmo hash não duplica. Planejar rollback.

## 20. Normalização
Normalizadores compartilhados:
- CNPJ;
- CPF quando necessário;
- nomes;
- espaços/quebras;
- dinheiro;
- contratos;
- anos;
- processos;
- datas;
- UF;
- cidade;
- moeda;
- cargos.

Nunca apagar raw value.

Valores financeiros em centavos/Decimal, não float.

## 21. Testes
Obrigatórios:
- parsers;
- normalização;
- reconciliação;
- política;
- autenticação/autorização;
- segurança;
- integração;
- E2E.

## 22. Performance
Fluxo:
```text
importar
↓
normalizar
↓
validar
↓
reconciliar
↓
executar regras
↓
persistir resultados
```

Não recalcular engines em toda renderização.

## 23. UX
Interface institucional moderna, sem aparência de template genérico.

Priorizar:
- densidade;
- legibilidade;
- tabelas;
- filtros;
- responsividade;
- acessibilidade;
- loading;
- skeleton;
- empty/error states;
- breadcrumbs;
- teclado.

Evitar textos óbvios, cards demais, excesso de cor, gradientes sem função, bordas excessivas e ícones decorativos.

## 24. Divisão Codex x Kimi
### Codex
Arquitetura, banco, migrations, autenticação, autorização, importação, parsers, normalização, domínio, reconciliação, rules engine, testes, auditoria e segurança.

### Kimi
Design system, shell, layout, componentes, tabelas, filtros, dashboards, responsividade, acessibilidade e acabamento visual.

Não editar os mesmos arquivos simultaneamente.

## 25. Fases
```text
00-skills
01-arquitetura
02-remessa-data-quality
03-fundacao
04-contratos
05-fiscais-comissoes
06-remessa-lai
07-terceirizados
08-viagens
09-politica-viagens
10-folha
11-qa
12-frontend-polish
13-deploy
```

## 26. Regra de execução
Uma fase por vez.

Cada fase deve:
1. ler `docs/MASTER_PLAN.md`;
2. ler `AGENTS.md`;
3. consultar skills;
4. executar apenas sua responsabilidade;
5. testar;
6. atualizar documentação;
7. apresentar resultado;
8. parar e aguardar aprovação.

## 27. Definition of Done
O sistema só está concluído quando:
- os dados são rastreáveis;
- nenhum campo relevante é perdido;
- imports são idempotentes;
- snapshots são preservados;
- divergências são explicadas;
- matches ambíguos não são escondidos;
- regras têm fundamento;
- ausência de evidência não vira irregularidade;
- proteção server-side funciona;
- auditoria funciona;
- testes passam;
- build de produção passa;
- novas competências entram sem reescrever o sistema;
- código continua modular.

## 28. Resultado
O SUAPE em Dados deve ser uma plataforma institucional de inteligência para Compliance: consolidar fontes, criar rastreabilidade, comparar dados e apontar situações que mereçam análise humana sem transformar inferência automática em conclusão definitiva.


