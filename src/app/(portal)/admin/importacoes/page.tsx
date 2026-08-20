import type { Metadata } from "next";

import { BootstrapSheetsButton } from "@/components/admin/bootstrap-sheets-button";
import { ImportSourceForm } from "@/components/admin/import-source-form";
import { Icon } from "@/components/ui/icon";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SourceBanner } from "@/components/ui/source-banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSystemSnapshot } from "@/data/system";
import { CANONICAL_SHEET_NAMES } from "@/infra/google-sheets/schema";

export const metadata: Metadata = { title: "Importações" };

export default async function ImportsPage() {
  const data = await getSystemSnapshot();
  const ready = data.imports.filter((item) => item.state === "Pronto").length;
  const review = data.imports.filter((item) => item.state === "Requer revisão").length;
  return (
    <>
      <PageHeader eyebrow="Administração" title="Importações e fontes" description="Controle de lotes, hashes, competência e proveniência. Uma nova carga acrescenta histórico em vez de apagar o mês anterior." />
      <SourceBanner meta={data.meta} />
      <Panel title="Entrada da base geral" description="Anexe LAI, Remessa ou portaria em PDF; o importador preserva o conteúdo bruto e publica a camada normalizada">
        <ImportSourceForm />
      </Panel>
      <section className="metrics-grid">
        <MetricCard label="Fontes mapeadas" value={String(data.imports.length)} detail="planilhas e normativos recebidos" icon="file" />
        <MetricCard label="Prontas" value={String(ready)} detail="estrutura reconhecida" icon="check" tone="green" />
        <MetricCard label="Requerem revisão" value={String(review)} detail="qualidade ou semântica da fonte" icon="warning" tone="yellow" />
        <MetricCard label="Abas canônicas" value={String(CANONICAL_SHEET_NAMES.length)} detail="base gratuita no Google Sheets" icon="database" tone="slate" />
      </section>

      <Panel title="Fontes recebidas" description="Os arquivos originais ficam fora do repositório e não são alterados" className="panel-spaced">
        <div className="import-list">
          {data.imports.map((source) => (
            <div className="import-row" key={source.name}>
              <span className="import-icon"><Icon name={source.type === "Normativo" ? "shield" : "file"} /></span>
              <div className="import-name"><strong>{source.name}</strong><span>{source.type}</span></div>
              <div className="import-cell"><span>Competência</span><strong>{source.competence}</strong></div>
              <div className="import-cell"><span>Registros</span><strong>{source.records ?? "—"}</strong></div>
              <StatusBadge>{source.state}</StatusBadge>
            </div>
          ))}
        </div>
      </Panel>

      <div className="content-grid equal">
        <Panel title="Estrutura do Google Sheets" description="Abas protegidas pela conta de serviço">
          <div className="sheet-schema">
            {CANONICAL_SHEET_NAMES.map((name) => <span className="schema-pill" key={name}>{name}</span>)}
          </div>
          <div style={{ marginTop: 17 }}><BootstrapSheetsButton /></div>
        </Panel>
        <Panel title="Pipeline de uma carga" description="Etapas determinísticas e auditáveis">
          <div className="timeline">
            <div className="timeline-item"><strong>1. Receber e identificar</strong><span>arquivo, competência e SHA-256</span><p>Lotes repetidos são bloqueados por idempotência.</p></div>
            <div className="timeline-item"><strong>2. Validar e normalizar</strong><span>schema específico por módulo</span><p>Erros não apagam o valor bruto.</p></div>
            <div className="timeline-item"><strong>3. Acrescentar snapshot</strong><span>append-only no Google Sheets</span><p>Histórico por competência permanece consultável.</p></div>
            <div className="timeline-item"><strong>4. Registrar auditoria</strong><span>ator, horário, ação e resultado</span><p>Rollback lógico referencia o lote sem destruir linhas.</p></div>
          </div>
        </Panel>
      </div>

      <div className="notice-box" style={{ marginTop: 17 }}><Icon name="warning" /><div><strong>Cruzamento CPL × Remessa</strong><p>Coincidências de nome, papel e vigência geram atenção ou revisão humana. Ser membro de comissão, isoladamente, não é classificado como conflito.</p></div></div>
    </>
  );
}
