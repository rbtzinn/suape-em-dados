import { normalizeText } from "@/domain/normalization";

export interface ParsedCplMember {
  name: string;
  commissionRole: "PRESIDENTE" | "MEMBRO";
  memberType: "EFETIVO";
}

export interface ParsedCplOrdinance {
  number: string;
  year: string;
  title: string;
  purpose: string;
  commissionName: string;
  effectiveFrom: string;
  effectiveTo: string;
  members: ParsedCplMember[];
}

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isoDate(value: string): string {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return "";
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function commissionName(text: string): string {
  const normalized = normalizeText(text);
  if (normalized.includes("comissao especial de licitacao para arrendamentos portuarios")) {
    return "Comissão Especial de Licitação para Arrendamentos Portuários - CELAP";
  }
  if (normalized.includes("comissao de licitacao para obras de engenharia")) {
    return "Comissão de Licitação para Obras de Engenharia - CEL";
  }
  if (normalized.includes("comissao especial de aquisicao/ compras")) {
    return "Comissão Especial de Aquisição/Compras";
  }
  if (normalized.includes("comissao especial de aquisicao/compras")) {
    return "Comissão Especial de Aquisição/Compras";
  }
  if (normalized.includes("comissao permanente de licitacao")) {
    return "Comissão Permanente de Licitação - CPL";
  }
  throw new Error("A comissão não pôde ser identificada no texto da portaria.");
}

function extractMembers(text: string): ParsedCplMember[] {
  const block = text.match(
    /designar\s+os\s+servidores?,?\s+([\s\S]*?),?\s+para\s+sob\s+a\s+presid[eê]ncia\s+do\s+primeiro/i,
  )?.[1];
  if (!block) throw new Error("A lista de membros efetivos não foi encontrada na portaria.");

  const compacted = compact(block).replace(/,+\s*$/, "");
  const finalConjunction = compacted.toLocaleUpperCase("pt-BR").lastIndexOf(" E ");
  const delimited = finalConjunction >= 0
    ? `${compacted.slice(0, finalConjunction)},${compacted.slice(finalConjunction + 3)}`
    : compacted;
  const names = delimited
    .split(",")
    .map((name) => compact(name.replace(/^e\s+/i, "")))
    .filter((name) => name.split(" ").length >= 2);

  if (names.length < 2) {
    throw new Error("A portaria precisa ter ao menos dois membros efetivos identificáveis.");
  }
  return names.map((name, index) => ({
    name,
    commissionRole: index === 0 ? "PRESIDENTE" : "MEMBRO",
    memberType: "EFETIVO",
  }));
}

function purpose(text: string, name: string): string {
  const clause = text.match(/\bII\s*-\s*([\s\S]*?)(?=\bIII\s*-)/i)?.[1];
  if (name.includes("Arrendamentos Portuários") && clause) return compact(clause);
  return "Comissão constituída conforme o item I da portaria; contratos e processos específicos não foram relacionados no documento.";
}

export function parseCplOrdinance(text: string): ParsedCplOrdinance {
  const clean = compact(text);
  const reference = clean.match(/portaria\s+n[º°o]?\s*(\d{1,4})\s*\/\s*(\d{4})/i);
  if (!reference) throw new Error("O número e o ano da portaria não foram encontrados.");
  const dates = clean.match(
    /mandato\s+de\s+(\d{1,2}\/\d{1,2}\/\d{4})\s*(?:à|a)\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
  );
  if (!dates) throw new Error("A vigência da comissão não foi encontrada na portaria.");
  const name = commissionName(clean);
  const number = reference[1].padStart(3, "0");
  const year = reference[2];

  return {
    number,
    year,
    title: `Portaria nº ${number}/${year}`,
    purpose: purpose(clean, name),
    commissionName: name,
    effectiveFrom: isoDate(dates[1]),
    effectiveTo: isoDate(dates[2]),
    members: extractMembers(clean),
  };
}
