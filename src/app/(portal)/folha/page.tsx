import type { Metadata } from "next";

import { HorizontalBars } from "@/components/charts/horizontal-bars";
import { DataTable } from "@/components/tables/data-table";
import { Icon } from "@/components/ui/icon";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSystemSnapshot } from "@/data/system";
import { formatCompactCurrency, formatCurrency } from "@/domain/format";

export const metadata: Metadata = { title: "Folha de pagamento" };

export default async function PayrollPage() {
  const data = await getSystemSnapshot();
  const payroll = data.payroll;
  return (
    <>
      <PageHeader eyebrow={`Competência · ${payroll.competence}`} title="Folha de pagamento" description="Visão agregada por categoria funcional. Eventos P, D e B permanecem separados e os totais da planilha não são contados como pessoas." />
      <section className="metrics-grid">
        <MetricCard label="Pessoas únicas" value={String(payroll.people)} detail="deduplicadas dentro da competência" icon="people" />
        <MetricCard label="Proventos" value={formatCompactCurrency(payroll.proceedsCents)} detail={formatCurrency(payroll.proceedsCents)} icon="payroll" tone="green" />
        <MetricCard label="Descontos" value={formatCompactCurrency(payroll.discountsCents)} detail={formatCurrency(payroll.discountsCents)} icon="payroll" tone="yellow" />
        <MetricCard label="Líquido calculado" value={formatCompactCurrency(payroll.netCents)} detail="proventos menos descontos" icon="check" tone="slate" />
      </section>

      <div className="notice-box info" style={{ marginBottom: 17 }}><Icon name="shield" /><div><strong>Minimização de dados pessoais</strong><p>A interface apresenta apenas agregados. CPF mascarado e identificadores técnicos permanecem restritos à camada de dados e à auditoria autorizada.</p></div></div>

      <div className="content-grid">
        <Panel title="Líquido por categoria" description="Comparação da competência atual">
          <HorizontalBars items={payroll.categories.map((item, index) => ({ label: item.category, value: item.netCents, display: formatCompactCurrency(item.netCents), tone: index === 0 ? "blue" : index === 1 ? "green" : "slate" }))} />
        </Panel>
        <Panel title="Composição financeira" description="Totais calculados a partir dos eventos">
          <div className="kpi-strip">
            <div><span>Proventos</span><strong>{formatCompactCurrency(payroll.proceedsCents)}</strong></div>
            <div><span>Descontos</span><strong>{formatCompactCurrency(payroll.discountsCents)}</strong></div>
            <div><span>Líquido</span><strong>{formatCompactCurrency(payroll.netCents)}</strong></div>
          </div>
        </Panel>
      </div>

      <Panel title="Categorias funcionais" description="Contagem e valor líquido por grupo" className="panel-flush">
        <DataTable
          caption="Resumo da folha por categoria"
          columns={[{ key: "category", label: "Categoria" }, { key: "people", label: "Pessoas", align: "right" }, { key: "net", label: "Líquido", align: "right" }, { key: "share", label: "Situação" }]}
          rows={payroll.categories.map((item) => ({ id: item.category, category: <strong>{item.category}</strong>, people: item.people, net: formatCurrency(item.netCents), share: <StatusBadge tone="info">Agregado</StatusBadge> }))}
        />
      </Panel>
    </>
  );
}
