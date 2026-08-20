import "server-only";

import { randomUUID } from "node:crypto";

import type { Role } from "@/domain/types";
import { getGoogleAccessToken, isGoogleSheetsConfigured } from "./auth";
import {
  CANONICAL_SHEETS,
  CANONICAL_SHEET_NAMES,
  type CanonicalSheetName,
} from "./schema";

export type SheetRow = Record<string, string>;
export type CanonicalWriteRow = Record<string, string | number | boolean>;
export type CanonicalWorkbook = Partial<Record<CanonicalSheetName, SheetRow[]>>;

interface SpreadsheetMetadata {
  sheets?: Array<{ properties?: { title?: string } }>;
}

interface BatchValuesResponse {
  valueRanges?: Array<{ range?: string; values?: string[][] }>;
}

const workbookCache = new Map<
  string,
  { value: CanonicalWorkbook; expiresAt: number }
>();

function columnLetter(columnCount: number): string {
  let value = Math.max(1, columnCount);
  let result = "";
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

function spreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_ID;
  if (!id) throw new Error("GOOGLE_SHEETS_ID não configurado.");
  return id;
}

async function googleFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getGoogleAccessToken();
  const response = await fetch(`https://sheets.googleapis.com/v4/${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Google Sheets respondeu ${response.status}: ${message.slice(0, 220)}`);
  }
  return response;
}

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
    return isGoogleSheetsConfigured();
  }

  async readSelected(
    names: readonly CanonicalSheetName[],
    force = false,
  ): Promise<CanonicalWorkbook> {
    const key = [...names].sort().join(",");
    const cached = workbookCache.get(key);
    if (!force && cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const params = new URLSearchParams();
    for (const name of names) {
      params.append("ranges", `${name}!A:${columnLetter(CANONICAL_SHEETS[name].length)}`);
    }
    params.set("majorDimension", "ROWS");
    const response = await googleFetch(
      `spreadsheets/${spreadsheetId()}/values:batchGet?${params.toString()}`,
    );
    const payload = (await response.json()) as BatchValuesResponse;
    const workbook: CanonicalWorkbook = {};

    names.forEach((name, index) => {
      workbook[name] = rowsFromValues(payload.valueRanges?.[index]?.values);
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

  async appendRows(name: CanonicalSheetName, rows: Array<Array<string | number | boolean>>): Promise<void> {
    if (rows.length === 0) return;
    const lastColumn = columnLetter(CANONICAL_SHEETS[name].length);
    await googleFetch(
      `spreadsheets/${spreadsheetId()}/values/${encodeURIComponent(`${name}!A:${lastColumn}`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { method: "POST", body: JSON.stringify({ values: rows }) },
    );
    workbookCache.clear();
  }

  async appendCanonicalRows(name: CanonicalSheetName, rows: CanonicalWriteRow[]): Promise<void> {
    const headers = CANONICAL_SHEETS[name];
    await this.appendRows(
      name,
      rows.map((row) => headers.map((header) => row[header] ?? "")),
    );
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
    const sheetRow = index + 2;
    const lastColumn = columnLetter(headers.length);
    await googleFetch(
      `spreadsheets/${spreadsheetId()}/values/${encodeURIComponent(`import_batches!A${sheetRow}:${lastColumn}${sheetRow}`)}?valueInputOption=RAW`,
      {
        method: "PUT",
        body: JSON.stringify({ values: [headers.map((header) => updated[header] ?? "")] }),
      },
    );
    workbookCache.clear();
  }

  async ensureCanonicalSchema(): Promise<{ created: string[]; existing: string[] }> {
    const metadataResponse = await googleFetch(
      `spreadsheets/${spreadsheetId()}?fields=sheets.properties.title`,
    );
    const metadata = (await metadataResponse.json()) as SpreadsheetMetadata;
    const existingTitles = new Set(
      metadata.sheets?.flatMap((sheet) => (sheet.properties?.title ? [sheet.properties.title] : [])),
    );
    const created = CANONICAL_SHEET_NAMES.filter((name) => !existingTitles.has(name));
    const existing = CANONICAL_SHEET_NAMES.filter((name) => existingTitles.has(name));

    if (created.length > 0) {
      await googleFetch(`spreadsheets/${spreadsheetId()}:batchUpdate`, {
        method: "POST",
        body: JSON.stringify({
          requests: created.map((title) => ({ addSheet: { properties: { title } } })),
        }),
      });
    }

    const headerUpdates = CANONICAL_SHEET_NAMES.map((name) => ({
      range: `${name}!A1:${columnLetter(CANONICAL_SHEETS[name].length)}1`,
      majorDimension: "ROWS",
      values: [[...CANONICAL_SHEETS[name]]],
    }));
    await googleFetch(`spreadsheets/${spreadsheetId()}/values:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ valueInputOption: "RAW", data: headerUpdates }),
    });
    workbookCache.clear();
    return { created, existing };
  }

  async appendAuditEvent(event: {
    actorEmail: string;
    actorRole: Role;
    action: string;
    entityType: string;
    entityId?: string;
    details?: unknown;
  }): Promise<void> {
    await this.appendRows("audit_log", [
      [
        randomUUID(),
        new Date().toISOString(),
        event.actorEmail,
        event.actorRole,
        event.action,
        event.entityType,
        event.entityId ?? "",
        JSON.stringify(event.details ?? {}),
      ],
    ]);
  }
}

export const sheetsRepository = new GoogleSheetsRepository();
