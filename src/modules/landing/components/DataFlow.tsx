const stages = ["Fonte", "Normalização", "Cruzamento", "Evidência", "Análise"];

export function DataFlow() {
  return (
    <section id="rastreabilidade" className="border-y border-[var(--line)] bg-[var(--surface)]" aria-labelledby="flow-title">
      <div className="section-shell">
        <div className="section-heading"><div><p className="eyebrow">Rastreabilidade por desenho</p><h2 id="flow-title">Cada conclusão volta até a fonte que a sustenta.</h2></div><p>O sistema organiza o caminho do dado sem substituir a análise humana.</p></div>
        <div className="mt-10 grid gap-6 xl:grid-cols-[1.22fr_0.78fr]">
          <div className="flow-panel"><div className="flex flex-wrap gap-2 border-b border-[var(--line)] p-4 sm:p-5">{["Remessa TCE", "LAI", "Documentos / PDFs"].map((source) => <span className="source-chip" key={source}>{source}</span>)}</div><div className="grid p-4 sm:p-5 md:grid-cols-5 md:gap-0">{stages.map((stage, index) => <div className="flow-stage" key={stage}><span>{String(index + 1).padStart(2, "0")}</span><strong>{stage}</strong>{index < stages.length - 1 && <i aria-hidden="true">→</i>}</div>)}</div><div className="border-t border-[var(--line)] px-4 py-3 text-xs text-[var(--muted)] sm:px-5">SUAPE em Dados conecta fontes, registra transformações e mantém o caminho da evidência visível.</div></div>
          <aside className="evidence-card" aria-label="Exemplo conceitual de evidência rastreável"><div className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4"><div><p className="text-xs font-semibold">Registro de evidência</p><p className="mt-1 text-[11px] text-[var(--muted)]">Exemplo conceitual</p></div><span className="status status-ok">Confirmada</span></div><dl className="mt-4 divide-y divide-[var(--line)]">{[["Fiscal", "Nome da pessoa"], ["Fonte", "Contrato 029/2026"], ["Documento", "PDF principal"], ["Página", "14"], ["Evidência", "Confirmada"]].map(([term, value]) => <div className="grid grid-cols-[92px_1fr] gap-4 py-3 text-sm" key={term}><dt className="text-[var(--muted)]">{term}</dt><dd className="font-medium text-[var(--ink-soft)]">{value}</dd></div>)}</dl></aside>
        </div>
      </div>
    </section>
  );
}
