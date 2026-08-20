import { createHash } from "node:crypto";

import {
  normalizeDigits,
  normalizeIdentifier,
  normalizeText,
  parseBoolean,
  parseMoneyToCents,
  safeJson,
} from "@/domain/normalization";
import type { ParseContext, SourceRow } from "./types";
import type { CanonicalWriteRow } from "@/infra/google-sheets/repository";

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function stableId(prefix: string, ...parts: unknown[]): string {
  return `${prefix}_${sha256(safeJson(parts)).slice(0, 24)}`;
}

export function normalizedHeader(value: string): string {
  return normalizeText(value)
    .replace(/[º°]/g, "o")
    .replace(/\s*\[\d+\]\s*$/, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function field(row: SourceRow, ...aliases: string[]): string {
  const wanted = new Set(aliases.map(normalizedHeader));
  const key = Object.keys(row.display).find((header) => wanted.has(normalizedHeader(header)));
  return key ? row.display[key] ?? "" : "";
}

export function rowHash(row: SourceRow): string {
  return sha256(safeJson({ sheet: row.sheetName, row: row.rowNumber, values: row.values }));
}

export function provenance(row: SourceRow, context: ParseContext) {
  const sourceHash = rowHash(row);
  const rawRecordId = stableId("raw", context.sourceFileHash, row.sheetName, row.rowNumber);
  const rawJson = safeJson(row.values);
  return {
    competence: context.competence,
    source_file: context.sourceFile,
    source_sheet: row.sheetName,
    source_row: row.rowNumber,
    source_hash: sourceHash,
    import_batch_id: context.batchId,
    raw_record_id: rawRecordId,
    raw_json:
      rawJson.length <= 40_000
        ? rawJson
        : safeJson({ chunked: true, raw_record_id: rawRecordId, source_hash: sourceHash }),
  };
}

export function qualityIssue(
  context: ParseContext,
  row: SourceRow,
  recordId: string,
  ruleCode: string,
  message: string,
  options: {
    fieldName?: string;
    normalizedValue?: string | number;
    rawValue?: string;
    severity?: "INFO" | "WARNING" | "ERROR";
  } = {},
): CanonicalWriteRow {
  return {
    issue_id: stableId("issue", context.batchId, row.sheetName, row.rowNumber, ruleCode),
    import_batch_id: context.batchId,
    module: "",
    record_id: recordId,
    severity: options.severity ?? "WARNING",
    rule_code: ruleCode,
    field_name: options.fieldName ?? "",
    raw_value: options.rawValue ?? "",
    normalized_value: options.normalizedValue ?? "",
    message,
    status: "OPEN",
    created_at: context.importedAt,
  };
}

export function money(value: string): number {
  return parseMoneyToCents(value) ?? 0;
}

export function digits(value: string): string {
  return normalizeDigits(value);
}

export function identifier(value: string): string {
  return normalizeIdentifier(value).toUpperCase();
}

export function displayName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function personHash(namespace: string, ...identity: string[]): string {
  return sha256([namespace, ...identity.map(normalizeText)].join("|"));
}

export function booleanValue(value: string): boolean {
  return parseBoolean(value) ?? Boolean(value.trim());
}

export function isoDate(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!br) return raw;
  const year = br[3].length === 2 ? `20${br[3]}` : br[3];
  return `${year}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
}
