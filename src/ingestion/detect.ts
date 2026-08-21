import type { Workbook, Worksheet } from "exceljs";

import { normalizeText } from "@/domain/normalization";
import type { WorkbookImportModule } from "./types";

interface HeaderCandidate {
  module: WorkbookImportModule;
  rowNumber: number;
  score: number;
}

const KEYWORDS: Record<WorkbookImportModule, string[]> = {
  REMESSA: [
    "id do ij",
    "instrumento juridico",
    "objeto do contrato",
    "parte do ij",
    "situacao da analise",
    "fiscal confirmado no pdf",
  ],
  LAI: [
    "cnpj da contratada",
    "objeto",
    "n do contrato",
    "ano do contrato",
    "valor total do contrato",
    "nome do fiscal do contrato",
  ],
  OUTSOURCED: [
    "ugc",
    "uge",
    "nome do funcionario",
    "lotacao",
    "funcao",
    "custo individual",
  ],
  PAYROLL: [
    "nome",
    "chapa",
    "cpf",
    "tipo de funcionario",
    "descricao do evento",
    "valor da ficha",
  ],
  TRAVEL: [
    "nome do favorecido",
    "finalidade",
    "motivo",
    "data ida",
    "data volta",
    "valor total de passagens",
    "valor total de diarias",
  ],
};

function normalizedCell(value: unknown): string {
  return normalizeText(value)
    .replace(/[º°]/g, "o")
    .replace(/\s*\[\d+\]\s*$/, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreRow(
  worksheet: Worksheet,
  rowNumber: number,
  module: WorkbookImportModule,
): number {
  const row = worksheet.getRow(rowNumber);
  const cells = Array.from({ length: Math.max(row.cellCount, 1) }, (_, index) => {
    const cell = row.getCell(index + 1);
    try {
      return normalizedCell(cell.text);
    } catch {
      return normalizedCell(cell.value);
    }
  });
  return KEYWORDS[module].reduce(
    (score, keyword) => score + (cells.some((cell) => cell.includes(keyword)) ? 1 : 0),
    0,
  );
}

export function detectSheetHeader(worksheet: Worksheet): HeaderCandidate | null {
  let best: HeaderCandidate | null = null;
  const maxRow = Math.min(Math.max(worksheet.rowCount, 1), 25);

  for (let rowNumber = 1; rowNumber <= maxRow; rowNumber += 1) {
    for (const sourceModule of ["REMESSA", "LAI", "OUTSOURCED", "PAYROLL", "TRAVEL"] as const) {
      const score = scoreRow(worksheet, rowNumber, sourceModule);
      if (!best || score > best.score) best = { module: sourceModule, rowNumber, score };
    }
  }

  return best && best.score >= 4 ? best : null;
}

export function detectWorkbookModule(workbook: Workbook): WorkbookImportModule {
  const totals = new Map<WorkbookImportModule, number>([
    ["REMESSA", 0],
    ["LAI", 0],
    ["OUTSOURCED", 0],
    ["PAYROLL", 0],
    ["TRAVEL", 0],
  ]);
  workbook.eachSheet((worksheet) => {
    const candidate = detectSheetHeader(worksheet);
    if (candidate) totals.set(candidate.module, (totals.get(candidate.module) ?? 0) + candidate.score);
  });
  const ranked = [...totals.entries()].sort((left, right) => right[1] - left[1]);
  if (!ranked[0] || ranked[0][1] === 0) {
    throw new Error("Não foi possível reconhecer automaticamente o tipo da planilha.");
  }
  return ranked[0][0];
}
