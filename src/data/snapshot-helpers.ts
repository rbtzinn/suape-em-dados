import { parseInteger, parseMoneyToCents } from "@/domain/normalization";
import type { SheetRow } from "@/infra/google-sheets/repository";

export function cents(row: SheetRow, key: string): number {
  const explicitCents = parseInteger(row[key]);
  if (explicitCents !== null) return explicitCents;
  return parseMoneyToCents(row[key.replace(/_cents$/, "")]) ?? 0;
}

export function sum(rows: SheetRow[], key: string): number {
  return rows.reduce((total, row) => total + cents(row, key), 0);
}

export function unique(rows: SheetRow[], key: string): number {
  return new Set(rows.map((row) => row[key]).filter(Boolean)).size;
}

export function latestCompetence(rows: SheetRow[]): string {
  return rows
    .map((row) => row.competence)
    .filter(Boolean)
    .sort()
    .at(-1) ?? "";
}

export function latestRows(rows: SheetRow[]): SheetRow[] {
  const competence = latestCompetence(rows);
  return competence ? rows.filter((row) => row.competence === competence) : rows;
}

export function groupRows(rows: SheetRow[], key: string): Map<string, SheetRow[]> {
  const result = new Map<string, SheetRow[]>();
  for (const row of rows) {
    const value = row[key] || "Não informado";
    result.set(value, [...(result.get(value) ?? []), row]);
  }
  return result;
}

const MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export function formatCompetence(value: string): string {
  const range = value.match(/^(\d{4})-(\d{2})\.\.(\d{4})-(\d{2})$/);
  if (range) {
    const [, startYear, startMonth, endYear, endMonth] = range;
    const start = MONTHS[Number(startMonth) - 1] ?? startMonth;
    const end = MONTHS[Number(endMonth) - 1] ?? endMonth;
    return startYear === endYear
      ? `${start}–${end}/${endYear}`
      : `${start}/${startYear}–${end}/${endYear}`;
  }
  const month = value.match(/^(\d{4})-(\d{2})$/);
  if (!month) return value || "Sem competência";
  return `${MONTHS[Number(month[2]) - 1] ?? month[2]}/${month[1]}`;
}

export function formatPeriod(start: string, end: string): string {
  const format = (value: string) => {
    const parsed = new Date(`${value}T12:00:00Z`);
    return Number.isNaN(parsed.getTime())
      ? value
      : new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }).format(parsed);
  };
  if (!start && !end) return "Período não informado";
  if (!start || start === end) return format(start || end);
  return `${format(start)} – ${format(end)}`;
}

export function parseReasons(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as { reasons?: unknown };
    return Array.isArray(parsed.reasons)
      ? parsed.reasons.filter((reason): reason is string => typeof reason === "string")
      : [];
  } catch {
    return [];
  }
}
