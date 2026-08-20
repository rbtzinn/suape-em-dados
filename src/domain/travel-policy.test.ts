import { describe, expect, it } from "vitest";
import { evaluateTravelPolicy } from "./travel-policy";

describe("motor da política de viagens", () => {
  it("não transforma campo ausente em indício de não conformidade", () => {
    const findings = evaluateTravelPolicy({ destinationState: "PE", fullDailyQuantity: 1 });
    const request = findings.find((item) => item.ruleId === "PRAZO_SOLICITACAO");
    const overnight = findings.find((item) => item.ruleId === "DIARIA_PE_PERNOITE");
    expect(request?.status).toBe("NAO_VERIFICAVEL_COM_DADOS_LAI");
    expect(overnight?.status).toBe("NAO_VERIFICAVEL_COM_DADOS_LAI");
  });

  it("marca como conforme o limite nacional disponível", () => {
    const findings = evaluateTravelPolicy({
      destinationState: "SP",
      destinationCountry: "Brasil",
      dailyUnitCents: 90_294,
      roleGroup: "OTHER",
    });
    expect(findings.find((item) => item.ruleId === "LIMITE_DIARIA")?.status).toBe(
      "CONFORME",
    );
  });
});
