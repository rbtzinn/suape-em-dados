import { describe, expect, it } from "vitest";

import {
  createReconciliationRun,
  reconcileContracts,
} from "./reconcile-contracts";

const run = createReconciliationRun(
  "2026-06",
  "batch-remessa",
  "batch-lai",
  "2026-08-20T12:00:00Z",
);

describe("reconciliação canônica de contratos", () => {
  it("grava correspondência forte com razões e metadados da execução", () => {
    const reviews = reconcileContracts(
      [{
        record_id: "lai-1",
        contract_number: "014/2026",
        cnpj: "12345678000199",
        company_name: "Empresa Portuária",
        object: "Manutenção do terminal",
      }],
      [{
        record_id: "remessa-1",
        contract_number: "14/2026",
        cnpj: "12345678000199",
        company_name: "Empresa Portuária Ltda",
        object: "Manutenção do terminal portuário",
      }],
      run,
    );

    expect(reviews).toHaveLength(1);
    expect(reviews[0].match_status).toMatch(/MATCH_EXATO|MATCH_FORTE/);
    expect(reviews[0].reconciliation_run_id).toBe(run.runId);
    expect(String(reviews[0].match_reasons_json)).toContain("CNPJ coincide");
  });

  it("não escolhe silenciosamente entre candidatos próximos", () => {
    const reviews = reconcileContracts(
      [{ record_id: "lai-1", contract_number: "14/2026", company_name: "Empresa A" }],
      [
        { record_id: "remessa-1", contract_number: "14/2026", company_name: "Empresa A" },
        { record_id: "remessa-2", contract_number: "14/2026", company_name: "Empresa A" },
      ],
      run,
    );

    expect(reviews[0].match_status).toBe("MATCH_AMBIGUO");
    expect(reviews[0].remessa_record_id).toBe("");
    expect(reviews.filter((review) => review.match_status === "SOMENTE_REMESSA")).toHaveLength(2);
  });
});
