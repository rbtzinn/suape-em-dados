import { normalizeText } from "./normalization";

export type ComplianceStatus =
  | "CONFORME"
  | "ATENCAO"
  | "INDICIO_NAO_CONFORMIDADE"
  | "REVISAO_NECESSARIA"
  | "NAO_VERIFICAVEL_COM_DADOS_LAI"
  | "NAO_APLICAVEL";

export interface TravelPolicyInput {
  destinationState?: string | null;
  destinationCountry?: string | null;
  departureDate?: string | null;
  returnDate?: string | null;
  requestDate?: string | null;
  accountabilityDate?: string | null;
  fullDailyQuantity?: number | null;
  partialDailyQuantity?: number | null;
  dailyUnitCents?: number | null;
  roleGroup?: "EXECUTIVE" | "COORDINATION" | "OTHER" | null;
}

export interface PolicyFinding {
  ruleId: string;
  title: string;
  status: ComplianceStatus;
  reason: string;
}

const DOMESTIC_DAILY_LIMITS = {
  EXECUTIVE: { pe: 52_093, outsidePe: 104_186 },
  COORDINATION: { pe: 45_147, outsidePe: 97_240 },
  OTHER: { pe: 38_201, outsidePe: 90_294 },
} as const;

function daysBetween(first: string, second: string): number | null {
  const start = Date.parse(first);
  const end = Date.parse(second);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.floor((end - start) / 86_400_000);
}

export function evaluateTravelPolicy(input: TravelPolicyInput): PolicyFinding[] {
  const findings: PolicyFinding[] = [];
  const destinationState = normalizeText(input.destinationState).toUpperCase();
  const destinationCountry = normalizeText(input.destinationCountry);

  if (!input.requestDate || !input.departureDate) {
    findings.push({
      ruleId: "PRAZO_SOLICITACAO",
      title: "Antecedência da solicitação",
      status: "NAO_VERIFICAVEL_COM_DADOS_LAI",
      reason: "A base LAI não informa a data da solicitação e/ou da partida.",
    });
  } else {
    const leadDays = daysBetween(input.requestDate, input.departureDate);
    findings.push({
      ruleId: "PRAZO_SOLICITACAO",
      title: "Antecedência da solicitação",
      status: leadDays !== null && leadDays >= 5 ? "CONFORME" : "ATENCAO",
      reason:
        leadDays === null
          ? "As datas não puderam ser interpretadas."
          : `${leadDays} dia(s) corrido(s) entre solicitação e partida; validar dias úteis.`,
    });
  }

  const dailyQuantity = (input.fullDailyQuantity ?? 0) + (input.partialDailyQuantity ?? 0);
  if (destinationState === "PE" && dailyQuantity > 0) {
    if (!input.departureDate || !input.returnDate) {
      findings.push({
        ruleId: "DIARIA_PE_PERNOITE",
        title: "Diária em Pernambuco",
        status: "NAO_VERIFICAVEL_COM_DADOS_LAI",
        reason: "Não há datas suficientes para confirmar pernoite.",
      });
    } else {
      const tripDays = daysBetween(input.departureDate, input.returnDate);
      findings.push({
        ruleId: "DIARIA_PE_PERNOITE",
        title: "Diária em Pernambuco",
        status: tripDays !== null && tripDays > 0 ? "CONFORME" : "REVISAO_NECESSARIA",
        reason:
          tripDays !== null && tripDays > 0
            ? "O período indica ao menos um pernoite."
            : "Há diária registrada, mas o período não evidencia pernoite.",
      });
    }
  } else {
    findings.push({
      ruleId: "DIARIA_PE_PERNOITE",
      title: "Diária em Pernambuco",
      status: "NAO_APLICAVEL",
      reason: "A regra não se aplica ao destino ou não há diária registrada.",
    });
  }

  if (!input.roleGroup || !input.dailyUnitCents || !destinationState) {
    findings.push({
      ruleId: "LIMITE_DIARIA",
      title: "Limite unitário de diária",
      status: "NAO_VERIFICAVEL_COM_DADOS_LAI",
      reason: "Cargo, destino ou valor unitário não está disponível para a regra.",
    });
  } else if (destinationCountry && !["brasil", "brazil"].includes(destinationCountry)) {
    findings.push({
      ruleId: "LIMITE_DIARIA",
      title: "Limite unitário de diária",
      status: "REVISAO_NECESSARIA",
      reason: "Viagem internacional exige validação do câmbio e do limite em dólar.",
    });
  } else {
    const limits = DOMESTIC_DAILY_LIMITS[input.roleGroup];
    const limit = destinationState === "PE" ? limits.pe : limits.outsidePe;
    findings.push({
      ruleId: "LIMITE_DIARIA",
      title: "Limite unitário de diária",
      status: input.dailyUnitCents <= limit ? "CONFORME" : "INDICIO_NAO_CONFORMIDADE",
      reason:
        input.dailyUnitCents <= limit
          ? "O valor unitário está dentro do limite da categoria."
          : "O valor unitário supera o limite; confirmar categoria, câmbio e exceções.",
    });
  }

  findings.push(
    input.accountabilityDate && input.returnDate
      ? {
          ruleId: "PRESTACAO_CONTAS",
          title: "Prazo de prestação de contas",
          status:
            (daysBetween(input.returnDate, input.accountabilityDate) ?? 999) <= 14
              ? "CONFORME"
              : "REVISAO_NECESSARIA",
          reason: "Prazo estimado em dias corridos; a política usa dias úteis.",
        }
      : {
          ruleId: "PRESTACAO_CONTAS",
          title: "Prazo de prestação de contas",
          status: "NAO_VERIFICAVEL_COM_DADOS_LAI",
          reason: "A data de prestação de contas não existe na base LAI.",
        },
  );

  return findings;
}
