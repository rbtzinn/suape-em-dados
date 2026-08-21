import { NextResponse } from "next/server";

import { firebaseRoleForEmail } from "@/auth/firebase-authorization";
import { verifyFirebaseIdToken } from "@/auth/firebase-token";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/auth/session";

export const runtime = "nodejs";

function originIsValid(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!originIsValid(request)) {
    return NextResponse.json({ message: "Origem não autorizada." }, { status: 403 });
  }
  try {
    const body = (await request.json()) as { idToken?: unknown };
    const idToken = typeof body.idToken === "string" ? body.idToken : "";
    const token = await verifyFirebaseIdToken(idToken);
    const email = String(token.email).trim().toLocaleLowerCase("pt-BR");
    const role = firebaseRoleForEmail(email);
    if (!role) throw new Error("E-mail não autorizado.");

    const sessionToken = createSessionToken({
      email,
      name: String(token.name || email.split("@")[0]),
      role,
    });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ message: "Credencial inválida ou não autorizada." }, { status: 401 });
  }
}
