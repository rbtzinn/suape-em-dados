import { normalizeText, parseMoneyToCents } from "./normalization";

export interface RawPayrollRow {
  name?: unknown;
  registration?: unknown;
  cpf?: unknown;
  employeeType?: unknown;
  event?: unknown;
  eventType?: unknown;
  value?: unknown;
}

export interface PayrollEvent {
  name: string;
  registration: string;
  maskedCpf: string;
  employeeType: string;
  event: string;
  eventType: "P" | "D" | "B" | "OTHER";
  valueCents: number;
}

export function normalizePayrollRows(rows: RawPayrollRow[]): PayrollEvent[] {
  const context = { name: "", registration: "", maskedCpf: "", employeeType: "" };

  return rows.flatMap((row) => {
    if (row.name) context.name = String(row.name).trim();
    if (row.registration) context.registration = String(row.registration).trim();
    if (row.cpf) context.maskedCpf = String(row.cpf).trim();
    if (row.employeeType) context.employeeType = String(row.employeeType).trim();

    const event = String(row.event ?? "").trim();
    const eventKey = normalizeText(event);
    const valueCents = parseMoneyToCents(row.value);
    if (!context.name || !event || eventKey.includes("total") || valueCents === null) return [];

    const rawType = String(row.eventType ?? "").trim().toUpperCase();
    const eventType = ["P", "D", "B"].includes(rawType)
      ? (rawType as PayrollEvent["eventType"])
      : "OTHER";

    return [
      {
        ...context,
        event,
        eventType,
        valueCents,
      },
    ];
  });
}
