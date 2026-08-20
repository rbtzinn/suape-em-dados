import type { Metadata } from "next";

import { DataTable } from "@/components/tables/data-table";
import { DonutChart } from "@/components/charts/donut-chart";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSystemSnapshot } from "@/data/system";

export const metadata: Metadata = { title: "Fiscais e comissões" };

export default async function InspectorsPage() {
  const data = await getSystemSnapshot();
  const bothConfirmed = data.contracts.bothConfirmed;
  return (
    <>
      <PageHeader eyebrow="Governança contratual" title="Fiscais e comissões" description="Cobertura de gestores, fiscais e estruturas de acompanhamento vinculadas aos instrumentos." />
      <section className="metrics-grid">
        <MetricCard label="Gestores confirmados" value={String(data.contracts.managers)} detail={`de ${data.contracts.remessaRecords} instrumentos`} icon="people" />
        <MetricCard label="Fiscais confirmados" value={String(data.contracts.inspectors)} detail={`de ${data.contracts.remessaRecords} instrumentos`} icon="shield" tone="green" />
        <MetricCard label="Ambos confirmados" value={String(bothConfirmed)} detail="gestor e fiscal no mesmo registro" icon="check" tone="slate" />
        <MetricCard label="Requerem revisão" value={String(data.contracts.needReview)} detail="inclui lacunas documentais" icon="warning" tone="yellow" />
      </section>
      <div className="content-grid">
        <Panel title="Cobertura conjunta" description="Instrumentos com gestor e fiscal confirmados">
          <DonutChart value={bothConfirmed} total={data.contracts.remessaRecords} label="cobertura" detail="A confirmação cadastral não substitui a comprovação formal da designação." color="var(--green-700)" />
        </Panel>
        <Panel title="Cobertura por função" description="Confirmações sobre o total da Remessa">
          <div className="progress-list">
            <ProgressBar value={data.contracts.managers} max={data.contracts.remessaRecords} label="Gestores" detail={`${data.contracts.managers} confirmados`} />
            <ProgressBar value={data.contracts.inspectors} max={data.contracts.remessaRecords} label="Fiscais" detail={`${data.contracts.inspectors} confirmados`} tone="green" />
            <ProgressBar value={bothConfirmed} max={data.contracts.remessaRecords} label="Cobertura conjunta" detail={`${bothConfirmed} instrumentos`} tone="slate" />
          </div>
        </Panel>
      </div>
      <Panel title="Acompanhamento publicado" description="Registros da base canônica; portarias da CPL serão cruzadas quando enviadas" className="panel-flush">
        <DataTable
          caption="Cobertura de responsáveis"
          columns={[{ key: "instrument", label: "Instrumento" }, { key: "manager", label: "Gestor" }, { key: "inspector", label: "Fiscal" }, { key: "state", label: "Situação" }]}
          rows={data.contracts.examples.map((item) => ({ id: item.id, instrument: <div className="table-primary"><strong>{item.id}</strong><span>{item.company}</span></div>, manager: <StatusBadge>{item.manager}</StatusBadge>, inspector: <StatusBadge>{item.inspector}</StatusBadge>, state: <StatusBadge>{item.analysis}</StatusBadge> }))}
        />
      </Panel>
    </>
  );
}
