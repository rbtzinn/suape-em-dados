import { normalizeDigits, normalizeText, safeJson } from "@/domain/normalization";
import type {
  CanonicalWriteRow,
  SheetRow,
} from "@/infra/google-sheets/repository";
import { stableId } from "./common";

interface Candidate {
  record: SheetRow;
  score: number;
  reasons: string[];
}

export interface ReconciliationRun {
  competence: string;
  generatedAt: string;
  laiBatchId: string;
  remessaBatchId: string;
  runId: string;
}

function bigrams(value: string): Map<string, number> {
  const result = new Map<string, number>();
  const text = normalizeText(value).replace(/[^a-z0-9]+/g, " ");
  for (let index = 0; index < text.length - 1; index += 1) {
    const pair = text.slice(index, index + 2);
    result.set(pair, (result.get(pair) ?? 0) + 1);
  }
  return result;
}

function similarity(left: string, right: string): number {
  const first = bigrams(left);
  const second = bigrams(right);
  const firstSize = [...first.values()].reduce((sum, value) => sum + value, 0);
  const secondSize = [...second.values()].reduce((sum, value) => sum + value, 0);
  if (!firstSize || !secondSize) return 0;
  let intersection = 0;
  for (const [pair, count] of first) {
    intersection += Math.min(count, second.get(pair) ?? 0);
  }
  return (2 * intersection) / (firstSize + secondSize);
}

function contractKey(value: string): [string, string] {
  const match = value.toUpperCase().match(/([0-9A-Z.-]+)\s*\/\s*(20\d{2})/);
  if (!match) return ["", ""];
  return [match[1].replace(/[^A-Z0-9]/g, "").replace(/^0+/, "") || "0", match[2]];
}

function candidateFor(source: SheetRow, target: SheetRow): Candidate | null {
  const [sourceNumber, sourceYear] = contractKey(source.contract_number);
  const [targetNumber, targetYear] = contractKey(target.contract_number);
  const numberYear = Boolean(
    sourceNumber && sourceNumber === targetNumber && sourceYear === targetYear,
  );
  const sourceCnpj = normalizeDigits(source.cnpj);
  const targetCnpj = normalizeDigits(target.cnpj || target.party_raw);
  const cnpjMatch = sourceCnpj.length === 14 && sourceCnpj === targetCnpj;
  const companySimilarity = similarity(source.company_name, target.company_name || target.party_raw);
  const objectSimilarity = similarity(source.object, target.object);
  const score =
    (numberYear ? 0.5 : 0) +
    (cnpjMatch ? 0.25 : 0) +
    0.1 * companySimilarity +
    0.15 * objectSimilarity;
  if (score < 0.45) return null;

  const reasons: string[] = [];
  if (numberYear) reasons.push("número e ano do contrato coincidem");
  if (cnpjMatch) reasons.push("CNPJ coincide");
  if (companySimilarity >= 0.75) reasons.push("razão social semelhante");
  if (objectSimilarity >= 0.65) reasons.push("objeto semelhante");
  return { record: target, score, reasons };
}

function metadata(run: ReconciliationRun): CanonicalWriteRow {
  return {
    competence: run.competence,
    reconciliation_run_id: run.runId,
    remessa_batch_id: run.remessaBatchId,
    lai_batch_id: run.laiBatchId,
    generated_at: run.generatedAt,
  };
}

export function createReconciliationRun(
  competence: string,
  remessaBatchId: string,
  laiBatchId: string,
  generatedAt = new Date().toISOString(),
): ReconciliationRun {
  return {
    competence,
    generatedAt,
    laiBatchId,
    remessaBatchId,
    runId: stableId("reconciliation", competence, remessaBatchId, laiBatchId),
  };
}

export function reconcileContracts(
  lai: SheetRow[],
  remessa: SheetRow[],
  run: ReconciliationRun,
): CanonicalWriteRow[] {
  const comparable = remessa.filter((record) => record.contract_number);
  const usedRemessa = new Set<string>();
  const reviews: CanonicalWriteRow[] = [];

  for (const source of lai) {
    const candidates = comparable
      .map((target) => candidateFor(source, target))
      .filter((candidate): candidate is Candidate => candidate !== null)
      .sort((left, right) => right.score - left.score);
    let selected: Candidate | null = candidates[0] || null;
    let status = "SOMENTE_LAI";
    if (selected && candidates[1] && selected.score - candidates[1].score < 0.08) {
      selected = null;
      status = "MATCH_AMBIGUO";
    } else if (selected?.score && selected.score >= 0.9) {
      status = "MATCH_EXATO";
    } else if (selected?.score && selected.score >= 0.75) {
      status = "MATCH_FORTE";
    } else if (selected?.score && selected.score >= 0.58) {
      status = "MATCH_PROVAVEL";
    } else if (selected) {
      status = "DIVERGENCIA";
    }
    if (selected) usedRemessa.add(selected.record.record_id);

    reviews.push({
      review_id: stableId("review", run.runId, source.record_id, status),
      remessa_record_id: selected?.record.record_id ?? "",
      lai_record_id: source.record_id,
      match_status: status,
      match_score: selected ? Math.round(selected.score * 10_000) / 100 : 0,
      match_reasons_json: safeJson({
        scope: "COMPARAVEL_COM_LAI",
        reasons: selected?.reasons ?? [],
        alternatives: candidates.slice(0, 3).map((candidate) => ({
          remessa_record_id: candidate.record.record_id,
          score: Math.round(candidate.score * 10_000) / 100,
          reasons: candidate.reasons,
        })),
      }),
      decision: "NAO_REVISADO",
      reviewed_by: "",
      reviewed_at: "",
      notes: "Resultado preliminar para triagem; vínculo definitivo depende de revisão humana.",
      ...metadata(run),
    });
  }

  for (const target of comparable) {
    if (usedRemessa.has(target.record_id)) continue;
    reviews.push({
      review_id: stableId("review", run.runId, target.record_id, "SOMENTE_REMESSA"),
      remessa_record_id: target.record_id,
      lai_record_id: "",
      match_status: "SOMENTE_REMESSA",
      match_score: 0,
      match_reasons_json: safeJson({
        scope: "COMPARAVEL_COM_LAI",
        reasons: ["nenhum registro LAI selecionado"],
      }),
      decision: "NAO_REVISADO",
      reviewed_by: "",
      reviewed_at: "",
      notes: "Confirmar escopo e competência antes de concluir.",
      ...metadata(run),
    });
  }
  return reviews;
}
