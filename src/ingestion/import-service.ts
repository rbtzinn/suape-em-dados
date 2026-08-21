import "server-only";

import { randomUUID } from "node:crypto";

import { safeJson } from "@/domain/normalization";
import {
  sheetsRepository,
  type CanonicalWriteRow,
} from "@/infra/google-sheets/repository";
import type { CanonicalSheetName } from "@/infra/google-sheets/schema";
import { rowHash, sha256, stableId } from "./common";
import { extractWorkbook } from "./parse-workbook";
import { parseLai } from "./parsers/lai";
import { parseRemessa } from "./parsers/remessa";
import { refreshContractReviews } from "./refresh-contract-reviews";
import type { ImportRequest, ImportSummary, ParseContext } from "./types";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_RAW_ROWS = 15_000;
const PARSER_VERSION = "1.0.0";

async function appendInChunks(
  sheet: CanonicalSheetName,
  rows: CanonicalWriteRow[],
  chunkSize = 400,
): Promise<void> {
  for (let index = 0; index < rows.length; index += chunkSize) {
    await sheetsRepository.appendCanonicalRows(sheet, rows.slice(index, index + chunkSize));
  }
}

function rawLayer(context: ParseContext, extraction: Awaited<ReturnType<typeof extractWorkbook>>) {
  const records: CanonicalWriteRow[] = [];
  const chunks: CanonicalWriteRow[] = [];
  const schemas: CanonicalWriteRow[] = [];

  for (const sheet of extraction.sheets) {
    schemas.push({
      schema_id: stableId("schema", context.batchId, sheet.title),
      import_batch_id: context.batchId,
      module: extraction.module,
      source_sheet: sheet.title,
      header_row: sheet.headerRow,
      headers_json: safeJson(sheet.headers),
      column_count: sheet.headers.length,
      detected_at: context.importedAt,
      parser_version: PARSER_VERSION,
      notes: "Cabeçalho detectado automaticamente e preservado sem renomear a camada bruta.",
    });

    for (const row of sheet.rows) {
      const rawRecordId = stableId("raw", context.sourceFileHash, row.sheetName, row.rowNumber);
      const content = safeJson(row.values);
      const contentHash = rowHash(row);
      const parts = content.match(/[\s\S]{1,40000}/g) ?? [""];
      if (parts.length > 1) {
        parts.forEach((part, index) => chunks.push({
          chunk_id: stableId("chunk", rawRecordId, index),
          raw_record_id: rawRecordId,
          chunk_index: index + 1,
          chunk_count: parts.length,
          content: part,
          content_hash: sha256(part),
        }));
      }
      records.push({
        raw_record_id: rawRecordId,
        import_batch_id: context.batchId,
        module: extraction.module,
        competence: context.competence,
        source_file: context.sourceFile,
        source_sheet: row.sheetName,
        source_row: row.rowNumber,
        source_hash: contentHash,
        headers_json: safeJson(sheet.headers),
        raw_json: parts.length === 1 ? content : safeJson({ chunked: true, chunks: parts.length }),
        ingested_at: context.importedAt,
      });
    }
  }
  return { chunks, records, schemas };
}

function validate(request: ImportRequest): void {
  if (!request.fileName.toLowerCase().endsWith(".xlsx")) {
    throw new Error("Envie uma planilha no formato .xlsx.");
  }
  if (request.bytes.length === 0 || request.bytes.length > MAX_FILE_BYTES) {
    throw new Error("O arquivo deve ter até 10 MB e não pode estar vazio.");
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(request.competence)) {
    throw new Error("Informe a competência no formato AAAA-MM.");
  }
}

export async function importWorkbook(request: ImportRequest): Promise<ImportSummary> {
  validate(request);
  if (request.module === "CPL") {
    throw new Error("Portarias CPL devem ser enviadas em PDF.");
  }
  const sourceHash = sha256(request.bytes);
  await sheetsRepository.ensureCanonicalSchema();
  if (await sheetsRepository.hasSourceHash(sourceHash)) {
    throw new Error("Este mesmo arquivo já foi importado ou está em processamento.");
  }

  const batchId = randomUUID();
  const importedAt = new Date().toISOString();
  const sourceFileId = stableId("file", sourceHash);
  const extraction = await extractWorkbook(request.bytes, request.module);
  const context: ParseContext = {
    batchId,
    competence: request.competence,
    importedAt,
    sourceFile: request.fileName,
    sourceFileHash: sourceHash,
  };
  const raw = rawLayer(context, extraction);
  if (raw.records.length > MAX_RAW_ROWS) {
    throw new Error(`O arquivo excede o limite de ${MAX_RAW_ROWS} linhas não vazias por carga.`);
  }
  const normalized = extraction.module === "REMESSA"
    ? parseRemessa(extraction.sheets, context)
    : parseLai(extraction.sheets, context);

  let batchCreated = false;
  let batchPublished = false;
  let reconciliation: ImportSummary["reconciliation"];
  try {
    await appendInChunks("source_files", [{
      source_file_id: sourceFileId,
      file_name: request.fileName,
      mime_type: request.mimeType,
      size_bytes: request.bytes.length,
      source_sha256: sourceHash,
      drive_url: request.driveUrl ?? "",
      received_at: importedAt,
      received_by: request.actorEmail,
      status: "RECEIVED",
      notes: "O arquivo não é salvo no Git; todas as células não vazias são preservadas na camada bruta.",
    }]);
    await appendInChunks("import_batches", [{
      batch_id: batchId,
      source_file_id: sourceFileId,
      source_file: request.fileName,
      source_hash: sourceHash,
      competence: request.competence,
      module: extraction.module,
      status: "STAGING",
      record_count: 0,
      raw_record_count: raw.records.length,
      parser_version: PARSER_VERSION,
      imported_at: importedAt,
      imported_by: request.actorEmail,
      notes: "Carga iniciada; publicação ocorre somente após todas as camadas serem gravadas.",
    }]);
    batchCreated = true;

    await appendInChunks("source_schemas", raw.schemas);
    await appendInChunks("raw_records", raw.records);
    await appendInChunks("raw_record_chunks", raw.chunks);
    await appendInChunks(normalized.target, normalized.rows);
    await appendInChunks("data_quality_issues", normalized.issues);
    await sheetsRepository.updateImportBatch(batchId, {
      status: "PUBLISHED",
      record_count: String(normalized.rows.length),
      raw_record_count: String(raw.records.length),
      notes: "Camada bruta e camada canônica publicadas com sucesso.",
    });
    batchPublished = true;
    try {
      reconciliation = await refreshContractReviews();
    } catch (reconciliationError) {
      const warning = reconciliationError instanceof Error
        ? reconciliationError.message.slice(0, 240)
        : "Falha não identificada na conciliação.";
      reconciliation = { runId: "", rows: 0, skipped: true, warning };
      await sheetsRepository.updateImportBatch(batchId, {
        status: "PUBLISHED",
        record_count: String(normalized.rows.length),
        raw_record_count: String(raw.records.length),
        notes: `Dados publicados; conciliação automática requer nova tentativa: ${warning}`,
      }).catch(() => undefined);
      await sheetsRepository.appendAuditEvent({
        actorEmail: request.actorEmail,
        actorRole: request.actorRole,
        action: "RECONCILIATION_FAILED",
        entityType: "import_batch",
        entityId: batchId,
        details: { warning },
      }).catch(() => undefined);
    }
    await sheetsRepository.appendAuditEvent({
      actorEmail: request.actorEmail,
      actorRole: request.actorRole,
      action: "IMPORT_PUBLISHED",
      entityType: "import_batch",
      entityId: batchId,
      details: {
        module: extraction.module,
        records: normalized.rows.length,
        reconciliation,
        sourceHash,
      },
    });
  } catch (error) {
    if (batchCreated && !batchPublished) {
      await sheetsRepository.updateImportBatch(batchId, {
        status: "FAILED",
        record_count: "0",
        raw_record_count: String(raw.records.length),
        notes: error instanceof Error ? error.message.slice(0, 300) : "Falha não identificada.",
      }).catch(() => undefined);
    }
    throw error;
  }

  return {
    batchId,
    module: extraction.module,
    normalizedRecords: normalized.rows.length,
    qualityIssues: normalized.issues.length,
    rawRecords: raw.records.length,
    sourceHash,
    sourceSheets: extraction.sheets.map((sheet) => sheet.title),
    reconciliation,
  };
}
