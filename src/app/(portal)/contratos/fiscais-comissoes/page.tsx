import type { Metadata } from "next";

import { HorizontalBars } from "@/components/charts/horizontal-bars";
import { DonutChart } from "@/components/charts/donut-chart";
import { CommissionMatchesExplorer } from "@/components/contracts/commission-matches-explorer";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Icon } from "@/components/ui/icon";
import { getSystemSnapshot } from "@/data/system";

export const metadata: Metadata = { title: "Fiscais e comissões" };

export default async function InspectorsPage() {
  const data = await getSystemSnapshot();
  const bothConfirmed = data.contracts.bothConfirmed;
  const commissions = data.commissions;
  const pending = commissions.attention + commissions.review + commissions.potentialConflict;
  return (
    <>
      <PageHeader eyebrow="Governança contratual" title="Fiscais e comissões" description="Comparação rastreável entre portarias de comissões e os responsáveis publicados no Remessa." />
      <section className="metrics-grid">
        <MetricCard label="Portarias" value={String(commissions.ordinances)} detail="comissões mapeadas" icon="file" />
        <MetricCard label="Membros efetivos" value={String(commissions.members)} detail={`${commissions.presidents} presidentes`} icon="people" tone="green" />
        <MetricCard label="Pessoas correspondentes" value={String(commissions.matchedPeople)} detail="em campos do Remessa" icon="shield" tone="slate" />
        <MetricCard label="Potenciais conflitos" value={String(commissions.potentialConflict)} detail="somente com evidência específica" icon="warning" tone="yellow" />
      </section>
      <div className="content-grid">
        <Panel title="Triagem dos cruzamentos" description="Resultado da execução mais recente">
          <DonutChart value={pending} total={commissions.examples.length} label="para análise" detail={`${commissions.attention} em atenção · ${commissions.review} em revisão necessária`} color="var(--amber-800)" />
        </Panel>
        <Panel title="Membros por comissão" description="Composição efetiva extraída das portarias">
          <HorizontalBars items={commissions.byCommission.map((item) => ({ label: item.commission, value: item.members, display: `${item.members} membros`, tone: item.review > 0 ? "yellow" : "blue" }))} />
        </Panel>
      </div>
      <Panel title="Cobertura documental do Remessa" description="Confirmações disponíveis na fonte contratual" className="panel-spaced">
        <div className="progress-list">
          <ProgressBar value={data.contracts.managers} max={data.contracts.remessaRecords} label="Gestores" detail={`${data.contracts.managers} confirmados`} />
          <ProgressBar value={data.contracts.inspectors} max={data.contracts.remessaRecords} label="Fiscais" detail={`${data.contracts.inspectors} confirmados`} tone="green" />
          <ProgressBar value={bothConfirmed} max={data.contracts.remessaRecords} label="Cobertura conjunta" detail={`${bothConfirmed} instrumentos`} tone="slate" />
        </div>
      </Panel>
      <div className="notice-box" style={{ marginBottom: 17 }}><Icon name="warning" /><div><strong>Critério de classificação</strong><p>Atenção significa coincidência confirmada de pessoa e período. Revisão necessária cobre nome parcial, campo genérico ou vigência insuficiente. Nenhuma dessas classificações prova irregularidade.</p></div></div>
      <Panel title="CPL × Remessa" description="Filtre por membro, comissão, instrumento ou classificação" className="panel-flush">
        <CommissionMatchesExplorer rows={commissions.examples} />
      </Panel>
    </>
  );
}
