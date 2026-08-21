import "server-only";

import { randomUUID } from "node:crypto";

import type { Role } from "@/domain/types";
import { appsScriptRequest, isSheetsBridgeConfigured } from "./apps-script";
import {
  CANONICAL_SHEETS,
  CANONICAL_SHEET_NAMES,
  type CanonicalSheetName,
} from "./schema";

export type SheetRow = Record<string, string>;
export type CanonicalWriteRow = Record<string, string | number | boolean>;
export type CanonicalWorkbook = Partial<Record<CanonicalSheetName, SheetRow[]>>;

interface ReadSelectedResult {
  workbook: Partial<Record<CanonicalSheetName, string[][]>>;
}

const workbookCache = new Map<string, { value: CanonicalWorkbook; expiresAt: number }>();
const MAX_APPEND_ROWS = 400;
const MAX_APPEND_BYTES = 1_500_000;

function rowsFromValues(values: string[][] = []): SheetRow[] {
  const [headers = [], ...rows] = values;
  return rows
    .filter((row) => row.some((cell) => String(cell ?? "").trim()))
    .map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, String(row[index] ?? "")])),
    );
}

export class GoogleSheetsRepository {
  isConfigured(): boolean {
    return isSheetsBridgeConfigured();
  }

  async readSelected(
    names: readonly CanonicalSheetName[],
    force = false,
  ): Promise<CanonicalWorkbook> {
    const key = [...names].sort().join(",");
    const cached = workbookCache.get(key);
    if (!force && cached && cached.expiresAt > Date.now()) return cached.value;

    const payload = await appsScriptRequest<ReadSelectedResult>("readSelected", { names });
    const workbook: CanonicalWorkbook = {};
    names.forEach((name) => {
      workbook[name] = rowsFromValues(payload.workbook[name]);
    });
    workbookCache.set(key, { value: workbook, expiresAt: Date.now() + 60_000 });
    return workbook;
  }

  async readWorkbook(force = false): Promise<CanonicalWorkbook> {
    return this.readSelected(CANONICAL_SHEET_NAMES, force);
  }

  async readRows(name: CanonicalSheetName): Promise<SheetRow[]> {
    return (await this.readSelected([name]))[name] ?? [];
  }

  async appendRows(
    name: CanonicalSheetName,
    rows: Array<Array<string | number | boolean>>,
  ): Promise<void> {
    if (rows.length === 0) return;
    let batch: Array<Array<string | number | boolean>> = [];
    let bytes = 0;
    for (const row of rows) {
      const rowBytes = Buffer.byteLength(JSON.stringify(row), "utf8");
      if (batch.length && (batch.length >= MAX_APPEND_ROWS || bytes + rowBytes > MAX_APPEND_BYTES)) {
        await appsScriptRequest("appendRows", { name, rows: batch });
        batch = [];
        bytes = 0;
      }
      batch.push(row);
      bytes += rowBytes;
    }
    if (batch.length) await appsScriptRequest("appendRows", { name, rows: batch });
    workbookCache.clear();
  }

  async appendCanonicalRows(name: CanonicalSheetName, rows: CanonicalWriteRow[]): Promise<void> {
    const headers = CANONICAL_SHEETS[name];
    await this.appendRows(name, rows.map((row) => headers.map((header) => row[header] ?? "")));
  }

  async hasSourceHash(sourceHash: string): Promise<boolean> {
    const batches = await this.readRows("import_batches");
    return batches.some(
      (row) => row.source_hash === sourceHash && ["STAGING", "PUBLISHED"].includes(row.status),
    );
  }

  async updateImportBatch(
    batchId: string,
    updates: Pick<SheetRow, "status" | "record_count" | "raw_record_count" | "notes">,
  ): Promise<void> {
    const rows = await this.readRows("import_batches");
    const index = rows.findIndex((row) => row.batch_id === batchId);
    if (index < 0) throw new Error(`Lote ${batchId} não encontrado.`);
    const headers = CANONICAL_SHEETS.import_batches;
    const updated: SheetRow = { ...rows[index], ...updates };
    await appsScriptRequest("updateRow", {
      name: "import_batches",
      rowNumber: index + 2,
      values: headers.map((header) => updated[header] ?? ""),
    });
    workbookCache.clear();
  }

  async ensureCanonicalSchema(): Promise<{ created: string[]; existing: string[] }> {
    const result = await appsScriptRequest<{ created: string[]; existing: string[] }>(
      "ensureSchema",
      {
        sheets: CANONICAL_SHEET_NAMES.map((name) => ({
          name,
          headers: [...CANONICAL_SHEETS[name]],
        })),
      },
    );
    workbookCache.clear();
    return result;
  }

  async appendAuditEvent(event: {
    actorEmail: string;
    actorRole: Role;
    action: string;
    entityType: string;
    entityId?: string;
    details?: unknown;
  }): Promise<void> {
    await this.appendRows("audit_log", [[
      randomUUID(),
      new Date().toISOString(),
      event.actorEmail,
      event.actorRole,
      event.action,
      event.entityType,
      event.entityId ?? "",
      JSON.stringify(event.details ?? {}),
    ]]);
  }
}

export const sheetsRepository = new GoogleSheetsRepository();
