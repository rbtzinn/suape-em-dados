import { normalizeText } from "@/domain/normalization";
import type { CanonicalWriteRow } from "@/infra/google-sheets/repository";
import {
  digits,
  displayName,
  field,
  money,
  personHash,
  provenance,
  qualityIssue,
  stableId,
} from "../common";
import type { NormalizedResult, ParseContext, SourceSheet } from "../types";

export function parseOutsourced(sheets: SourceSheet[], context: ParseContext): NormalizedResult {
  const rows: CanonicalWriteRow[] = [];
  const issues: CanonicalWriteRow[] = [];
  for (const sheet of sheets) {
    for (const source of sheet.rows) {
      const person = field(source, "Nome do funcionário", "Nome do funcionario");
      if (!person) continue;
      const companyRaw = field(source, "Contratada");
      const cnpjRaw = field(source, "CNPJ da contratada");
      const contractRaw = field(source, "Nº do contrato", "N do contrato");
      const contractYear = field(source, "Ano do contrato");
      const recordId = stableId("outsourced", context.sourceFileHash, source.sheetName, source.rowNumber);
      const costRaw = field(source, "Custo individual");
      const remunerationRaw = field(source, "Remuneração", "Remuneracao");
      if (!companyRaw || !contractRaw) {
        issues.push({
          ...qualityIssue(context, source, recordId, "TERCEIRIZADO_CHAVE_INCOMPLETA", "Pessoa preservada, mas sem empresa ou contrato para conciliação."),
          module: "OUTSOURCED",
        });
      }
      const shift = field(source, "Turno");
      rows.push({
        record_id: recordId,
        person_hash: personHash("outsourced", person, companyRaw, contractRaw, contractYear),
        ugc: field(source, "UGC"),
        uge: field(source, "UGE"),
        object: field(source, "Objeto"),
        company_name: displayName(companyRaw),
        company_name_raw: companyRaw,
        cnpj: digits(cnpjRaw),
        cnpj_raw: cnpjRaw,
        contract_number: contractYear ? `${contractRaw}/${contractYear}` : contractRaw,
        contract_number_raw: contractRaw,
        contract_year: contractYear,
        role_name: field(source, "Função", "Funcao"),
        allocation: field(source, "Lotação", "Lotacao"),
        workday_raw: field(source, "Jornada"),
        shift_raw: shift,
        night_shift: /noturn|noite/.test(normalizeText(shift)),
        monthly_cost_raw: costRaw,
        monthly_cost_cents: money(costRaw),
        monthly_remuneration_raw: remunerationRaw,
        monthly_remuneration_cents: money(remunerationRaw),
        ...provenance(source, context),
      });
    }
  }
  return { target: "outsourced", rows, issues };
}
