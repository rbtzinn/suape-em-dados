import { describe, expect, it } from "vitest";
import {
  normalizeIdentifier,
  normalizeText,
  parseMoneyToCents,
} from "./normalization";

describe("normalização", () => {
  it("normaliza texto sem perder o valor bruto original", () => {
    expect(normalizeText("  Comissão   de Fiscalização  ")).toBe(
      "comissao de fiscalizacao",
    );
  });

  it("normaliza identificadores", () => {
    expect(normalizeIdentifier("CT nº 014/2026")).toBe("ctn0142026");
  });

  it("converte moeda brasileira para centavos", () => {
    expect(parseMoneyToCents("R$ 1.234.567,89")).toBe(123_456_789);
    expect(parseMoneyToCents(125.4)).toBe(12_540);
  });
});
