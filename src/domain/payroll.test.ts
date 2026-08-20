import { describe, expect, it } from "vitest";
import { normalizePayrollRows } from "./payroll";

describe("normalização da folha", () => {
  it("propaga a pessoa dentro do bloco e ignora linhas de total", () => {
    const events = normalizePayrollRows([
      {
        name: "Pessoa A",
        registration: "001",
        cpf: "***.123.***-**",
        employeeType: "Funcionário",
        event: "Salário",
        eventType: "P",
        value: "1.000,00",
      },
      { event: "Desconto", eventType: "D", value: "100,00" },
      { event: "Total Pessoa A", eventType: "P", value: "900,00" },
    ]);

    expect(events).toHaveLength(2);
    expect(events[1].name).toBe("Pessoa A");
    expect(events[1].eventType).toBe("D");
  });
});
