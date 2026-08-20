import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSystemSnapshot } from "@/data/system";
import { formatCurrency } from "@/domain/format";

export const metadata: Metadata = { title: "Detalhe do contrato" };

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, data] = await Promise.all([params, getSystemSnapshot()]);
  const decodedId = decodeURIComponent(id);
  const contract = data.contracts.examples.find((item) => item.id === decodedId);
  if (!contract) notFound();

  return (
    <>
      <div className="page-actions" style={{ marginBottom: 14 }}><Link className="button" href="/contratos">← Voltar à carteira</Link></div>
      <section className="detail-hero">
        <div>
          <span className="eyebrow">Instrumento {contract.id}</span>
          <h1>{contract.company}</h1>
          <p>{contract.object}</p>
        </div>
        <div className="detail-value"><span>Valor global</span><strong>{formatCurrency(contract.valueCents)}</strong><StatusBadge>{contract.status}</StatusBadge></div>
      </section>

      <div className="content-grid">
        <Panel title="Dados consolidados" description="Atributos normalizados sem apagar o valor original">
          <dl className="definition-grid">
            <div><dt>ID do instrumento</dt><dd>{contract.id}</dd></div>
            <div><dt>Origem predominante</dt><dd><StatusBadge tone="info">{contract.source}</StatusBadge></dd></div>
            <div><dt>Gestor</dt><dd>{contract.manager}</dd></div>
            <div><dt>Fiscal</dt><dd>{contract.inspector}</dd></div>
            <div><dt>Situação</dt><dd>{contract.status}</dd></div>
            <div><dt>Resultado da análise</dt><dd><StatusBadge>{contract.analysis}</StatusBadge></dd></div>
          </dl>
        </Panel>
        <Panel title="Trilha da evidência" description="Eventos imutáveis por importação">
          <div className="timeline">
            <div className="timeline-item"><strong>Fonte registrada</strong><span>competência e arquivo preservados</span><p>O hash da linha permite identificar a evidência importada.</p></div>
            <div className="timeline-item"><strong>Normalização aplicada</strong><span>campos textuais e valores</span><p>O dado bruto permanece disponível no raw_json.</p></div>
            <div className="timeline-item"><strong>Análise classificada</strong><span>{contract.analysis}</span><p>Qualquer decisão manual é registrada com ator e horário.</p></div>
          </div>
        </Panel>
      </div>

      <div className="content-grid equal">
        <Panel title="Documentos e responsáveis" description="Estado cadastral do instrumento">
          <div className="progress-list">
            <div className="notice-box info"><Icon name="file" /><div><strong>Documento principal</strong><p>{contract.analysis === "Sem PDF principal" ? "Não localizado na fonte consolidada." : "Disponível ou em validação na base Remessa."}</p></div></div>
            <div className="notice-box"><Icon name="warning" /><div><strong>Interpretação controlada</strong><p>Os dados canônicos facilitam a análise, mas não substituem a consulta ao processo administrativo e aos documentos oficiais.</p></div></div>
          </div>
        </Panel>
        <Panel title="Proveniência" description="Referência mínima exigida em cada linha">
          <dl className="definition-grid">
            <div><dt>Fonte</dt><dd>{contract.source}</dd></div>
            <div><dt>Competência</dt><dd>Conforme arquivo de origem</dd></div>
            <div><dt>Linha</dt><dd>Registrada na importação</dd></div>
            <div><dt>Hash</dt><dd>SHA-256 por registro</dd></div>
          </dl>
        </Panel>
      </div>
    </>
  );
}
