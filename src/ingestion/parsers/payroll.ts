import { normalizeText } from "@/domain/normalization";
import type { CanonicalWriteRow } from "@/infra/google-sheets/repository";
import { digits, field, money, personHash, provenance, stableId } from "../common";
import type { NormalizedResult, ParseContext, SourceSheet } from "../types";

function maskedCpf(value: string): string {
  const cpf = digits(value);
  if (cpf.length !== 11) return value.trim();
  return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
}

export function parsePayroll(sheets: SourceSheet[], context: ParseContext): NormalizedResult {
  const rows: CanonicalWriteRow[] = [];
  for (const sheet of sheets) {
    let name = "";
    let employeeNumber = "";
    let cpf = "";
    let category = "";
    let salary = "";
    for (const source of sheet.rows) {
      name = field(source, "Nome") || name;
      employeeNumber = field(source, "Chapa") || employeeNumber;
      cpf = field(source, "CPF") || cpf;
      category = field(source, "Tipo de funcionário", "Tipo de funcionario") || category;
      salary = field(source, "Salário", "Salario") || salary;
      const eventName = field(source, "Descrição do evento", "Descricao do evento");
      const amountRaw = field(source, "Valor da ficha");
      if (!eventName || !name || normalizeText(eventName).startsWith("total ")) continue;
      rows.push({
        record_id: stableId("payroll", context.sourceFileHash, source.sheetName, source.rowNumber),
        person_hash: personHash("payroll", employeeNumber, cpf, name),
        masked_cpf: maskedCpf(cpf),
        employee_category: category || sheet.title,
        event_name: eventName,
        period_raw: field(source, "Periódo", "Período", "Periodo"),
        event_type: field(source, "Provento/desconto/base"),
        amount_raw: amountRaw,
        amount_cents: money(amountRaw),
        salary_raw: salary,
        salary_cents: money(salary),
        ...provenance(source, context),
      });
    }
  }
  return { target: "payroll_events", rows, issues: [] };
}
