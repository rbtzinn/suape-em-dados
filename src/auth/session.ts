import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import type { Role } from "@/domain/types";

export const SESSION_COOKIE = "suape_session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60;

export interface SessionUser {
  email: string;
  name: string;
  role: Role;
  expiresAt: number;
  demo?: boolean;
}

function sessionSecret(): string {
  const configured = process.env.SESSION_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV !== "production") return "desenvolvimento-local-nao-usar-em-producao";
  throw new Error("SESSION_SECRET é obrigatório em produção.");
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createSessionToken(
  user: Omit<SessionUser, "expiresAt">,
  now = Date.now(),
): string {
  const payload = Buffer.from(
    JSON.stringify({ ...user, expiresAt: now + SESSION_DURATION_SECONDS * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser;
    if (session.expiresAt <= Date.now()) return null;
    if (!["ADMIN", "ANALYST", "VIEWER"].includes(session.role)) return null;
    return session;
  } catch {
    return null;
  }
}

function demoSession(): SessionUser | null {
  const demoEnabled =
    process.env.DEMO_MODE === "true" ||
    (process.env.DEMO_MODE !== "false" && process.env.NODE_ENV !== "production");
  if (!demoEnabled) return null;
  return {
    email: "demo@suape.local",
    name: "Ambiente de demonstração",
    role: "ADMIN",
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
    demo: true,
  };
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value) ?? demoSession();
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export function hasRole(session: SessionUser | null, allowed: Role[]): session is SessionUser {
  return Boolean(session && allowed.includes(session.role));
}
