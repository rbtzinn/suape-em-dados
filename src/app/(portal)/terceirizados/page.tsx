import type { Metadata } from "next";

import { MiniLineChart } from "@/components/charts/mini-line-chart";
import { DataTable } from "@/components/tables/data-table";
import { Icon } from "@/components/ui/icon";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSystemSnapshot } from "@/data/system";
import { formatCompactCurrency, formatCurrency } from "@/domain/format";

export const metadata: Metadata = { title: "Terceirizados" };

export default async function OutsourcedPage() {
  const data = await getSystemSnapshot();
  const series = data.outsourced.series;
  const latest = series.at(-1);
  const first = series[0];
  const movement = latest && first ? latest.people - first.people : 0;

  return (
    <>
      <PageHeader eyebrow="Força de trabalho" title="Terceirizados" description="Snapshots mensais preservados para acompanhar quantitativos, empresas, contratos e consistência da fonte." />
      <section className="metrics-grid">
        <MetricCard label="Pessoas · última competência" value={String(data.outsourced.latestPeople)} detail={`${movement >= 0 ? "+" : ""}${movement} desde janeiro`} icon="people" />
        <MetricCard label="Empresas" value={String(data.outsourced.latestCompanies)} detail="na competência mais recente" icon="contract" tone="green" />
        <MetricCard label="Contratos vinculados" value={String(data.outsourced.latestContracts)} detail="sem deduplicação silenciosa" icon="database" tone="slate" />
        <MetricCard label="Adicional noturno" value={String(data.outsourced.nightShift)} detail="registros sinalizados na fonte" icon="payroll" tone="yellow" />
      </section>

      <div className="content-grid">
        <Panel title="Evolução financeira mensal" description="Linha azul: custo; linha amarela: remuneração informada na fonte">
          <MiniLineChart
            values={series.map((point) => point.costCents)}
            secondaryValues={series.map((point) => point.remunerationCents)}
            labels={series.map((point) => point.month)}
            valueFormatter={formatCurrency}
          />
        </Panel>
        <Panel title="Competência mais recente" description={latest ? latest.month : "Sem dados"}>
          <div className="kpi-strip">
            <div><span>Pessoas</span><strong>{latest?.people ?? 0}</strong></div>
            <div><span>Custo</span><strong>{formatCompactCurrency(latest?.costCents ?? 0)}</strong></div>
            <div><span>Remuneração</span><strong>{formatCompactCurrency(latest?.remunerationCents ?? 0)}</strong></div>
          </div>
        </Panel>
      </div>

      <div className="notice-box" style={{ margin: "17px 0" }}><Icon name="warning" /><div><strong>Qualidade da fonte</strong><p>{data.outsourced.qualityNotice}</p></div></div>

      <Panel title="Série histórica" description="Um snapshot por competência; meses anteriores não são sobrescritos" className="panel-flush">
        <DataTable
          caption="Série mensal de terceirizados"
          columns={[{ key: "month", label: "Competência" }, { key: "people", label: "Pessoas", align: "right" }, { key: "cost", label: "Custo", align: "right" }, { key: "remuneration", label: "Remuneração", align: "right", hideOnMobile: true }, { key: "quality", label: "Leitura" }]}
          rows={series.map((point) => ({
            id: point.month,
            month: <strong>{point.month}</strong>,
            people: point.people,
            cost: formatCurrency(point.costCents),
            remuneration: formatCurrency(point.remunerationCents),
            quality: <StatusBadge>{point.costCents < point.remunerationCents ? "Requer validação semântica" : "Mapeado"}</StatusBadge>,
          }))}
        />
      </Panel>
    </>
  );
}
