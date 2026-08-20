import type { CanonicalWriteRow } from "@/infra/google-sheets/repository";
import { normalizeText, parseMoneyToCents } from "@/domain/normalization";
import {
  digits,
  displayName,
  field,
  identifier,
  isoDate,
  provenance,
  qualityIssue,
  stableId,
} from "../common";
import type { NormalizedResult, ParseContext, SourceSheet } from "../types";

function normalizedContract(number: string, year: string): string {
  const raw = displayName(number);
  if (!raw) return "";
  if (year && !identifier(raw).endsWith(identifier(year))) return `${raw}/${year}`;
  return raw;
}

export function parseLai(sheets: SourceSheet[], context: ParseContext): NormalizedResult {
  const rows: CanonicalWriteRow[] = [];
  const issues: CanonicalWriteRow[] = [];

  for (const sheet of sheets) {
    for (const source of sheet.rows) {
      const companyRaw = field(source, "Contratada");
      const contractRaw = field(source, "Nº do contrato", "N do contrato");
      const contractYear = field(source, "Ano do contrato");
      const provisionalId = stableId("lai", context.sourceFileHash, source.sheetName, source.rowNumber);

      if (!companyRaw || !contractRaw || !contractYear) {
        issues.push({
          ...qualityIssue(context, source, provisionalId, "LAI_CHAVE_INCOMPLETA", "Linha preservada na camada bruta, mas sem empresa, contrato e ano suficientes para normalização.", { severity: "ERROR" }),
          module: "LAI",
        });
        continue;
      }

      const contractNumber = normalizedContract(contractRaw, contractYear);
      const globalValueRaw = field(source, "Valor total do contrato");
      const monthlyValueRaw = field(source, "Valor mensal");
      const executedValueRaw = field(source, "Valor executado");
      const valueAddendumRaw = field(source, "Aditivo de valor");
      const globalValue = parseMoneyToCents(globalValueRaw);
      const recordId = stableId("lai", context.sourceFileHash, contractNumber, companyRaw, source.rowNumber);

      if (globalValueRaw && globalValue === null) {
        issues.push({
          ...qualityIssue(context, source, recordId, "LAI_VALOR_INVALIDO", "O valor total do contrato não pôde ser convertido para centavos.", { fieldName: "Valor total do contrato", rawValue: globalValueRaw }),
          module: "LAI",
        });
      }

      const objectRaw = field(source, "Objeto");
      const statusRaw = field(source, "Situação");
      const inspectorRaw = field(source, "Nome do fiscal do contrato");
      const cnpjRaw = field(source, "CNPJ da contratada");
      rows.push({
        record_id: recordId,
        order_number_raw: field(source, "Nº de ordem", "N de ordem"),
        contract_number: contractNumber,
        contract_number_raw: contractRaw,
        contract_year: contractYear,
        company_name: displayName(companyRaw),
        company_name_raw: companyRaw,
        cnpj: digits(cnpjRaw),
        cnpj_raw: cnpjRaw,
        object: objectRaw,
        object_raw: objectRaw,
        procurement_process: field(source, "Nº processo licitatório", "N processo licitatorio"),
        commitment_note: field(source, "Nº nota de empenho", "N nota de empenho"),
        procurement_modality: field(source, "Modalidade de licitação / procedimento de compra direta"),
        status: normalizeText(statusRaw).toUpperCase(),
        status_raw: statusRaw,
        global_value_raw: globalValueRaw,
        global_value_cents: globalValue ?? 0,
        monthly_value_raw: monthlyValueRaw,
        monthly_value_cents: parseMoneyToCents(monthlyValueRaw) ?? 0,
        executed_value_raw: executedValueRaw,
        executed_value_cents: parseMoneyToCents(executedValueRaw) ?? 0,
        term_extension_raw: field(source, "Aditivo de prazo"),
        apostille_number_raw: field(source, "Nº do apostilamento", "N do apostilamento"),
        value_addendum_raw: valueAddendumRaw,
        value_addendum_cents: parseMoneyToCents(valueAddendumRaw) ?? 0,
        manager_name: "",
        inspector_name: displayName(inspectorRaw),
        inspector_name_raw: inspectorRaw,
        start_date: isoDate(field(source, "Início da vigência")),
        end_date: isoDate(field(source, "Fim da vigência")),
        ...provenance(source, context),
      });
    }
  }

  return { target: "lai_contracts", rows, issues };
}
