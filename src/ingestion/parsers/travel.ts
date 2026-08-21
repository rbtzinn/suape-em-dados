import type { CanonicalWriteRow } from "@/infra/google-sheets/repository";
import { field, isoDate, money, personHash, provenance, stableId } from "../common";
import type { NormalizedResult, ParseContext, SourceSheet } from "../types";

export function parseTravel(sheets: SourceSheet[], context: ParseContext): NormalizedResult {
  const rows: CanonicalWriteRow[] = [];
  for (const sheet of sheets) {
    for (const source of sheet.rows) {
      const traveler = field(source, "Nome do favorecido");
      if (!traveler) continue;
      const destination = field(source, "Cidade/País", "Cidade/Pais");
      const destinationParts = destination.split(/\s*\/\s*/);
      const outboundRaw = field(source, "Valor (ida)");
      const returnRaw = field(source, "Valor (volta)");
      const ticketTotalRaw = field(source, "Valor total de passagens");
      const dailyTotalRaw = field(source, "Valor total de diárias", "Valor total de diarias");
      const tripTotalRaw = field(source, "Valor total passagens + diárias", "Valor total passagens + diarias");
      const fullUnitRaw = field(source, "Valor unitário", "Valor unitario");
      const partialUnitRaw = field(source, "Valor unitário__2", "Valor unitario__2");
      rows.push({
        record_id: stableId("travel", context.sourceFileHash, source.sheetName, source.rowNumber),
        traveler_hash: personHash("travel", traveler, field(source, "Matrícula", "Matricula")),
        ugc: field(source, "UGC"),
        uge: field(source, "UGE"),
        role_name: field(source, "Cargo/Função", "Cargo/Funcao"),
        purpose: field(source, "Finalidade"),
        motivation: field(source, "Motivo"),
        trip_type: field(source, "Tipo"),
        origin_state: field(source, "UF"),
        origin_city: field(source, "Cidade"),
        destination_state: field(source, "UF__2"),
        destination_city: destinationParts[0] ?? destination,
        destination_country: destinationParts[1] ?? "",
        departure_date: isoDate(field(source, "Data (ida)")),
        return_date: isoDate(field(source, "Data (volta)")),
        airline: field(source, "Agência/ companhia aérea", "Agencia/ companhia aerea"),
        ticket_category: "",
        outbound_ticket_raw: outboundRaw,
        outbound_ticket_cents: money(outboundRaw),
        return_ticket_raw: returnRaw,
        return_ticket_cents: money(returnRaw),
        ticket_total_raw: ticketTotalRaw,
        ticket_total_cents: money(ticketTotalRaw),
        daily_total_raw: dailyTotalRaw,
        daily_total_cents: money(dailyTotalRaw),
        trip_total_raw: tripTotalRaw,
        trip_total_cents: money(tripTotalRaw),
        full_daily_quantity: field(source, "Quantidade"),
        partial_daily_quantity: field(source, "Quantidade__2"),
        full_daily_unit_cents: money(fullUnitRaw),
        partial_daily_unit_cents: money(partialUnitRaw),
        daily_unit_cents: money(fullUnitRaw) || money(partialUnitRaw),
        notes: field(source, "Observações", "Observacoes"),
        ...provenance(source, context),
      });
    }
  }
  return { target: "travel", rows, issues: [] };
}
