import { normalizeText } from "./normalization";

export type CplClassification =
  | "OK"
  | "ATENCAO"
  | "POTENCIAL_CONFLITO"
  | "REVISAO_NECESSARIA";

export interface CplAssignmentRecord {
  assignmentId: string;
  ordinanceId: string;
  personName: string;
  commissionName: string;
  commissionRole: string;
  effectiveFrom: string;
  effectiveTo: string;
}

export interface CplRemessaRecord {
  recordId: string;
  instrumentId: string;
  contractNumber: string;
  managerName: string;
  inspectorName: string;
  responsibleName: string;
  validityRaw: string;
  object: string;
  importBatchId: string;
}

interface RoleMatch {
  role: "GESTOR" | "FISCAL" | "RESPONSAVEL_REMESSA";
  score: number;
}

export interface CplReconciliationResult {
  assignment: CplAssignmentRecord;
  remessa: CplRemessaRecord | null;
  score: number;
  matchStatus:
    | "MATCH_EXATO"
    | "MATCH_PARCIAL"
    | "SOMENTE_CAMPO_GENERICO"
    | "SEM_CORRESPONDENCIA";
  classification: CplClassification;
  contractRole: string;
  periodOverlap: boolean | null;
  scopeLinked: boolean;
  reasons: string[];
}

function normalizedName(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function personNameScore(left: string, right: string): number {
  const first = normalizedName(left);
  const second = normalizedName(right);
  if (!first || !second) return 0;
  if (first === second) return 100;
  const shorter = first.length <= second.length ? first : second;
  const longer = first.length > second.length ? first : second;
  const tokenCount = shorter.split(" ").filter(Boolean).length;
  return tokenCount >= 2 && longer.includes(shorter) ? 85 : 0;
}

function brDateRange(value: string): [string, string] | null {
  const dates = [...value.matchAll(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g)].map(
    (match) => `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`,
  );
  return dates.length >= 2 ? [dates[0], dates[1]] : null;
}

export function periodsOverlap(
  commissionFrom: string,
  commissionTo: string,
  contractValidity: string,
): boolean | null {
  const contract = brDateRange(contractValidity);
  if (!commissionFrom || !commissionTo || !contract) return null;
  return commissionFrom <= contract[1] && contract[0] <= commissionTo;
}

function roleMatches(
  assignment: CplAssignmentRecord,
  contract: CplRemessaRecord,
): RoleMatch[] {
  const candidates: Array<[RoleMatch["role"], string]> = [
    ["GESTOR", contract.managerName],
    ["FISCAL", contract.inspectorName],
    ["RESPONSAVEL_REMESSA", contract.responsibleName],
  ];
  return candidates.flatMap(([role, name]) => {
    const score = personNameScore(assignment.personName, name);
    return score > 0 ? [{ role, score }] : [];
  });
}

function roleLabel(roles: RoleMatch[]): string {
  return [...new Set(roles.map((role) => role.role))].join(" + ");
}

function classify(
  roles: RoleMatch[],
  overlap: boolean | null,
  incompatibilityEvidence: boolean,
): CplClassification {
  const exactConfirmed = roles.some(
    (role) => role.score === 100 && ["GESTOR", "FISCAL"].includes(role.role),
  );
  if (incompatibilityEvidence && exactConfirmed && overlap === true) {
    return "POTENCIAL_CONFLITO";
  }
  if (exactConfirmed && overlap === true) return "ATENCAO";
  if (exactConfirmed && overlap === false) return "OK";
  return "REVISAO_NECESSARIA";
}

function matchReasons(
  roles: RoleMatch[],
  overlap: boolean | null,
  classification: CplClassification,
): string[] {
  const reasons: string[] = [];
  for (const role of roles) {
    const quality = role.score === 100 ? "nome integral idêntico" : "nome abreviado ou parcial";
    reasons.push(`${quality} no papel ${role.role.toLocaleLowerCase("pt-BR")}`);
  }
  if (overlap === true) reasons.push("vigências da comissão e do instrumento se sobrepõem");
  if (overlap === false) reasons.push("vigências da comissão e do instrumento não se sobrepõem");
  if (overlap === null) reasons.push("vigência contratual insuficiente para comparação automática");
  if (roles.every((role) => role.role === "RESPONSAVEL_REMESSA")) {
    reasons.push("o campo Responsável no Remessa é genérico e não comprova gestor ou fiscal");
  }
  if (classification === "ATENCAO") {
    reasons.push("a coincidência exige análise contextual, mas não indica irregularidade isoladamente");
  }
  return reasons;
}

export function reconcileCplAssignments(
  assignments: CplAssignmentRecord[],
  contracts: CplRemessaRecord[],
  options: { linkedContractIds?: Set<string>; incompatibilityEvidenceIds?: Set<string> } = {},
): CplReconciliationResult[] {
  return assignments.flatMap((assignment): CplReconciliationResult[] => {
    const matches = contracts.flatMap((contract): CplReconciliationResult[] => {
      const roles = roleMatches(assignment, contract);
      if (roles.length === 0) return [];
      const overlap = periodsOverlap(
        assignment.effectiveFrom,
        assignment.effectiveTo,
        contract.validityRaw,
      );
      const scopeLinked = options.linkedContractIds?.has(contract.recordId) ?? false;
      const classification = classify(
        roles,
        overlap,
        options.incompatibilityEvidenceIds?.has(contract.recordId) ?? false,
      );
      const confirmedRoles = roles.filter((role) => ["GESTOR", "FISCAL"].includes(role.role));
      const exactConfirmed = confirmedRoles.some((role) => role.score === 100);
      const exactGeneric = roles.some(
        (role) => role.role === "RESPONSAVEL_REMESSA" && role.score === 100,
      );
      return [{
        assignment,
        remessa: contract,
        score: Math.max(...roles.map((role) => role.score)),
        matchStatus: exactConfirmed
          ? "MATCH_EXATO" as const
          : exactGeneric && confirmedRoles.length === 0
            ? "SOMENTE_CAMPO_GENERICO" as const
            : "MATCH_PARCIAL" as const,
        classification,
        contractRole: roleLabel(roles),
        periodOverlap: overlap,
        scopeLinked,
        reasons: matchReasons(roles, overlap, classification),
      }];
    });

    return matches.length > 0 ? matches : [{
      assignment,
      remessa: null,
      score: 0,
      matchStatus: "SEM_CORRESPONDENCIA" as const,
      classification: "OK" as const,
      contractRole: "",
      periodOverlap: null,
      scopeLinked: false,
      reasons: [
        "nenhuma correspondência nominal encontrada nos campos de gestor, fiscal ou responsável do Remessa",
        "ser membro de comissão, isoladamente, não indica irregularidade",
      ],
    }];
  });
}
