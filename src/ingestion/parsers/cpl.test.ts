import { describe, expect, it } from "vitest";

import { parseCplOrdinance } from "./cpl";

describe("parseCplOrdinance", () => {
  it("extrai referência, vigência, comissão, presidente e membros", () => {
    const source = `
      PORTARIA Nº 012/2026
      I - Designar os servidores ANA TESTE DA SILVA, BRUNO EXEMPLO DE SOUZA
      e CARLA MODELO FERREIRA, para sob a presidência do primeiro, constituírem a
      Comissão Permanente de Licitação - CPL, como membros efetivos, com mandato
      de 01/01/2026 à 31/12/2026.
      II - Integrarão a referida comissão membros eventuais.
      III - A comissão seguirá o regulamento interno.
    `;
    const result = parseCplOrdinance(source);

    expect(result.number).toBe("012");
    expect(result.effectiveFrom).toBe("2026-01-01");
    expect(result.effectiveTo).toBe("2026-12-31");
    expect(result.members).toHaveLength(3);
    expect(result.members[0].commissionRole).toBe("PRESIDENTE");
    expect(result.members[2].name).toBe("CARLA MODELO FERREIRA");
  });
});
