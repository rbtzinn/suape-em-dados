import "server-only";

import { createSign } from "node:crypto";

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: "Bearer";
}

let tokenCache: { value: string; expiresAt: number } | null = null;

function toBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

export function isGoogleSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY,
  );
}

export async function getGoogleAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.value;
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const encodedPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !encodedPrivateKey) {
    throw new Error("Credenciais do Google Sheets não configuradas.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = toBase64Url(
    JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsignedToken = `${header}.${claims}`;
  const privateKey = encodedPrivateKey.replace(/\\n/g, "\n");
  const signature = createSign("RSA-SHA256")
    .update(unsignedToken)
    .sign(privateKey, "base64url");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsignedToken}.${signature}`,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Falha ao autenticar no Google Sheets (${response.status}).`);
  }

  const data = (await response.json()) as AccessTokenResponse;
  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}
