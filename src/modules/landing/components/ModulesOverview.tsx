import { landingMock } from "../data/landing.mock";

const sizeClass = { featured: "module-featured", wide: "module-wide", standard: "module-standard", compact: "module-compact" } as const;

export function ModulesOverview() {
  return (
    <section className="section-shell" aria-labelledby="modules-title">
      <div className="section-heading"><div><p className="eyebrow">Domínios conectados</p><h2 id="modules-title">Uma leitura única para fontes que hoje vivem separadas.</h2></div><p>Estrutura modular para consulta, cruzamento e análise com origem preservada.</p></div>
      <div className="module-grid mt-10">{landingMock.modules.map((module) => <article className={`module-panel ${sizeClass[module.size]}`} key={module.name}><span className="module-index">{module.index}</span><div className="mt-auto"><h3>{module.name}</h3><p>{module.description}</p></div></article>)}</div>
    </section>
  );
}
