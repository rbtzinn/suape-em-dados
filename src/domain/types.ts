export type Role = "ADMIN" | "ANALYST" | "VIEWER";

export type DataMode = "demo" | "sheets" | "degraded";

export type Tone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

export interface ContractSummary {
  id: string;
  company: string;
  object: string;
  status: string;
  valueCents: number;
  source: "Remessa" | "LAI" | "Consolidado";
  manager: string;
  inspector: string;
  analysis: string;
}

export interface ReconciliationSummary {
  exact: number;
  strong: number;
  probable: number;
  ambiguous: number;
  divergence: number;
  onlyLai: number;
  onlyRemessa: number;
  examples: ReconciliationExample[];
}

export interface ReconciliationExample {
  id: string;
  laiLabel: string;
  remessaLabel: string;
  company: string;
  score: number;
  reasons: string[];
  status: string;
}

export interface OutsourcedPoint {
  month: string;
  people: number;
  costCents: number;
  remunerationCents: number;
}

export interface PayrollCategory {
  category: string;
  people: number;
  netCents: number;
}

export interface TravelExample {
  id: string;
  route: string;
  period: string;
  purpose: string;
  totalCents: number;
  status: string;
}

export interface CommissionMatchSummary {
  id: string;
  person: string;
  commission: string;
  commissionRole: string;
  instrument: string;
  contractRole: string;
  score: number;
  status: string;
  reasons: string[];
  validity: string;
}

export interface CommissionBreakdown {
  commission: string;
  members: number;
  attention: number;
  review: number;
}

export interface ImportSource {
  name: string;
  competence: string;
  type: string;
  records: number | null;
  state: "Mapeado" | "Pronto" | "Requer revisão";
}

export interface SystemSnapshot {
  meta: {
    mode: DataMode;
    updatedAt: string;
    notice: string;
  };
  contracts: {
    remessaRecords: number;
    remessaGlobalValueCents: number;
    laiRecords: number;
    laiValueCents: number;
    pdfCollected: number;
    withoutPdf: number;
    needReview: number;
    managers: number;
    inspectors: number;
    bothConfirmed: number;
    divergences: number;
    examples: ContractSummary[];
  };
  reconciliation: ReconciliationSummary;
  outsourced: {
    series: OutsourcedPoint[];
    latestPeople: number;
    latestCompanies: number;
    latestContracts: number;
    nightShift: number;
    qualityNotice: string;
  };
  payroll: {
    competence: string;
    people: number;
    proceedsCents: number;
    discountsCents: number;
    netCents: number;
    categories: PayrollCategory[];
  };
  travel: {
    competence: string;
    records: number;
    ticketsCents: number;
    dailyCents: number;
    totalCents: number;
    destinations: number;
    examples: TravelExample[];
  };
  commissions: {
    ordinances: number;
    members: number;
    presidents: number;
    matchedPeople: number;
    ok: number;
    attention: number;
    review: number;
    potentialConflict: number;
    examples: CommissionMatchSummary[];
    byCommission: CommissionBreakdown[];
  };
  imports: ImportSource[];
}
