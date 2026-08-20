import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { extractWorkbook } from "./parse-workbook";
import { parseLai } from "./parsers/lai";
import { parseRemessa } from "./parsers/remessa";
import type { ParseContext } from "./types";

const context: ParseContext = {
  batchId: "batch-test",
  competence: "2026-06",
  importedAt: "2026-08-20T12:00:00.000Z",
  sourceFile: "fonte.xlsx",
  sourceFileHash: "abc123",
};

async function workbookBuffer(
  headers: string[],
  values: Array<string | number>,
  headerRow: number,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("DADOS");
  sheet.getRow(headerRow).values = headers;
  sheet.getRow(headerRow + 1).values = values;
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

describe("importação de planilhas", () => {
  it("detecta LAI, preserva todas as células e normaliza o contrato", async () => {
    const headers = [
      "Nº DE ORDEM [3]",
      "CONTRATADA [4]",
      "CNPJ DA CONTRATADA [5]",
      "OBJETO [6]",
      "Nº DO CONTRATO [10]",
      "ANO DO CONTRATO [11]",
      "VALOR TOTAL DO CONTRATO [18]",
      "NOME DO FISCAL DO CONTRATO [20]",
    ];
    const bytes = await workbookBuffer(
      headers,
      [1, "Empresa Teste", "12.345.678/0001-90", "Objeto", "14", "2026", 1250.5, "Fiscal"],
      6,
    );
    const extraction = await extractWorkbook(bytes, "AUTO");
    const normalized = parseLai(extraction.sheets, context);

    expect(extraction.module).toBe("LAI");
    expect(Object.keys(extraction.sheets[0].rows[0].values)).toEqual(headers);
    expect(normalized.rows[0]).toMatchObject({
      contract_number: "14/2026",
      cnpj: "12345678000190",
      global_value_cents: 125050,
    });
  });

  it("detecta Remessa e mantém evidências e referências do PDF", async () => {
    const headers = [
      "ID do IJ",
      "Instrumento Jurídico (PC/Modalidade)",
      "Objeto do Contrato",
      "Parte do IJ",
      "Valor Global",
      "Situação da análise",
      "Fiscal confirmado no PDF",
      "Evidência do fiscal",
    ];
    const bytes = await workbookBuffer(
      headers,
      ["IJ-1", "CONTRATO 14/2026", "Objeto", "Empresa 12.345.678/0001-90", "R$ 10.000,00", "Revisão", "Pessoa", "Página 8"],
      2,
    );
    const extraction = await extractWorkbook(bytes, "AUTO");
    const normalized = parseRemessa(extraction.sheets, context);

    expect(extraction.module).toBe("REMESSA");
    expect(normalized.rows[0]).toMatchObject({
      contract_number: "14/2026",
      global_value_cents: 1_000_000,
      inspector_evidence: "Página 8",
    });
  });
});
