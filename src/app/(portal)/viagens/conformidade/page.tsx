import type { Metadata } from "next";

import { DataTable } from "@/components/tables/data-table";
import { Icon } from "@/components/ui/icon";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { evaluateTravelPolicy } from "@/domain/travel-policy";

export const metadata: Metadata = { title: "Conformidade de viagens" };

export default function TravelCompliancePage() {
  const findings = evaluateTravelPolicy({
    destinationState: "PE",
    destinationCountry: "Brasil",
    departureDate: "2026-07-08",
    returnDate: "2026-07-10",
    fullDailyQuantity: 2,
    partialDailyQuantity: 0,
    dailyUnitCents: 38_201,
    roleGroup: "OTHER",
  });
  const conforming = findings.filter((item) => item.status === "CONFORME").length;
  const unverifiable = findings.filter((item) => item.status === "NAO_VERIFICAVEL_COM_DADOS_LAI").length;
  const review = findings.filter((item) => ["ATENCAO", "REVISAO_NECESSARIA"].includes(item.status)).length;

  return (
    <>
      <PageHeader eyebrow="Política de viagens · v001 · 25/09/2025" title="Conformidade de viagens" description="Motor de regras com resultado explicável. Sinais orientam revisão e nunca substituem a análise documental." />
      <section className="metrics-grid">
        <MetricCard label="Regras avaliadas" value={String(findings.length)} detail="amostra da política codificada" icon="shield" />
        <MetricCard label="Conformes" value={String(conforming)} detail="nos campos disponíveis" icon="check" tone="green" />
        <MetricCard label="Não verificáveis" value={String(unverifiable)} detail="dependem de fonte complementar" icon="file" tone="slate" />
        <MetricCard label="Para revisão" value={String(review)} detail="atenção ou revisão necessária" icon="warning" tone="yellow" />
      </section>

      <div className="notice-box info" style={{ marginBottom: 17 }}><Icon name="shield" /><div><strong>Regra de interpretação</strong><p>Campo ausente gera “não verificável com dados LAI”, nunca “indício de não conformidade”. Exceções e justificativas devem ser analisadas no processo.</p></div></div>

      <div className="content-grid wide-right">
        <Panel title="Regras centrais mapeadas" description="Síntese operacional do normativo">
          <div className="policy-list">
            <div className="policy-row"><span className="policy-number">01</span><div className="policy-copy"><strong>Antecedência</strong><span>5 dias úteis para diárias; preferências maiores conforme o caso</span></div></div>
            <div className="policy-row"><span className="policy-number">02</span><div className="policy-copy"><strong>Três opções de voo</strong><span>Justificar escolha que não seja a menor tarifa</span></div></div>
            <div className="policy-row"><span className="policy-number">03</span><div className="policy-copy"><strong>Diária em PE</strong><span>Somente com pernoite</span></div></div>
            <div className="policy-row"><span className="policy-number">04</span><div className="policy-copy"><strong>Prestação de contas</strong><span>Até 10 dias úteis após o retorno</span></div></div>
            <div className="policy-row"><span className="policy-number">05</span><div className="policy-copy"><strong>Devolução</strong><span>72 horas em cancelamento ou retorno antecipado</span></div></div>
          </div>
        </Panel>
        <Panel title="Execução explicada" description="Amostra de avaliação com dados disponíveis" className="panel-flush">
          <DataTable
            caption="Resultado das regras de viagem"
            columns={[{ key: "rule", label: "Regra" }, { key: "reason", label: "Justificativa", hideOnMobile: true }, { key: "state", label: "Resultado" }]}
            rows={findings.map((item) => ({ id: item.ruleId, rule: <div className="table-primary"><strong>{item.title}</strong><span>{item.ruleId}</span></div>, reason: item.reason, state: <StatusBadge>{item.status.replaceAll("_", " ")}</StatusBadge> }))}
          />
        </Panel>
      </div>
    </>
  );
}
