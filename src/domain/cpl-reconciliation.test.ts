import { describe, expect, it } from "vitest";

import {
  periodsOverlap,
  personNameScore,
  reconcileCplAssignments,
  type CplAssignmentRecord,
  type CplRemessaRecord,
} from "./cpl-reconciliation";

const assignment: CplAssignmentRecord = {
  assignmentId: "a-1",
  ordinanceId: "p-1",
  personName: "Ana Exemplo da Silva",
  commissionName: "Comissão de Teste",
  commissionRole: "MEMBRO",
  effectiveFrom: "2026-01-01",
  effectiveTo: "2026-12-31",
};

function contract(overrides: Partial<CplRemessaRecord> = {}): CplRemessaRecord {
  return {
    recordId: "r-1",
    instrumentId: "100",
    contractNumber: "001/2026",
    managerName: "",
    inspectorName: "",
    responsibleName: "",
    validityRaw: "01/03/2026 à 01/03/2027",
    object: "Serviço de teste",
    importBatchId: "b-1",
    ...overrides,
  };
}

describe("reconciliação CPL x Remessa", () => {
  it("normaliza acentos e distingue correspondência parcial", () => {
    expect(personNameScore("José de Ávila", "jose de avila")).toBe(100);
    expect(personNameScore("Ana Exemplo da Silva", "Ana Exemplo")).toBe(85);
  });

  it("detecta sobreposição de vigências", () => {
    expect(periodsOverlap("2026-01-01", "2026-12-31", "01/03/2026 à 01/03/2027"))
      .toBe(true);
  });

  it("classifica papel confirmado concomitante como atenção, não conflito", () => {
    const [result] = reconcileCplAssignments(
      [assignment],
      [contract({ inspectorName: "Ana Exemplo da Silva" })],
    );
    expect(result.classification).toBe("ATENCAO");
    expect(result.matchStatus).toBe("MATCH_EXATO");
  });

  it("mantém campo genérico e nome parcial em revisão humana", () => {
    const [result] = reconcileCplAssignments(
      [assignment],
      [contract({ responsibleName: "Ana Exemplo" })],
    );
    expect(result.classification).toBe("REVISAO_NECESSARIA");
    expect(result.matchStatus).toBe("MATCH_PARCIAL");
  });

  it("marca como OK quando não existe correspondência nominal", () => {
    const [result] = reconcileCplAssignments([assignment], [contract()]);
    expect(result.classification).toBe("OK");
    expect(result.remessa).toBeNull();
  });
});
