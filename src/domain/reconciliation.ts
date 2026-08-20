import { normalizeDigits, normalizeIdentifier, normalizeText } from "./normalization";

export type MatchStatus = "EXACT" | "STRONG" | "PROBABLE" | "AMBIGUOUS" | "NO_MATCH";

export interface ReconciliationRecord {
  id?: string | null;
  contractNumber?: string | null;
  companyName?: string | null;
  cnpj?: string | null;
  valueCents?: number | null;
  startDate?: string | null;
}

export interface MatchCandidate<T extends ReconciliationRecord = ReconciliationRecord> {
  record: T;
  score: number;
  reasons: string[];
}

export interface MatchResult<T extends ReconciliationRecord = ReconciliationRecord> {
  status: MatchStatus;
  selected: MatchCandidate<T> | null;
  alternatives: MatchCandidate<T>[];
}

export function scoreRecords(
  left: ReconciliationRecord,
  right: ReconciliationRecord,
): Omit<MatchCandidate, "record"> {
  let score = 0;
  const reasons: string[] = [];

  const leftId = normalizeIdentifier(left.id);
  const rightId = normalizeIdentifier(right.id);
  if (leftId && leftId === rightId) {
    score += 90;
    reasons.push("ID do instrumento idêntico");
  }

  const leftContract = normalizeIdentifier(left.contractNumber);
  const rightContract = normalizeIdentifier(right.contractNumber);
  if (leftContract && leftContract === rightContract) {
    score += 45;
    reasons.push("número do contrato idêntico");
  }

  const leftCnpj = normalizeDigits(left.cnpj);
  const rightCnpj = normalizeDigits(right.cnpj);
  if (leftCnpj.length === 14 && leftCnpj === rightCnpj) {
    score += 30;
    reasons.push("CNPJ idêntico");
  }

  const leftCompany = normalizeText(left.companyName);
  const rightCompany = normalizeText(right.companyName);
  if (leftCompany && leftCompany === rightCompany) {
    score += 20;
    reasons.push("razão social normalizada idêntica");
  }

  if (
    left.valueCents !== null &&
    left.valueCents !== undefined &&
    left.valueCents === right.valueCents
  ) {
    score += 15;
    reasons.push("valor idêntico");
  }

  if (left.startDate && left.startDate === right.startDate) {
    score += 10;
    reasons.push("data inicial idêntica");
  }

  return { score, reasons };
}

export function reconcileRecord<T extends ReconciliationRecord>(
  left: ReconciliationRecord,
  candidates: T[],
): MatchResult<T> {
  const ranked = candidates
    .map((record) => ({ record, ...scoreRecords(left, record) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  const selected = ranked[0] ?? null;
  if (!selected || selected.score < 40) {
    return { status: "NO_MATCH", selected: null, alternatives: ranked.slice(0, 3) };
  }

  const second = ranked[1];
  if (second && selected.score - second.score <= 5) {
    return { status: "AMBIGUOUS", selected: null, alternatives: ranked.slice(0, 3) };
  }

  const status: MatchStatus =
    selected.score >= 85 ? "EXACT" : selected.score >= 60 ? "STRONG" : "PROBABLE";

  return { status, selected, alternatives: ranked.slice(1, 3) };
}
