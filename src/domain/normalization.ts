const EMPTY_VALUES = new Set(["", "-", "—", "n/a", "na", "não informado"]);

export function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

export function normalizeIdentifier(value: unknown): string {
  return normalizeText(value).replace(/[^a-z0-9]/g, "");
}

export function normalizeDigits(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

export function nullableText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return EMPTY_VALUES.has(normalized) ? null : String(value).trim();
}

export function parseMoneyToCents(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 100);
  }

  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const cleaned = raw.replace(/R\$|\s/g, "").replace(/[^0-9,.-]/g, "");
  if (!cleaned || cleaned === "-") return null;

  const decimalSeparator = cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".") ? "," : ".";
  const parts = cleaned.split(decimalSeparator);
  const decimalPart = parts.length > 1 ? parts.pop() ?? "" : "";
  const integerPart = parts.join("").replace(/[.,]/g, "");
  const normalized = `${integerPart || "0"}.${decimalPart.padEnd(2, "0").slice(0, 2)}`;
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

export function parseInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  const normalized = String(value ?? "").replace(/[^0-9-]/g, "");
  if (!normalized) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseBoolean(value: unknown): boolean | null {
  const normalized = normalizeText(value);
  if (["sim", "s", "true", "1", "x"].includes(normalized)) return true;
  if (["nao", "n", "false", "0"].includes(normalized)) return false;
  return null;
}

export function safeJson(value: unknown): string {
  return JSON.stringify(value, (_, item) => (typeof item === "bigint" ? item.toString() : item));
}
