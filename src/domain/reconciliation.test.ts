import { describe, expect, it } from "vitest";
import { reconcileRecord } from "./reconciliation";

describe("conciliação Remessa × LAI", () => {
  it("prioriza o ID do instrumento como correspondência exata", () => {
    const result = reconcileRecord(
      { id: "IJ-2026-014", companyName: "Empresa A" },
      [
        { id: "IJ-2026-014", companyName: "Empresa A" },
        { id: "IJ-2026-099", companyName: "Empresa A" },
      ],
    );
    expect(result.status).toBe("EXACT");
    expect(result.selected?.reasons).toContain("ID do instrumento idêntico");
  });

  it("não escolhe silenciosamente entre candidatos equivalentes", () => {
    const result = reconcileRecord(
      { contractNumber: "14/2026" },
      [
        { id: "A", contractNumber: "14/2026" },
        { id: "B", contractNumber: "14/2026" },
      ],
    );
    expect(result.status).toBe("AMBIGUOUS");
    expect(result.selected).toBeNull();
  });

  it("mantém sem correspondência quando a evidência é fraca", () => {
    expect(
      reconcileRecord({ companyName: "Empresa A" }, [{ companyName: "Empresa A" }]).status,
    ).toBe("NO_MATCH");
  });
});
