# Fiscais e comissões

## Entrega

- Importação administrativa de portarias textuais em PDF.
- Preservação do texto integral de cada página em `raw_records`.
- Extração de número, ano, comissão, finalidade, vigência, presidente e membros efetivos.
- Bloqueio de duplicidade por SHA-256 do arquivo.
- Cruzamento versionado com gestor, fiscal e campo genérico de responsável do Remessa.
- Busca, filtro, paginação, indicadores e composição por comissão em `/contratos/fiscais-comissoes`.

## Regras de classificação

- `OK`: sem correspondência nominal ou períodos confirmadamente não concomitantes.
- `ATENCAO`: nome integral idêntico em gestor/fiscal e vigências sobrepostas.
- `REVISAO_NECESSARIA`: nome parcial, campo genérico do Remessa ou vigência insuficiente.
- `POTENCIAL_CONFLITO`: reservado para evidência documental específica de incompatibilidade; coincidência de pessoa, sozinha, não basta.

As portarias recebidas não indicam contratos ou processos específicos. Por isso `cpl_contract_links` permanece vazio e nenhum potencial conflito foi gerado automaticamente.
