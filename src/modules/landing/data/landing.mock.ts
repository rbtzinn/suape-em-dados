/**
 * Dados exclusivamente conceituais para a landing page.
 * Nunca devem alimentar indicadores operacionais ou análises de Compliance.
 */
export const landingMock = {
  metrics: [
    { label: "Contratos em execução", value: "128", meta: "+6 no mês" },
    { label: "Instrumentos revisados", value: "94", meta: "73% do universo" },
    { label: "Remessa × LAI", value: "11", meta: "pontos para análise" },
    { label: "Viagens analisadas", value: "342", meta: "competência atual" },
  ],
  timeline: [38, 52, 49, 66, 72, 78, 86, 91],
  previewRows: [
    { id: "029/2026", check: "Remessa × LAI", status: "Atenção" },
    { id: "041/2026", check: "Fiscal × comissão", status: "Revisão necessária" },
    { id: "052/2026", check: "Evidência documental", status: "Conforme" },
  ],
  modules: [
    { index: "01", name: "Contratos", description: "Instrumentos, vigências e evidências em uma leitura única.", size: "featured" },
    { index: "02", name: "Remessa × LAI", description: "Cruza fontes e explica divergências sem esconder ambiguidades.", size: "wide" },
    { index: "03", name: "Fiscais × Comissões", description: "Relaciona pessoas, papéis, vigências e responsabilidades.", size: "standard" },
    { index: "04", name: "Contratos Terceirizados", description: "Snapshots, custos e movimentações por competência.", size: "compact" },
    { index: "05", name: "Folha de Pagamento", description: "Histórico preparado para comparação entre competências.", size: "compact" },
    { index: "06", name: "Viagens e Diárias", description: "Consolidação e qualidade dos dados de deslocamentos.", size: "featured" },
    { index: "07", name: "Conformidade com Política de Viagens", description: "Regras versionadas com fundamento, fonte e revisão humana.", size: "wide" },
  ],
  compliance: [
    { label: "Conforme", count: "216", detail: "sem ponto de atenção identificado" },
    { label: "Atenção", count: "18", detail: "merece leitura complementar" },
    { label: "Revisão necessária", count: "07", detail: "depende de validação humana" },
    { label: "Não verificável", count: "04", detail: "dados insuficientes para concluir" },
  ],
} as const;
