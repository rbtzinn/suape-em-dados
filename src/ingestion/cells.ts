import type { Cell, Worksheet } from "exceljs";

import type { SourceRow, SourceSheet } from "./types";

function jsonSafe(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (["string", "number", "boolean"].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, jsonSafe(item)]),
    );
  }
  return String(value);
}

function displayedCellValue(cell: Cell): string {
  if (cell.value instanceof Date) return cell.value.toISOString().slice(0, 10);
  if (typeof cell.value === "object" && cell.value && "result" in cell.value) {
    try {
      return String((cell.value as { result?: unknown }).result ?? cell.text ?? "").trim();
    } catch {
      return String((cell.value as { result?: unknown }).result ?? "").trim();
    }
  }
  try {
    return String(cell.text ?? cell.value ?? "").trim();
  } catch {
    return String(cell.value ?? "").trim();
  }
}

export function uniqueHeaders(values: string[]): string[] {
  const counts = new Map<string, number>();
  return values.map((value, index) => {
    const base = value.trim() || `COLUNA_${index + 1}`;
    const next = (counts.get(base) ?? 0) + 1;
    counts.set(base, next);
    return next === 1 ? base : `${base}__${next}`;
  });
}

function isNonEmpty(row: SourceRow): boolean {
  return Object.values(row.display).some((value) => value.trim() !== "");
}

export function extractSourceSheet(
  worksheet: Worksheet,
  headerRow: number,
): SourceSheet {
  const header = worksheet.getRow(headerRow);
  const columnCount = Math.max(header.cellCount, worksheet.actualColumnCount);
  const headers = uniqueHeaders(
    Array.from({ length: columnCount }, (_, index) =>
      displayedCellValue(header.getCell(index + 1)),
    ),
  );
  const rows: SourceRow[] = [];

  for (let rowNumber = headerRow + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const source = worksheet.getRow(rowNumber);
    const values: Record<string, unknown> = {};
    const display: Record<string, string> = {};
    headers.forEach((key, index) => {
      const cell = source.getCell(index + 1);
      values[key] = jsonSafe(cell.value);
      display[key] = displayedCellValue(cell);
    });
    const row = { sheetName: worksheet.name, rowNumber, values, display };
    if (isNonEmpty(row)) rows.push(row);
  }

  return { title: worksheet.name, headerRow, headers, rows };
}
