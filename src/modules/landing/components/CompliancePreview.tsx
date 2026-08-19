import { landingMock } from "../data/landing.mock";

const statusClass: Record<string, string> = { Conforme: "status status-ok", Atenção: "status status-attention", "Revisão necessária": "status status-review", "Não verificável": "status status-neutral" };

export function CompliancePreview() {
  return (
    <section className="section-shell" aria-labelledby="compliance-title">
      <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end"><div><p className="eyebrow">Apoio à decisão</p><h2 id="compliance-title" className="mt-4 max-w-[620px] text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">O sistema sinaliza. A análise humana conclui.</h2><p className="mt-4 max-w-[560px] text-sm leading-7 text-[var(--muted)] sm:text-base">Situações são organizadas por contexto, fundamento e evidência — sem transformar ausência de dado em irregularidade.</p></div><p className="justify-self-start border-l-2 border-[var(--accent)] pl-4 text-sm leading-6 text-[var(--muted)] lg:max-w-[360px] lg:justify-self-end">Classificação de apoio à revisão, nunca uma conclusão automática sobre responsabilidade ou conformidade.</p></div>
      <div className="mt-10 border-y border-[var(--line)]">{landingMock.compliance.map((item) => <div className="compliance-row" key={item.label}><span className={statusClass[item.label]}>{item.label}</span><span className="text-2xl font-semibold tracking-[-0.04em] tabular-nums">{item.count}</span><span className="text-sm text-[var(--muted)]">{item.detail}</span><span className="hidden text-right text-xs font-medium text-[var(--accent)] sm:block">Revisável</span></div>)}</div>
    </section>
  );
}
