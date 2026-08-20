"use client";

import { useMemo, useState } from "react";

import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CommissionMatchSummary, Tone } from "@/domain/types";

const PAGE_SIZE = 20;

function tone(status: string): Tone {
  if (status === "OK") return "success";
  if (status === "Potencial conflito") return "danger";
  if (status === "Atenção") return "warning";
  return "neutral";
}

export function CommissionMatchesExplorer({ rows }: { rows: CommissionMatchSummary[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [page, setPage] = useState(1);
  const statuses = useMemo(() => [...new Set(rows.map((row) => row.status))].sort(), [rows]);
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return rows.filter((row) => {
      const searchable = [
        row.person,
        row.commission,
        row.commissionRole,
        row.instrument,
        row.contractRole,
        ...row.reasons,
      ].join(" ").toLocaleLowerCase("pt-BR");
      return (status === "Todos" || row.status === status) && (!term || searchable.includes(term));
    });
  }, [query, rows, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      <div className="filter-toolbar filter-toolbar-compact">
        <label className="field filter-search">
          <span>Buscar membro, comissão ou instrumento</span>
          <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Digite para filtrar" />
        </label>
        <label className="field">
          <span>Classificação</span>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option>Todos</option>
            {statuses.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>
      <div className="table-result-bar"><span>{filtered.length} de {rows.length} resultados</span><span>Página {safePage} de {pages}</span></div>
      <DataTable
        caption="Cruzamento de membros de comissões com responsáveis contratuais do Remessa"
        columns={[
          { key: "person", label: "Membro e comissão" },
          { key: "instrument", label: "Instrumento e papel" },
          { key: "evidence", label: "Evidência", hideOnMobile: true },
          { key: "score", label: "Score", align: "center", hideOnMobile: true },
          { key: "state", label: "Classificação" },
        ]}
        rows={visible.map((row) => ({
          id: row.id,
          person: <div className="table-primary"><strong>{row.person}</strong><span>{row.commissionRole} · {row.commission}</span></div>,
          instrument: <div className="table-primary"><strong>{row.instrument}</strong><span>{row.contractRole}</span></div>,
          evidence: row.reasons.join(" · "),
          score: row.score,
          state: <StatusBadge tone={tone(row.status)}>{row.status}</StatusBadge>,
        }))}
      />
      <div className="pagination-controls">
        <button className="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</button>
        <button className="button" disabled={safePage === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>Próxima</button>
      </div>
    </>
  );
}
