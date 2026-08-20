import type { CanonicalWriteRow } from "@/infra/google-sheets/repository";
import { normalizeText, parseMoneyToCents } from "@/domain/normalization";
import {
  booleanValue,
  digits,
  displayName,
  field,
  identifier,
  provenance,
  qualityIssue,
  stableId,
} from "../common";
import type { NormalizedResult, ParseContext, SourceSheet } from "../types";

function instrumentParts(label: string) {
  const upper = label.toUpperCase();
  const match = upper.match(
    /(?:CONTRATO(?:\s+COM\s+PC\s*\/\s*ARP)?|ARP|CONVENIO|TERMO)[^0-9A-Z]*([0-9A-Z.-]+)\s*\/\s*(20\d{2})/,
  );
  const type =
    upper.match(/CONTRATO\s+COM\s+PC\s*\/\s*ARP|CONTRATO|ARP|CONVENIO|TERMO[^0-9]*/)?.[0]
      ?.replace(/\s+/g, " ")
      .trim() ?? "INSTRUMENTO";
  return {
    contractNumber: match ? `${match[1]}/${match[2]}` : "",
    contractYear: match?.[2] ?? "",
    numberNormalized: match ? identifier(`${match[1]}/${match[2]}`) : identifier(label),
    type,
  };
}

function pdfAvailable(value: string): boolean {
  const normalized = normalizeText(value);
  return Boolean(normalized && !normalized.includes("sem documento") && !normalized.includes("indisponivel"));
}

export function parseRemessa(
  sheets: SourceSheet[],
  context: ParseContext,
): NormalizedResult {
  const rows: CanonicalWriteRow[] = [];
  const issues: CanonicalWriteRow[] = [];

  for (const sheet of sheets) {
    for (const source of sheet.rows) {
      const instrumentId = field(source, "ID do IJ");
      const provisionalId = stableId("remessa", context.sourceFileHash, source.sheetName, source.rowNumber);
      if (!instrumentId) {
        issues.push({
          ...qualityIssue(context, source, provisionalId, "REMESSA_ID_AUSENTE", "Linha preservada na camada bruta, mas sem ID do IJ para normalização.", { severity: "ERROR", fieldName: "ID do IJ" }),
          module: "REMESSA",
        });
        continue;
      }

      const instrumentLabel = field(source, "Instrumento Jurídico (PC/Modalidade)", "Instrumento Jurídico");
      const parts = instrumentParts(instrumentLabel);
      const party = field(source, "Parte do IJ");
      const globalValueRaw = field(source, "Valor Global");
      const parsedValue = parseMoneyToCents(globalValueRaw);
      const analysisStatus = field(source, "Situação da análise");
      const mainPdf = field(source, "PDF principal");
      const pdfCorrespondence = field(source, "Correspondência com PDF");
      const manager = field(source, "Gestor confirmado no PDF");
      const inspector = field(source, "Fiscal confirmado no PDF");
      const recordId = stableId("remessa", context.sourceFileHash, instrumentId, source.rowNumber);

      if (globalValueRaw && parsedValue === null) {
        issues.push({
          ...qualityIssue(context, source, recordId, "REMESSA_VALOR_INVALIDO", "O valor global não pôde ser convertido para centavos.", { fieldName: "Valor Global", rawValue: globalValueRaw }),
          module: "REMESSA",
        });
      }

      rows.push({
        record_id: recordId,
        instrument_id: displayName(instrumentId),
        instrument_type: parts.type,
        instrument_number_normalized: parts.numberNormalized,
        contract_number: parts.contractNumber,
        contract_year: parts.contractYear,
        procurement_modality: instrumentLabel,
        jurisdiction_unit: field(source, "Unidade Jurisdicionada (Unidade/Subunidade)"),
        company_name: party,
        cnpj: digits(party).match(/\d{14}/)?.[0] ?? "",
        object: field(source, "Objeto do Contrato"),
        object_normalized: normalizeText(field(source, "Objeto do Contrato")),
        nature_classification: field(source, "Natureza (Classificação do Objeto)"),
        global_value_raw: globalValueRaw,
        stage: field(source, "Estágio"),
        analysis_status: analysisStatus,
        global_value_cents: parsedValue ?? 0,
        party_raw: party,
        validity_raw: field(source, "Vigência"),
        work_nature: field(source, "Natureza da Obra"),
        work_status: field(source, "Situação da Obra"),
        last_update_raw: field(source, "Última Atualização"),
        manager_confirmed: booleanValue(manager),
        manager_name: manager,
        manager_pages: field(source, "Página(s) do gestor"),
        manager_evidence: field(source, "Evidência do gestor"),
        inspector_confirmed: booleanValue(inspector),
        inspector_name: inspector,
        inspector_pages: field(source, "Página(s) do fiscal"),
        inspector_evidence: field(source, "Evidência do fiscal"),
        main_pdf_available: pdfAvailable(mainPdf),
        main_pdf_raw: mainPdf,
        pdf_file: field(source, "Arquivo do PDF"),
        pdf_pages: field(source, "Páginas do PDF"),
        remessa_responsible_raw: field(source, "Fiscal/Responsável no Remessa"),
        pdf_correspondence: pdfCorrespondence,
        portal_document_types: field(source, "Tipos de documento listados no portal"),
        complementary_documents: field(source, "Documentos complementares listados"),
        needs_review: !normalizeText(analysisStatus).includes("conclu"),
        portal_divergence: normalizeText(pdfCorrespondence).includes("diverg"),
        recommended_action: field(source, "Pendência / ação recomendada"),
        detail_url: field(source, "URL de detalhe"),
        pdf_sha256: field(source, "SHA-256 do PDF"),
        collected_at_raw: field(source, "Coletado em"),
        pdf_size_bytes: field(source, "Tamanho do PDF (bytes)"),
        verification_method: field(source, "Método de verificação"),
        ...provenance(source, context),
      });
    }
  }

  return { target: "remessa_instruments", rows, issues };
}
