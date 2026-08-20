# Análise da fonte de folha

Fonte analisada: `FOLHA_JUNHO_2026 (2).xlsx`. O arquivo original não foi modificado nem adicionado ao repositório.

## Estrutura observada

- A aba principal de funcionários tem 11 colunas; as demais têm 10.
- O cabeçalho efetivo começa na linha 2.
- Campos comuns: nome, chapa, CPF mascarado, tipo de funcionário, evento, período, ano e mês de competência, tipo do evento e valor.
- A aba de funcionários também contém a coluna salário.
- Tipos de evento: `P` (provento), `D` (desconto) e `B` (base).
- Identificação e categoria aparecem na primeira linha do bloco da pessoa e precisam ser propagadas somente dentro desse bloco.
- Linhas de total não representam eventos e não entram na contagem de pessoas.

## Totais de conferência

- 292 pessoas únicas.
- Proventos: R$ 3.593.495,43.
- Descontos: R$ 1.521.953,24.
- Líquido calculado: R$ 2.071.542,19.

Categorias encontradas: funcionários, comissionados, cedidos, Conselho de Administração, Conselho Fiscal e Comitê de Auditoria.

## Schema adotado

`payroll_events` guarda um evento por linha, com `person_hash`, CPF mascarado, categoria, nome do evento, tipo, valor em centavos, competência e proveniência completa.

## Regras de privacidade

- A interface padrão mostra apenas agregados.
- O nome da pessoa não faz parte do schema canônico mínimo.
- O CPF continua mascarado.
- Qualquer uso de `raw_json` deve ficar restrito a perfis autorizados e auditoria.
