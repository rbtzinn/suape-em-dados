import "server-only";

import { randomUUID } from "node:crypto";

import {
  reconcileCplAssignments,
  type CplAssignmentRecord,
  type CplRemessaRecord,
} from "@/domain/cpl-reconciliation";
import { normalizeIdentifier, safeJson } from "@/domain/normalization";
import {
  sheetsRepository,
  type CanonicalWriteRow,
  type SheetRow,
} from "@/infra/google-sheets/repository";
import { stableId } from "./common";

const CHUNK_SIZE = 180;

function latestCompetence(rows: SheetRow[]): string {
  return rows.map((row) => row.competence).filter(Boolean).sort().at(-1) ?? "";
}

function assignments(rows: SheetRow[]): CplAssignmentRecord[] {
  return rows.map((row) => ({
    assignmentId: row.assignment_id,
    ordinanceId: row.ordinance_id,
    personName: row.person_name,
    commissionName: "",
    commissionRole: row.commission_role,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
  }));
}

function remessaRecords(rows: SheetRow[]): CplRemessaRecord[] {
  return rows.map((row) => ({
    recordId: row.record_id,
    instrumentId: row.instrument_id,
    contractNumber: row.contract_number,
    managerName: row.manager_name,
    inspectorName: row.inspector_name,
    responsibleName: row.remessa_responsible_raw,
    validityRaw: row.validity_raw,
    object: row.object,
    importBatchId: row.import_batch_id,
  }));
}

async function appendRows(rows: CanonicalWriteRow[]): Promise<void> {
  for (let index = 0; index < rows.length; index += CHUNK_SIZE) {
    await sheetsRepository.appendCanonicalRows(
      "cpl_fiscal_matches",
      rows.slice(index, index + CHUNK_SIZE),
    );
  }
}

export async function refreshCplMatches(): Promise<{
  runId: string;
  rows: number;
  attention: number;
  review: number;
}> {
  const workbook = await sheetsRepository.readSelected(
    ["import_batches", "cpl_ordinances", "cpl_members", "cpl_contract_links", "remessa_instruments"],
    true,
  );
  const batches = (workbook.import_batches ?? []).filter((row) => row.status === "PUBLISHED");
  const published = new Set(batches.map((row) => row.batch_id));
  const ordinanceRows = (workbook.cpl_ordinances ?? []).filter((row) =>
    published.has(row.import_batch_id),
  );
  const ordinanceById = new Map(ordinanceRows.map((row) => [row.ordinance_id, row]));
  const memberRows = (workbook.cpl_members ?? []).filter((row) =>
    published.has(row.import_batch_id),
  );
  const assignmentRows = assignments(memberRows).map((assignment) => ({
    ...assignment,
    commissionName: ordinanceById.get(assignment.ordinanceId)?.commission_name ?? "",
  }));
  const allRemessa = (workbook.remessa_instruments ?? []).filter((row) =>
    published.has(row.import_batch_id),
  );
  const competence = latestCompetence(allRemessa);
  const currentRemessa = allRemessa.filter((row) => row.competence === competence);
  if (assignmentRows.length === 0 || currentRemessa.length === 0) {
    return { runId: "", rows: 0, attention: 0, review: 0 };
  }

  const contractByNumber = new Map<string, string[]>();
  for (const row of currentRemessa) {
    const key = normalizeIdentifier(row.contract_number);
    if (key) contractByNumber.set(key, [...(contractByNumber.get(key) ?? []), row.record_id]);
  }
  const linked = new Set<string>();
  const incompatible = new Set<string>();
  for (const link of workbook.cpl_contract_links ?? []) {
    if (!published.has(link.import_batch_id)) continue;
    const ids = contractByNumber.get(normalizeIdentifier(link.contract_number)) ?? [];
    ids.forEach((id) => linked.add(id));
    if (link.relationship_type === "INCOMPATIBILITY_EVIDENCE") {
      ids.forEach((id) => incompatible.add(id));
    }
  }

  const generatedAt = new Date().toISOString();
  const runId = randomUUID();
  const cplBatchIds = [...new Set(memberRows.map((row) => row.import_batch_id))].sort();
  const remessaBatchIds = [...new Set(currentRemessa.map((row) => row.import_batch_id))].sort();
  const results = reconcileCplAssignments(
    assignmentRows,
    remessaRecords(currentRemessa),
    { linkedContractIds: linked, incompatibilityEvidenceIds: incompatible },
  );
  const rows: CanonicalWriteRow[] = results.map((result) => ({
    match_id: stableId(
      "cplmatch",
      runId,
      result.assignment.assignmentId,
      result.remessa?.recordId ?? "SEM_CORRESPONDENCIA",
    ),
    cpl_assignment_id: result.assignment.assignmentId,
    remessa_record_id: result.remessa?.recordId ?? "",
    contract_number: result.remessa?.contractNumber ?? "",
    person_match_score: result.score,
    match_status: result.matchStatus,
    match_reasons_json: safeJson({ reasons: result.reasons }),
    decision: result.classification,
    reviewed_by: "",
    reviewed_at: "",
    notes: "Classificação automática conservadora; decisão final depende de revisão humana e evidência documental.",
    person_name: result.assignment.personName,
    commission_name: result.assignment.commissionName,
    commission_role: result.assignment.commissionRole,
    contract_role: result.contractRole,
    ordinance_id: result.assignment.ordinanceId,
    instrument_id: result.remessa?.instrumentId ?? "",
    contract_validity_raw: result.remessa?.validityRaw ?? "",
    period_overlap: result.periodOverlap ?? "",
    scope_linked: result.scopeLinked,
    match_run_id: runId,
    remessa_batch_id: remessaBatchIds.join(","),
    cpl_batch_ids_json: safeJson(cplBatchIds),
    generated_at: generatedAt,
  }));
  await appendRows(rows);
  return {
    runId,
    rows: rows.length,
    attention: results.filter((result) => result.classification === "ATENCAO").length,
    review: results.filter((result) => result.classification === "REVISAO_NECESSARIA").length,
  };
}
