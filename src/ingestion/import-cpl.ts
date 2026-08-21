import "server-only";

import { randomUUID } from "node:crypto";

import { normalizeText, safeJson } from "@/domain/normalization";
import {
  sheetsRepository,
  type CanonicalWriteRow,
} from "@/infra/google-sheets/repository";
import type { CanonicalSheetName } from "@/infra/google-sheets/schema";
import { personHash, sha256, stableId } from "./common";
import { extractPdfText } from "./parse-pdf";
import { parseCplOrdinance } from "./parsers/cpl";
import { refreshCplMatches } from "./refresh-cpl-matches";
import type { ImportRequest, ImportSummary } from "./types";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const PARSER_VERSION = "cpl-1.0.0";

async function appendInChunks(
  sheet: CanonicalSheetName,
  rows: CanonicalWriteRow[],
  chunkSize = 400,
): Promise<void> {
  for (let index = 0; index < rows.length; index += chunkSize) {
    await sheetsRepository.appendCanonicalRows(sheet, rows.slice(index, index + chunkSize));
  }
}

function validate(request: ImportRequest): void {
  if (!request.fileName.toLocaleLowerCase("pt-BR").endsWith(".pdf")) {
    throw new Error("Envie a portaria no formato PDF.");
  }
  if (request.bytes.length === 0 || request.bytes.length > MAX_FILE_BYTES) {
    throw new Error("O PDF deve ter até 10 MB e não pode estar vazio.");
  }
  if (!["AUTO", "CPL"].includes(request.module)) {
    throw new Error("Um PDF de portaria deve usar o tipo CPL ou detecção automática.");
  }
}

function ordinanceStatus(from: string, to: string, reference: string): string {
  if (reference < from) return "PROGRAMADA";
  if (reference > to) return "ENCERRADA";
  return "VIGENTE";
}

export async function importCplPdf(request: ImportRequest): Promise<ImportSummary> {
  validate(request);
  const sourceHash = sha256(request.bytes);
  await sheetsRepository.ensureCanonicalSchema();
  if (await sheetsRepository.hasSourceHash(sourceHash)) {
    throw new Error("Este mesmo arquivo já foi importado ou está em processamento.");
  }

  const importedAt = new Date().toISOString();
  const batchId = randomUUID();
  const sourceFileId = stableId("file", sourceHash);
  const extraction = await extractPdfText(request.bytes);
  const parsed = parseCplOrdinance(extraction.text);
  const competence = parsed.effectiveFrom.slice(0, 7);
  const ordinanceId = stableId("ordinance", sourceHash, parsed.number, parsed.year);
  const rawRows: CanonicalWriteRow[] = extraction.pages.map((page) => {
    const rawRecordId = stableId("raw", sourceHash, "PDF", page.pageNumber);
    return {
      raw_record_id: rawRecordId,
      import_batch_id: batchId,
      module: "CPL",
      competence,
      source_file: request.fileName,
      source_sheet: "PDF",
      source_row: page.pageNumber,
      source_hash: sha256(page.text),
      headers_json: safeJson(["page_number", "text"]),
      raw_json: safeJson({ page_number: page.pageNumber, text: page.text }),
      ingested_at: importedAt,
    };
  });
  const firstRawId = String(rawRows[0]?.raw_record_id ?? "");
  const normalizedCount = parsed.members.length + 1;
  let batchCreated = false;
  let batchPublished = false;
  let cplReconciliation: ImportSummary["cplReconciliation"];

  try {
    await appendInChunks("source_files", [{
      source_file_id: sourceFileId,
      file_name: request.fileName,
      mime_type: request.mimeType || "application/pdf",
      size_bytes: request.bytes.length,
      source_sha256: sourceHash,
      drive_url: request.driveUrl ?? "",
      received_at: importedAt,
      received_by: request.actorEmail,
      status: "RECEIVED",
      notes: "PDF preservado fora do Git; texto integral guardado por página na camada bruta.",
    }]);
    await appendInChunks("import_batches", [{
      batch_id: batchId,
      source_file_id: sourceFileId,
      source_file: request.fileName,
      source_hash: sourceHash,
      competence,
      module: "CPL",
      status: "STAGING",
      record_count: 0,
      raw_record_count: rawRows.length,
      parser_version: PARSER_VERSION,
      imported_at: importedAt,
      imported_by: request.actorEmail,
      notes: "Carga da portaria iniciada; publicação somente após todas as camadas.",
    }]);
    batchCreated = true;
    await appendInChunks("source_schemas", [{
      schema_id: stableId("schema", batchId, "PDF"),
      import_batch_id: batchId,
      module: "CPL",
      source_sheet: "PDF",
      header_row: 0,
      headers_json: safeJson(["page_number", "text"]),
      column_count: 2,
      detected_at: importedAt,
      parser_version: PARSER_VERSION,
      notes: "PDF textual; cada página é preservada como um registro bruto.",
    }]);
    await appendInChunks("raw_records", rawRows);
    await appendInChunks("cpl_ordinances", [{
      ordinance_id: ordinanceId,
      ordinance_number: parsed.number,
      ordinance_year: parsed.year,
      title: parsed.title,
      purpose: parsed.purpose,
      commission_name: parsed.commissionName,
      effective_from: parsed.effectiveFrom,
      effective_to: parsed.effectiveTo,
      status: ordinanceStatus(parsed.effectiveFrom, parsed.effectiveTo, importedAt.slice(0, 10)),
      source_file: request.fileName,
      source_page: 1,
      source_hash: sourceHash,
      import_batch_id: batchId,
      raw_record_id: firstRawId,
      raw_json: safeJson(parsed),
    }]);
    await appendInChunks("cpl_members", parsed.members.map((member) => ({
      assignment_id: stableId("assignment", ordinanceId, member.name),
      ordinance_id: ordinanceId,
      person_name: member.name,
      person_name_normalized: normalizeText(member.name),
      person_hash: personHash("CPL", member.name),
      commission_role: member.commissionRole,
      member_type: member.memberType,
      effective_from: parsed.effectiveFrom,
      effective_to: parsed.effectiveTo,
      source_file: request.fileName,
      source_page: 1,
      source_hash: sourceHash,
      import_batch_id: batchId,
      raw_record_id: firstRawId,
      raw_json: safeJson(member),
    })));
    await sheetsRepository.updateImportBatch(batchId, {
      status: "PUBLISHED",
      record_count: String(normalizedCount),
      raw_record_count: String(rawRows.length),
      notes: "Portaria, vigência e membros efetivos publicados na base canônica.",
    });
    batchPublished = true;
    try {
      cplReconciliation = await refreshCplMatches();
    } catch (error) {
      const warning = error instanceof Error ? error.message.slice(0, 240) : "Falha não identificada.";
      cplReconciliation = { runId: "", rows: 0, attention: 0, review: 0, warning };
    }
    await sheetsRepository.appendAuditEvent({
      actorEmail: request.actorEmail,
      actorRole: request.actorRole,
      action: "CPL_IMPORT_PUBLISHED",
      entityType: "cpl_ordinance",
      entityId: ordinanceId,
      details: { batchId, members: parsed.members.length, sourceHash, cplReconciliation },
    });
  } catch (error) {
    if (batchCreated && !batchPublished) {
      await sheetsRepository.updateImportBatch(batchId, {
        status: "FAILED",
        record_count: "0",
        raw_record_count: String(rawRows.length),
        notes: error instanceof Error ? error.message.slice(0, 300) : "Falha não identificada.",
      }).catch(() => undefined);
    }
    throw error;
  }

  return {
    batchId,
    module: "CPL",
    normalizedRecords: normalizedCount,
    qualityIssues: cplReconciliation?.review ?? 0,
    rawRecords: rawRows.length,
    sourceHash,
    sourceSheets: ["PDF"],
    cplReconciliation,
  };
}
