import ExcelJS from "exceljs";

import { extractSourceSheet } from "./cells";
import { detectSheetHeader, detectWorkbookModule } from "./detect";
import type {
  WorkbookImportModule,
  WorkbookExtraction,
} from "./types";

export async function extractWorkbook(
  bytes: Buffer,
  selection: WorkbookImportModule | "AUTO",
): Promise<WorkbookExtraction> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  await workbook.xlsx.load(arrayBuffer);
  const sourceModule = selection === "AUTO" ? detectWorkbookModule(workbook) : selection;
  const sheets: WorkbookExtraction["sheets"] = [];

  workbook.eachSheet((worksheet) => {
    const candidate = detectSheetHeader(worksheet);
    if (candidate?.module === sourceModule) {
      sheets.push(extractSourceSheet(worksheet, candidate.rowNumber));
    }
  });

  if (sheets.length === 0) {
    throw new Error(`Nenhuma aba com estrutura ${sourceModule} foi encontrada no arquivo.`);
  }
  if (sheets.every((sheet) => sheet.rows.length === 0)) {
    throw new Error("As abas reconhecidas não contêm linhas de dados.");
  }

  return { module: sourceModule, sheets };
}
