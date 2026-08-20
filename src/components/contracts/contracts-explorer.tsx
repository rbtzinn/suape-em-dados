"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ContractSummary } from "@/domain/types";
import { formatCurrency } from "@/domain/format";

const PAGE_SIZE = 25;

function searchable(contract: ContractSummary): string {
  return [contract.id, contract.company, contract.object, contract.status, contract.analysis]
    .join(" ")
    .toLocaleLowerCase("pt-BR");
}

export function ContractsExplorer({ contracts }: { contracts: ContractSummary[] }) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("Todas");
  const [state, setState] = useState("Todas");
  const [page, setPage] = useState(1);
  const states = useMemo(
    () => [...new Set(contracts.map((contract) => contract.analysis))].sort(),
    [contracts],
  );
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return contracts.filter(
      (contract) =>
        (source === "Todas" || contract.source === source) &&
        (state === "Todas" || contract.analysis === state) &&
        (!normalizedQuery || searchable(contract).includes(normalizedQuery)),
    );
  }, [contracts, query, source, state]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      <div className="filter-toolbar" aria-label="Filtros da carteira">
        <label className="field filter-search">
          <span>Buscar instrumento, empresa ou objeto</span>
          <input
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="Digite para filtrar"
          />
        </label>
        <label className="field">
          <span>Origem</span>
          <select value={source} onChange={(event) => { setSource(event.target.value); setPage(1); }}>
            <option>Todas</option>
            <option>Remessa</option>
            <option>LAI</option>
          </select>
        </label>
        <label className="field">
          <span>Análise</span>
          <select value={state} onChange={(event) => { setState(event.target.value); setPage(1); }}>
            <option>Todas</option>
            {states.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="table-result-bar">
        <span>{filtered.length} de {contracts.length} registros</span>
        <span>Página {safePage} de {pages}</span>
      </div>
      <DataTable
        caption="Carteira completa de contratos"
        columns={[
          { key: "instrument", label: "Instrumento" },
          { key: "company", label: "Contratada" },
          { key: "value", label: "Valor global", align: "right", hideOnMobile: true },
          { key: "source", label: "Origem", hideOnMobile: true },
          { key: "status", label: "Análise" },
          { key: "open", label: "", align: "right" },
        ]}
        rows={visible.map((contract) => ({
          id: `${contract.source}:${contract.id}`,
          instrument: <div className="table-primary"><strong>{contract.id}</strong><span>{contract.object}</span></div>,
          company: contract.company,
          value: formatCurrency(contract.valueCents),
          source: <StatusBadge tone="info">{contract.source}</StatusBadge>,
          status: <StatusBadge>{contract.analysis}</StatusBadge>,
          open: <Link className="link-row" href={`/contratos/${encodeURIComponent(contract.id)}`}>Detalhes</Link>,
        }))}
      />
      <div className="pagination-controls" aria-label="Paginação da carteira">
        <button className="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</button>
        <button className="button" disabled={safePage === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>Próxima</button>
      </div>
    </>
  );
}
