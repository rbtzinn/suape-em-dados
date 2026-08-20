import { describe, expect, it } from "vitest";

import { buildFromWorkbook } from "./snapshot-builder";

describe("snapshot da base canônica", () => {
  it("usa lotes publicados, última competência e exclui viagem fora do recorte", () => {
    const snapshot = buildFromWorkbook({
      import_batches: [{
        batch_id: "b1",
        source_file: "fonte.xlsx",
        module: "REMESSA",
        competence: "2026-06",
        status: "PUBLISHED",
        record_count: "1",
        imported_at: "2026-08-20T12:00:00Z",
      }],
      remessa_instruments: [{
        record_id: "r1",
        instrument_id: "IJ-1",
        company_name: "Empresa A",
        object: "Objeto A",
        global_value_cents: "10000",
        main_pdf_available: "TRUE",
        manager_confirmed: "TRUE",
        inspector_confirmed: "TRUE",
        needs_review: "FALSE",
        portal_divergence: "FALSE",
        competence: "2026-06",
        import_batch_id: "b1",
      }],
      lai_contracts: [
        { record_id: "l0", contract_number: "0/2026", competence: "2026-03", import_batch_id: "b1" },
        { record_id: "l1", contract_number: "1/2026", global_value_cents: "9000", competence: "2026-06", import_batch_id: "b1" },
      ],
      contract_reviews: [{
        review_id: "review-1",
        remessa_record_id: "r1",
        lai_record_id: "l1",
        match_status: "MATCH_EXATO",
        match_score: "95",
        match_reasons_json: '{"reasons":["contrato coincide"]}',
        reconciliation_run_id: "run-1",
        generated_at: "2026-08-20T12:00:00Z",
      }],
      outsourced: [{
        record_id: "o1",
        person_hash: "p1",
        company_name: "Empresa A",
        contract_number: "1/2026",
        monthly_cost_cents: "5000",
        monthly_remuneration_cents: "4000",
        competence: "2026-07",
        import_batch_id: "b1",
      }],
      payroll_events: [
        { record_id: "p1", person_hash: "x", event_type: "P", amount_cents: "1000", source_sheet: "FUNCIONÁRIO JUNHO 2026", competence: "2026-06", import_batch_id: "b1" },
        { record_id: "p2", person_hash: "x", event_type: "D", amount_cents: "200", source_sheet: "FUNCIONÁRIO JUNHO 2026", competence: "2026-06", import_batch_id: "b1" },
      ],
      travel: [
        { record_id: "t-jul", source_row: "9", origin_city: "Recife", destination_city: "Brasília", trip_total_cents: "700", ticket_total_cents: "400", daily_total_cents: "300", competence: "2026-07", import_batch_id: "b1" },
        { record_id: "t-ago", source_row: "9", origin_city: "Recife", destination_city: "Salvador", trip_total_cents: "900", competence: "2026-08", import_batch_id: "b1" },
      ],
      travel_rule_results: [{
        result_id: "tr1",
        travel_record_id: "t-jul",
        status: "CONFORME",
        import_batch_id: "b1",
      }],
      data_quality_issues: [{
        issue_id: "q1",
        import_batch_id: "b1",
        module: "TRAVEL",
        record_id: "t-ago",
        rule_code: "TRAVEL_APOS_COMPETENCIA_ARQUIVO",
        status: "OPEN",
      }],
    });

    expect(snapshot.contracts.remessaRecords).toBe(1);
    expect(snapshot.contracts.laiRecords).toBe(1);
    expect(snapshot.contracts.pdfCollected).toBe(1);
    expect(snapshot.contracts.bothConfirmed).toBe(1);
    expect(snapshot.reconciliation.exact).toBe(1);
    expect(snapshot.outsourced.latestPeople).toBe(1);
    expect(snapshot.payroll.netCents).toBe(800);
    expect(snapshot.travel.competence).toBe("Jul/2026");
    expect(snapshot.travel.records).toBe(1);
  });
});
