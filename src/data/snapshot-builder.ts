import { parseBoolean, parseInteger } from "@/domain/normalization";
import type {
  CommissionMatchSummary,
  ContractSummary,
  ImportSource,
  PayrollCategory,
  ReconciliationExample,
  SystemSnapshot,
  TravelExample,
} from "@/domain/types";
import type {
  CanonicalWorkbook,
  SheetRow,
} from "@/infra/google-sheets/repository";
import type { CanonicalSheetName } from "@/infra/google-sheets/schema";
import {
  cents,
  formatCompetence,
  formatPeriod,
  groupRows,
  latestRows,
  parseReasons,
  sum,
  unique,
} from "./snapshot-helpers";

export const SNAPSHOT_SHEETS = [
  "import_batches",
  "remessa_instruments",
  "lai_contracts",
  "contract_reviews",
  "outsourced",
  "payroll_events",
  "travel",
  "travel_rule_results",
  "data_quality_issues",
  "cpl_ordinances",
  "cpl_members",
  "cpl_fiscal_matches",
] as const satisfies readonly CanonicalSheetName[];

export function emptySnapshot(meta: SystemSnapshot["meta"]): SystemSnapshot {
  return {
    meta,
    contracts: {
      remessaRecords: 0,
      remessaGlobalValueCents: 0,
      laiRecords: 0,
      laiValueCents: 0,
      pdfCollected: 0,
      withoutPdf: 0,
      needReview: 0,
      managers: 0,
      inspectors: 0,
      bothConfirmed: 0,
      divergences: 0,
      examples: [],
    },
    reconciliation: {
      exact: 0,
      strong: 0,
      probable: 0,
      ambiguous: 0,
      divergence: 0,
      onlyLai: 0,
      onlyRemessa: 0,
      examples: [],
    },
    outsourced: {
      series: [],
      latestPeople: 0,
      latestCompanies: 0,
      latestContracts: 0,
      nightShift: 0,
      qualityNotice: "Nenhum snapshot publicado.",
    },
    payroll: {
      competence: "Sem competência",
      people: 0,
      proceedsCents: 0,
      discountsCents: 0,
      netCents: 0,
      categories: [],
    },
    travel: {
      competence: "Sem competência",
      records: 0,
      ticketsCents: 0,
      dailyCents: 0,
      totalCents: 0,
      destinations: 0,
      examples: [],
    },
    commissions: {
      ordinances: 0,
      members: 0,
      presidents: 0,
      matchedPeople: 0,
      ok: 0,
      attention: 0,
      review: 0,
      potentialConflict: 0,
      examples: [],
      byCommission: [],
    },
    imports: [],
  };
}

function publishedRows(
  workbook: CanonicalWorkbook,
  name: CanonicalSheetName,
  published: Set<string>,
): SheetRow[] {
  return (workbook[name] ?? []).filter(
    (row) => !row.import_batch_id || published.has(row.import_batch_id),
  );
}

function contractRows(rows: SheetRow[], source: "Remessa" | "LAI"): ContractSummary[] {
  return rows.map((row, index) => {
    const sourceId = row.instrument_id || row.contract_number || row.record_id || String(index + 1);
    const managerConfirmed = parseBoolean(row.manager_confirmed);
    const inspectorConfirmed = parseBoolean(row.inspector_confirmed);
    return {
      id: source === "LAI" ? `LAI:${sourceId}` : sourceId,
      company: row.company_name || row.party_raw || "Contratada não informada",
      object: row.object || "Objeto não informado",
      status: row.stage || row.status_raw || row.status || "Não informado",
      valueCents: cents(row, "global_value_cents"),
      source,
      manager:
        managerConfirmed === true || Boolean(row.manager_name)
          ? "Confirmado"
          : "Não informado",
      inspector:
        inspectorConfirmed === true || Boolean(row.inspector_name)
          ? "Confirmado"
          : "Não informado",
      analysis:
        row.analysis_status ||
        (parseBoolean(row.needs_review) ? "Revisão necessária" : row.status_raw) ||
        "Mapeado",
    };
  });
}

const MATCH_LABELS: Record<string, string> = {
  MATCH_EXATO: "Exata",
  MATCH_FORTE: "Forte",
  MATCH_PROVAVEL: "Provável",
  MATCH_AMBIGUO: "Ambígua",
  DIVERGENCIA: "Divergência",
  SOMENTE_LAI: "Somente LAI",
  SOMENTE_REMESSA: "Somente Remessa",
};

function reconciliationExamples(
  reviews: SheetRow[],
  remessa: SheetRow[],
  lai: SheetRow[],
): ReconciliationExample[] {
  const remessaById = new Map(remessa.map((row) => [row.record_id, row]));
  const laiById = new Map(lai.map((row) => [row.record_id, row]));
  return reviews.map((review) => {
    const remessaRow = remessaById.get(review.remessa_record_id);
    const laiRow = laiById.get(review.lai_record_id);
    return {
      id: review.review_id,
      laiLabel: laiRow?.contract_number || "Sem registro LAI",
      remessaLabel:
        remessaRow?.instrument_id || remessaRow?.contract_number || "Sem candidato Remessa",
      company:
        laiRow?.company_name || remessaRow?.company_name || "Contratada não informada",
      score: Number(review.match_score || 0),
      reasons: parseReasons(review.match_reasons_json),
      status: MATCH_LABELS[review.match_status] || review.match_status || "Não classificado",
    };
  });
}

function payrollLabel(sheet: string): string {
  const normalized = sheet.toUpperCase();
  if (normalized.startsWith("FUNCIONÁRIO")) return "Funcionários";
  if (normalized.startsWith("COMISSIONADOS")) return "Comissionados";
  if (normalized.startsWith("CEDIDOS")) return "Cedidos";
  if (normalized.startsWith("CONSELHO ADM")) return "Conselho de Administração";
  if (normalized.startsWith("CONSELHO FISCAL")) return "Conselho Fiscal";
  if (normalized.startsWith("COMITE DE AUD")) return "Comitê de Auditoria";
  return sheet || "Não informado";
}

function payrollCategories(rows: SheetRow[]): PayrollCategory[] {
  return [...groupRows(rows, "source_sheet")]
    .map(([sheet, events]) => {
      const proceeds = events.filter((row) => row.event_type.toUpperCase() === "P");
      const discounts = events.filter((row) => row.event_type.toUpperCase() === "D");
      return {
        category: payrollLabel(sheet),
        people: unique(events, "person_hash"),
        netCents: sum(proceeds, "amount_cents") - sum(discounts, "amount_cents"),
      };
    })
    .sort((left, right) => right.netCents - left.netCents);
}

function travelStatus(results: SheetRow[]): string {
  const statuses = new Set(results.map((row) => row.status));
  if (statuses.has("INDICIO_NAO_CONFORMIDADE")) return "Indício para revisão";
  if (statuses.has("REVISAO_NECESSARIA")) return "Revisão necessária";
  if (statuses.has("NAO_VERIFICAVEL_COM_DADOS_LAI")) {
    return "Não verificável com dados LAI";
  }
  return "Conforme nos campos verificáveis";
}

function travelExamples(rows: SheetRow[], results: SheetRow[]): TravelExample[] {
  const byRecord = groupRows(results, "travel_record_id");
  return rows.map((row, index) => ({
    id: `VG-${row.competence}-${String(row.source_row || index + 1).padStart(3, "0")}`,
    route: `${row.origin_city || row.origin_state || "Origem não informada"} → ${
      row.destination_city || row.destination_state || "Destino não informado"
    }`,
    period: formatPeriod(row.departure_date, row.return_date),
    purpose: row.purpose || row.motivation || "Finalidade não informada",
    totalCents: cents(row, "trip_total_cents"),
    status: travelStatus(byRecord.get(row.record_id) ?? []),
  }));
}

const CPL_LABELS: Record<string, string> = {
  OK: "OK",
  ATENCAO: "Atenção",
  POTENCIAL_CONFLITO: "Potencial conflito",
  REVISAO_NECESSARIA: "Revisão necessária",
};

function commissionExamples(rows: SheetRow[]): CommissionMatchSummary[] {
  return rows.map((row) => ({
    id: row.match_id,
    person: row.person_name || "Pessoa não informada",
    commission: row.commission_name || "Comissão não informada",
    commissionRole: row.commission_role || "Membro",
    instrument: row.instrument_id || row.contract_number || "Sem correspondência no Remessa",
    contractRole: row.contract_role || "Sem papel contratual correspondente",
    score: Number(row.person_match_score || 0),
    status: CPL_LABELS[row.decision] || row.decision || "Não classificado",
    reasons: parseReasons(row.match_reasons_json),
    validity: row.contract_validity_raw || "Vigência não aplicável",
  }));
}

const MODULE_LABELS: Record<string, string> = {
  REMESSA: "Contratos · Remessa",
  LAI: "Contratos · LAI",
  OUTSOURCED: "Terceirizados",
  PAYROLL: "Folha",
  TRAVEL: "Viagens",
  TRAVEL_POLICY: "Normativo",
  REMESSA_REFERENCE: "Documento de referência",
  CPL: "CPL",
};

function importSources(batches: SheetRow[], issues: SheetRow[]): ImportSource[] {
  const issueCounts = new Map<string, number>();
  for (const issue of issues) {
    if (issue.status !== "RESOLVED") {
      issueCounts.set(
        issue.import_batch_id,
        (issueCounts.get(issue.import_batch_id) ?? 0) + 1,
      );
    }
  }
  return batches.map((batch) => {
    let state: ImportSource["state"] = "Mapeado";
    if (batch.status === "FAILED" || (issueCounts.get(batch.batch_id) ?? 0) > 0) {
      state = "Requer revisão";
    } else if (batch.status === "PUBLISHED" && Number(batch.record_count || 0) > 0) {
      state = "Pronto";
    }
    return {
      name: batch.source_file,
      competence: formatCompetence(batch.competence),
      type: MODULE_LABELS[batch.module] || batch.module || "Fonte",
      records: parseInteger(batch.record_count),
      state,
    };
  });
}

function updatedLabel(batches: SheetRow[]): string {
  const value = batches.map((row) => row.imported_at).filter(Boolean).sort().at(-1);
  if (!value) return "Sem data de atualização";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : `Base atualizada em ${new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Recife",
      }).format(date)}`;
}

export function buildFromWorkbook(workbook: CanonicalWorkbook): SystemSnapshot {
  const batches = (workbook.import_batches ?? []).filter(
    (row) => row.status === "PUBLISHED",
  );
  const published = new Set(batches.map((row) => row.batch_id));
  const remessa = latestRows(publishedRows(workbook, "remessa_instruments", published));
  const lai = latestRows(publishedRows(workbook, "lai_contracts", published));
  const reviewHistory = publishedRows(workbook, "contract_reviews", published);
  const latestRunId = reviewHistory
    .filter((row) => row.reconciliation_run_id)
    .sort((left, right) => left.generated_at.localeCompare(right.generated_at))
    .at(-1)?.reconciliation_run_id;
  const reviews = latestRunId
    ? reviewHistory.filter((row) => row.reconciliation_run_id === latestRunId)
    : reviewHistory;
  const outsourced = publishedRows(workbook, "outsourced", published);
  const payroll = latestRows(publishedRows(workbook, "payroll_events", published));
  const quality = publishedRows(workbook, "data_quality_issues", published);
  const excludedTravel = new Set(
    quality
      .filter((row) => row.rule_code === "TRAVEL_APOS_COMPETENCIA_ARQUIVO")
      .map((row) => row.record_id),
  );
  const travel = latestRows(
    publishedRows(workbook, "travel", published).filter(
      (row) => !excludedTravel.has(row.record_id),
    ),
  );
  const travelResults = publishedRows(workbook, "travel_rule_results", published);
  const ordinances = publishedRows(workbook, "cpl_ordinances", published);
  const members = publishedRows(workbook, "cpl_members", published);
  const matchHistory = workbook.cpl_fiscal_matches ?? [];
  const latestCplRun = matchHistory
    .filter((row) => row.match_run_id)
    .sort((left, right) => left.generated_at.localeCompare(right.generated_at))
    .at(-1)?.match_run_id;
  const cplMatches = latestCplRun
    ? matchHistory.filter((row) => row.match_run_id === latestCplRun)
    : matchHistory;
  const snapshot = emptySnapshot({
    mode: "sheets",
    updatedAt: updatedLabel(batches),
    notice: "Dados publicados da base canônica privada no Google Sheets.",
  });

  snapshot.contracts = {
    remessaRecords: remessa.length,
    remessaGlobalValueCents: sum(remessa, "global_value_cents"),
    laiRecords: lai.length,
    laiValueCents: sum(lai, "global_value_cents"),
    pdfCollected: remessa.filter((row) => parseBoolean(row.main_pdf_available) === true).length,
    withoutPdf: remessa.filter((row) => parseBoolean(row.main_pdf_available) !== true).length,
    needReview: remessa.filter((row) => parseBoolean(row.needs_review) === true).length,
    managers: remessa.filter((row) => parseBoolean(row.manager_confirmed) === true).length,
    inspectors: remessa.filter((row) => parseBoolean(row.inspector_confirmed) === true).length,
    bothConfirmed: remessa.filter(
      (row) =>
        parseBoolean(row.manager_confirmed) === true &&
        parseBoolean(row.inspector_confirmed) === true,
    ).length,
    divergences: remessa.filter((row) => parseBoolean(row.portal_divergence) === true).length,
    examples: [...contractRows(remessa, "Remessa"), ...contractRows(lai, "LAI")],
  };

  const count = (status: string) => reviews.filter((row) => row.match_status === status).length;
  snapshot.reconciliation = {
    exact: count("MATCH_EXATO"),
    strong: count("MATCH_FORTE"),
    probable: count("MATCH_PROVAVEL"),
    ambiguous: count("MATCH_AMBIGUO"),
    divergence: count("DIVERGENCIA"),
    onlyLai: count("SOMENTE_LAI"),
    onlyRemessa: count("SOMENTE_REMESSA"),
    examples: reconciliationExamples(reviews, remessa, lai),
  };

  const outsourcedGroups = groupRows(outsourced, "competence");
  snapshot.outsourced.series = [...outsourcedGroups]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([competence, rows]) => ({
      month: formatCompetence(competence),
      people: rows.length,
      costCents: sum(rows, "monthly_cost_cents"),
      remunerationCents: sum(rows, "monthly_remuneration_cents"),
    }));
  const latestOutsourced = [...outsourcedGroups.entries()].sort(([a], [b]) => a.localeCompare(b)).at(-1)?.[1] ?? [];
  snapshot.outsourced.latestPeople = latestOutsourced.length;
  snapshot.outsourced.latestCompanies = unique(latestOutsourced, "company_name");
  snapshot.outsourced.latestContracts = unique(latestOutsourced, "contract_number");
  snapshot.outsourced.nightShift = latestOutsourced.filter(
    (row) => parseBoolean(row.night_shift) === true,
  ).length;
  snapshot.outsourced.qualityNotice = `${quality.filter((row) => row.module === "OUTSOURCED").length} apontamentos preservados para validação semântica; nenhum valor foi corrigido silenciosamente.`;

  const proceeds = payroll.filter((row) => row.event_type.toUpperCase() === "P");
  const discounts = payroll.filter((row) => row.event_type.toUpperCase() === "D");
  snapshot.payroll = {
    competence: formatCompetence(payroll[0]?.competence || ""),
    people: unique(payroll, "person_hash"),
    proceedsCents: sum(proceeds, "amount_cents"),
    discountsCents: sum(discounts, "amount_cents"),
    netCents: sum(proceeds, "amount_cents") - sum(discounts, "amount_cents"),
    categories: payrollCategories(payroll),
  };

  snapshot.travel = {
    competence: formatCompetence(travel[0]?.competence || ""),
    records: travel.length,
    ticketsCents: sum(travel, "ticket_total_cents"),
    dailyCents: sum(travel, "daily_total_cents"),
    totalCents: sum(travel, "trip_total_cents"),
    destinations: unique(travel, "destination_city"),
    examples: travelExamples(travel, travelResults),
  };
  const ordinanceById = new Map(ordinances.map((row) => [row.ordinance_id, row]));
  const commissionGroups = groupRows(
    members.map((row) => ({
      ...row,
      commission_name: ordinanceById.get(row.ordinance_id)?.commission_name ?? "Não informada",
    })),
    "commission_name",
  );
  snapshot.commissions = {
    ordinances: ordinances.length,
    members: members.length,
    presidents: members.filter((row) => row.commission_role === "PRESIDENTE").length,
    matchedPeople: unique(
      cplMatches.filter((row) => Boolean(row.remessa_record_id)),
      "cpl_assignment_id",
    ),
    ok: cplMatches.filter((row) => row.decision === "OK").length,
    attention: cplMatches.filter((row) => row.decision === "ATENCAO").length,
    review: cplMatches.filter((row) => row.decision === "REVISAO_NECESSARIA").length,
    potentialConflict: cplMatches.filter((row) => row.decision === "POTENCIAL_CONFLITO").length,
    examples: commissionExamples(cplMatches),
    byCommission: [...commissionGroups].map(([commission, commissionMembers]) => ({
      commission,
      members: commissionMembers.length,
      attention: cplMatches.filter(
        (row) => row.commission_name === commission && row.decision === "ATENCAO",
      ).length,
      review: cplMatches.filter(
        (row) => row.commission_name === commission && row.decision === "REVISAO_NECESSARIA",
      ).length,
    })),
  };
  snapshot.imports = importSources(batches, quality);
  return snapshot;
}
