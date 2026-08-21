import "server-only";

interface BridgeEnvelope<T> {
  ok?: boolean;
  result?: T;
  error?: string;
}

function bridgeUrl(): string {
  const value = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!value) throw new Error("GOOGLE_APPS_SCRIPT_URL não configurada.");
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "script.google.com" || !url.pathname.startsWith("/macros/s/")) {
    throw new Error("GOOGLE_APPS_SCRIPT_URL precisa ser uma implantação /exec válida.");
  }
  return url.toString();
}

export function isSheetsBridgeConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_ID &&
      process.env.GOOGLE_APPS_SCRIPT_URL &&
      process.env.GOOGLE_APPS_SCRIPT_SECRET,
  );
}

export async function appsScriptRequest<T>(
  action: string,
  data: Record<string, unknown> = {},
): Promise<T> {
  const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET;
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!secret || !spreadsheetId) throw new Error("Ponte do Google Sheets não configurada.");

  const response = await fetch(bridgeUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, data, secret, spreadsheetId }),
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(55_000),
  });
  const text = await response.text();
  let payload: BridgeEnvelope<T>;
  try {
    payload = JSON.parse(text) as BridgeEnvelope<T>;
  } catch {
    throw new Error(`Apps Script respondeu em formato inválido (${response.status}).`);
  }
  if (!response.ok || !payload.ok || payload.result === undefined) {
    throw new Error(`Apps Script: ${String(payload.error || response.status).slice(0, 220)}`);
  }
  return payload.result;
}
