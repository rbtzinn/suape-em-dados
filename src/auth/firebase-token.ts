import "server-only";

import { createPublicKey, verify as verifySignature } from "node:crypto";

import {
  type FirebaseTokenPayload,
  validateFirebasePayload,
} from "@/auth/firebase-token-claims";

export type { FirebaseTokenPayload } from "@/auth/firebase-token-claims";

const CERTIFICATES_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

interface FirebaseHeader {
  alg?: string;
  kid?: string;
}

let certificateCache: { values: Record<string, string>; expiresAt: number } | null = null;

function decodeSegment<T>(segment: string): T {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as T;
}

function maxAge(value: string | null): number {
  const seconds = Number(value?.match(/max-age=(\d+)/i)?.[1] ?? 3600);
  return Number.isFinite(seconds) ? Math.max(60, seconds) : 3600;
}

async function certificates(): Promise<Record<string, string>> {
  if (certificateCache && certificateCache.expiresAt > Date.now() + 30_000) {
    return certificateCache.values;
  }
  const response = await fetch(CERTIFICATES_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível validar a assinatura do Firebase.");
  const values = (await response.json()) as Record<string, string>;
  certificateCache = {
    values,
    expiresAt: Date.now() + maxAge(response.headers.get("cache-control")) * 1000,
  };
  return values;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseTokenPayload> {
  if (idToken.length < 100 || idToken.length > 10_000) throw new Error("Token Firebase inválido.");
  const segments = idToken.split(".");
  if (segments.length !== 3) throw new Error("Token Firebase malformado.");
  const [encodedHeader, encodedPayload, encodedSignature] = segments;
  const header = decodeSegment<FirebaseHeader>(encodedHeader);
  const payload = decodeSegment<FirebaseTokenPayload>(encodedPayload);
  if (header.alg !== "RS256" || !header.kid) throw new Error("Cabeçalho Firebase inválido.");

  const certificate = (await certificates())[header.kid];
  if (!certificate) throw new Error("Chave pública Firebase não encontrada.");
  const validSignature = verifySignature(
    "RSA-SHA256",
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    createPublicKey(certificate),
    Buffer.from(encodedSignature, "base64url"),
  );
  if (!validSignature) throw new Error("Assinatura Firebase inválida.");

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Firebase project ID não configurado.");
  return validateFirebasePayload(payload, projectId);
}
