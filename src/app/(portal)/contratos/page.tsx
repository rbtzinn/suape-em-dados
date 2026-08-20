import Link from "next/link";
import type { Metadata } from "next";

import { ContractsExplorer } from "@/components/contracts/contracts-explorer";
import { Icon } from "@/components/ui/icon";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SourceBanner } from "@/components/ui/source-banner";
import { getSystemSnapshot } from "@/data/system";
import { formatCompactCurrency, formatCurrency, formatInteger } from "@/domain/format";

export const metadata: Metadata = { title: "Contratos" };

export default async function ContractsPage() {
  const data = await getSystemSnapshot();
  return (
    <>
      <PageHeader
        eyebrow="Carteira integrada"
        title="Contratos"
        description="Inventário de instrumentos com origem, documentação, responsáveis e estado da análise preservados."
        actions={<><Link className="button" href="/contratos/remessa-lai"><Icon name="shield" />Remessa × LAI</Link><Link className="button button-primary" href="/admin/importacoes"><Icon name="upload" />Nova importação</Link></>}
      />
      <SourceBanner meta={data.meta} />
      <section className="metrics-grid">
        <MetricCard label="Instrumentos Remessa" value={formatInteger(data.contracts.remessaRecords)} detail="base consolidada recebida" icon="contract" />
        <MetricCard label="Contratos LAI" value={formatInteger(data.contracts.laiRecords)} detail={formatCurrency(data.contracts.laiValueCents)} icon="database" tone="green" />
        <MetricCard label="Valor global Remessa" value={formatCompactCurrency(data.contracts.remessaGlobalValueCents)} detail="soma preservada da fonte" icon="payroll" tone="slate" />
        <MetricCard label="Precisam de revisão" value={formatInteger(data.contracts.needReview)} detail={`${data.contracts.divergences} divergências cadastrais`} icon="warning" tone="yellow" />
      </section>

      <Panel
        title="Carteira de instrumentos"
        description="Todos os registros publicados da Remessa e da última competência LAI, com busca, filtros e paginação"
        className="panel-flush"
      >
        <ContractsExplorer contracts={data.contracts.examples} />
      </Panel>

      <div className="content-grid equal">
        <Panel title="Princípio de evidência" description="Como o portal trata registros incompletos">
          <div className="notice-box info"><Icon name="shield" /><div><strong>Ausência de campo não vira irregularidade</strong><p>O sistema mantém o valor bruto, aponta a limitação e encaminha a decisão para revisão humana quando necessário.</p></div></div>
        </Panel>
        <Panel title="Cobertura da carteira" description="Bases atualmente comparáveis">
          <div className="kpi-strip">
            <div><span>Remessa</span><strong>{data.contracts.remessaRecords}</strong></div>
            <div><span>LAI</span><strong>{data.contracts.laiRecords}</strong></div>
            <div><span>PDFs</span><strong>{data.contracts.pdfCollected}</strong></div>
          </div>
        </Panel>
      </div>
    </>
  );
}
