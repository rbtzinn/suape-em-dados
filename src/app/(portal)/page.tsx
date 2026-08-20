import Link from "next/link";
import type { Metadata } from "next";

import { DonutChart } from "@/components/charts/donut-chart";
import { HorizontalBars } from "@/components/charts/horizontal-bars";
import { DataTable } from "@/components/tables/data-table";
import { Icon } from "@/components/ui/icon";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SourceBanner } from "@/components/ui/source-banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSystemSnapshot } from "@/data/system";
import {
  formatCompactCurrency,
  formatCurrency,
  formatInteger,
} from "@/domain/format";

export const metadata: Metadata = { title: "Painel executivo" };

export default async function DashboardPage() {
  const data = await getSystemSnapshot();
  const totalMapped =
    data.contracts.remessaRecords +
    data.outsourced.latestPeople +
    data.payroll.people +
    data.travel.records;

  return (
    <>
      <PageHeader
        eyebrow="Visão integrada"
        title="Painel executivo"
        description="Leitura consolidada de contratos, força de trabalho, folha e viagens — com rastreabilidade até a fonte."
        actions={<Link className="button" href="/admin/importacoes"><Icon name="upload" />Ver importações</Link>}
      />
      <SourceBanner meta={data.meta} />

      <section className="metrics-grid" aria-label="Indicadores principais">
        <MetricCard label="Instrumentos Remessa" value={formatInteger(data.contracts.remessaRecords)} detail={`${data.contracts.laiRecords} contratos na base LAI`} icon="contract" tone="blue" />
        <MetricCard label="Valor global indexado" value={formatCompactCurrency(data.contracts.remessaGlobalValueCents)} detail={formatCurrency(data.contracts.remessaGlobalValueCents)} icon="payroll" tone="green" />
        <MetricCard label="Revisões documentais" value={formatInteger(data.contracts.needReview)} detail={`${data.contracts.withoutPdf} sem PDF principal`} icon="warning" tone="yellow" />
        <MetricCard label="Registros monitorados" value={formatInteger(totalMapped)} detail="recortes agregados na versão atual" icon="database" tone="slate" />
      </section>

      <div className="content-grid">
        <Panel title="Panorama por módulo" description="Escala dos recortes atualmente mapeados">
          <HorizontalBars
            items={[
              { label: "Terceirizados · jul/26", value: data.outsourced.latestPeople, display: `${data.outsourced.latestPeople} pessoas`, tone: "blue" },
              { label: "Folha · jun/26", value: data.payroll.people, display: `${data.payroll.people} pessoas`, tone: "green" },
              { label: "Instrumentos Remessa", value: data.contracts.remessaRecords, display: `${data.contracts.remessaRecords} registros`, tone: "yellow" },
              { label: "Viagens · jul/26", value: data.travel.records, display: `${data.travel.records} registros`, tone: "slate" },
            ]}
          />
        </Panel>

        <Panel title="Cobertura documental" description="Presença do documento principal na Remessa">
          <DonutChart
            value={data.contracts.pdfCollected}
            total={data.contracts.remessaRecords}
            label="com PDF"
            detail={`${data.contracts.pdfCollected} PDFs coletados e ${data.contracts.withoutPdf} instrumentos sem documento principal.`}
          />
        </Panel>
      </div>

      <div className="content-grid wide-right">
        <Panel title="Integridade cadastral" description="Confirmações registradas na base consolidada">
          <div className="progress-list">
            <ProgressBar value={data.contracts.managers} max={data.contracts.remessaRecords} label="Gestor confirmado" detail={`${data.contracts.managers} de ${data.contracts.remessaRecords}`} />
            <ProgressBar value={data.contracts.inspectors} max={data.contracts.remessaRecords} label="Fiscal confirmado" detail={`${data.contracts.inspectors} de ${data.contracts.remessaRecords}`} tone="green" />
            <ProgressBar value={data.contracts.divergences} max={data.contracts.remessaRecords} label="Divergência cadastral" detail={`${data.contracts.divergences} registro(s)`} tone="yellow" />
          </div>
        </Panel>

        <Panel title="Fila de atenção" description="Sinais para triagem; não representam irregularidade confirmada" className="panel-flush" action={<Link href="/contratos" className="link-row">Abrir carteira</Link>}>
          <DataTable
            caption="Prioridades de análise"
            columns={[
              { key: "item", label: "Item" },
              { key: "module", label: "Módulo", hideOnMobile: true },
              { key: "signal", label: "Sinal" },
              { key: "action", label: "Próxima ação", hideOnMobile: true },
            ]}
            rows={[
              { id: "review", item: <div className="table-primary"><strong>{data.contracts.needReview} instrumentos</strong><span>Base Remessa</span></div>, module: "Contratos", signal: <StatusBadge>Revisão necessária</StatusBadge>, action: "Validar documento principal" },
              { id: "pdf", item: <div className="table-primary"><strong>{data.contracts.withoutPdf} registros</strong><span>Cobertura documental</span></div>, module: "Contratos", signal: <StatusBadge>Sem PDF principal</StatusBadge>, action: "Localizar ou justificar ausência" },
              { id: "match", item: <div className="table-primary"><strong>{data.reconciliation.onlyLai + data.reconciliation.probable} correspondências</strong><span>Remessa × LAI</span></div>, module: "Saneamento", signal: <StatusBadge>Revisão humana</StatusBadge>, action: "Confirmar vínculo e razões" },
              { id: "travel", item: <div className="table-primary"><strong>Regras não observáveis</strong><span>Política de viagens</span></div>, module: "Viagens", signal: <StatusBadge>Não verificável com dados LAI</StatusBadge>, action: "Complementar datas e aprovações" },
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
