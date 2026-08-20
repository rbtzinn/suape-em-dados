import type { Metadata } from "next";

import { ReconciliationExplorer } from "@/components/contracts/reconciliation-explorer";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSystemSnapshot } from "@/data/system";

export const metadata: Metadata = { title: "Remessa × LAI" };

export default async function ReconciliationPage() {
  const data = await getSystemSnapshot();
  const match = data.reconciliation;
  return (
    <>
      <PageHeader eyebrow="Saneamento assistido" title="Remessa × LAI" description="Conciliação explicável entre as fontes. Correspondências prováveis ou concorrentes nunca são aceitas silenciosamente." />
      <div className="notice-box info" style={{ marginBottom: 17 }}><Icon name="shield" /><div><strong>Resultado preliminar da heurística</strong><p>Os totais abaixo servem para triagem. O vínculo definitivo exige revisão quando a chave do instrumento não é idêntica.</p></div></div>
      <Panel title="Resultado da conciliação" description="Classificação pela força das evidências">
        <div className="match-grid">
          <div className="match-card match-good"><span>Exatas</span><strong>{match.exact}</strong></div>
          <div className="match-card match-good"><span>Fortes</span><strong>{match.strong}</strong></div>
          <div className="match-card match-review"><span>Prováveis</span><strong>{match.probable}</strong></div>
          <div className="match-card match-review"><span>Ambíguas</span><strong>{match.ambiguous}</strong></div>
          <div className="match-card match-review"><span>Divergências</span><strong>{match.divergence}</strong></div>
          <div className="match-card"><span>Somente LAI</span><strong>{match.onlyLai}</strong></div>
          <div className="match-card"><span>Somente Remessa</span><strong>{match.onlyRemessa}</strong></div>
        </div>
      </Panel>

      <div className="content-grid wide-right">
        <Panel title="Como o score é formado" description="Razões ficam visíveis para o analista">
          <div className="policy-list">
            <div className="policy-row"><span className="policy-number">+90</span><div className="policy-copy"><strong>ID do instrumento idêntico</strong><span>Chave preferencial da Remessa</span></div><StatusBadge tone="success">Exata</StatusBadge></div>
            <div className="policy-row"><span className="policy-number">+45</span><div className="policy-copy"><strong>Número do contrato</strong><span>Após normalização controlada</span></div><StatusBadge tone="info">Evidência</StatusBadge></div>
            <div className="policy-row"><span className="policy-number">+30</span><div className="policy-copy"><strong>CNPJ idêntico</strong><span>Somente 14 dígitos válidos</span></div><StatusBadge tone="info">Evidência</StatusBadge></div>
            <div className="policy-row"><span className="policy-number">+20</span><div className="policy-copy"><strong>Razão social</strong><span>Texto normalizado</span></div><StatusBadge tone="warning">Apoio</StatusBadge></div>
          </div>
        </Panel>
        <Panel title="Fila de revisão" description="Todas as comparações geradas pela carga publicada, com razões explicáveis" className="panel-flush">
          <ReconciliationExplorer rows={match.examples} />
        </Panel>
      </div>
    </>
  );
}
