import Link from "next/link";
import type { Metadata } from "next";

import { DonutChart } from "@/components/charts/donut-chart";
import { DataTable } from "@/components/tables/data-table";
import { Icon } from "@/components/ui/icon";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SourceBanner } from "@/components/ui/source-banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSystemSnapshot } from "@/data/system";
import { formatCompactCurrency, formatCurrency } from "@/domain/format";

export const metadata: Metadata = { title: "Viagens e diárias" };

export default async function TravelPage() {
  const data = await getSystemSnapshot();
  const travel = data.travel;
  return (
    <>
      <PageHeader
        eyebrow={`Mapa LAI · ${travel.competence}`}
        title="Viagens e diárias"
        description="Deslocamentos, passagens e diárias com cabeçalhos multinível normalizados e vínculo à política vigente."
        actions={<Link className="button button-primary" href="/viagens/conformidade"><Icon name="shield" />Analisar conformidade</Link>}
      />
      <SourceBanner meta={data.meta} />
      <section className="metrics-grid">
        <MetricCard label="Viagens" value={String(travel.records)} detail={`${travel.destinations} destinos mapeados`} icon="travel" />
        <MetricCard label="Passagens" value={formatCompactCurrency(travel.ticketsCents)} detail={formatCurrency(travel.ticketsCents)} icon="payroll" tone="slate" />
        <MetricCard label="Diárias" value={formatCompactCurrency(travel.dailyCents)} detail={formatCurrency(travel.dailyCents)} icon="payroll" tone="yellow" />
        <MetricCard label="Custo total" value={formatCompactCurrency(travel.totalCents)} detail={formatCurrency(travel.totalCents)} icon="check" tone="green" />
      </section>

      <div className="content-grid">
        <Panel title="Composição do custo" description="Participação das passagens no total registrado">
          <DonutChart value={travel.ticketsCents} total={travel.totalCents} label="passagens" detail={`Passagens: ${formatCurrency(travel.ticketsCents)}. Diárias: ${formatCurrency(travel.dailyCents)}.`} />
        </Panel>
        <Panel title="Escopo da fonte LAI" description="O que pode e o que não pode ser concluído">
          <div className="progress-list">
            <div className="notice-box info"><Icon name="check" /><div><strong>Verificável</strong><p>Rotas, datas da viagem, quantidades, valores e observações presentes na planilha.</p></div></div>
            <div className="notice-box"><Icon name="warning" /><div><strong>Não verificável sem complemento</strong><p>Datas de solicitação, três cotações, aprovações e prestação de contas.</p></div></div>
          </div>
        </Panel>
      </div>

      <Panel title="Mapa de deslocamentos" description="Todos os registros da competência publicada, sem expor a identidade do viajante" className="panel-flush">
        <DataTable
          caption="Mapa de viagens e diárias"
          columns={[{ key: "trip", label: "Viagem" }, { key: "route", label: "Rota" }, { key: "period", label: "Período", hideOnMobile: true }, { key: "total", label: "Total", align: "right" }, { key: "state", label: "Leitura" }]}
          rows={travel.examples.map((item) => ({ id: item.id, trip: <div className="table-primary"><strong>{item.id}</strong><span>{item.purpose}</span></div>, route: item.route, period: item.period, total: formatCurrency(item.totalCents), state: <StatusBadge>{item.status}</StatusBadge> }))}
        />
      </Panel>
    </>
  );
}
