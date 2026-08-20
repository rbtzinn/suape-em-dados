"use client";

import { useMemo, useState } from "react";

import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ReconciliationExample, Tone } from "@/domain/types";

const PAGE_SIZE = 25;

function tone(status: string): Tone {
  if (["Exata", "Forte"].includes(status)) return "success";
  if (["Provável", "Ambígua", "Divergência"].includes(status)) return "warning";
  return "neutral";
}

export function ReconciliationExplorer({ rows }: { rows: ReconciliationExample[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [page, setPage] = useState(1);
  const statuses = useMemo(
    () => [...new Set(rows.map((row) => row.status))].sort(),
    [rows],
  );
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return rows.filter((row) => {
      const content = [row.laiLabel, row.remessaLabel, row.company, ...row.reasons]
        .join(" ")
        .toLocaleLowerCase("pt-BR");
      return (status === "Todos" || row.status === status) && (!term || content.includes(term));
    });
  }, [query, rows, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      <div className="filter-toolbar filter-toolbar-compact">
        <label className="field filter-search">
          <span>Buscar contrato, instrumento ou empresa</span>
          <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Digite para filtrar" />
        </label>
        <label className="field">
          <span>Resultado</span>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option>Todos</option>
            {statuses.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>
      <div className="table-result-bar"><span>{filtered.length} de {rows.length} comparações</span><span>Página {safePage} de {pages}</span></div>
      <DataTable
        caption="Comparações reais entre Remessa e LAI"
        columns={[
          { key: "pair", label: "Par de registros" },
          { key: "score", label: "Score", align: "center" },
          { key: "reasons", label: "Razões", hideOnMobile: true },
          { key: "state", label: "Resultado" },
        ]}
        rows={visible.map((row) => ({
          id: row.id,
          pair: <div className="table-primary"><strong>{row.laiLabel} ↔ {row.remessaLabel}</strong><span>{row.company}</span></div>,
          score: row.score.toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
          reasons: row.reasons.length ? row.reasons.join(" · ") : "Nenhuma evidência suficiente",
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
