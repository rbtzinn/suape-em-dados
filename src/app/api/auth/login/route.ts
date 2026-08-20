import { NextResponse } from "next/server";

import { verifyPassword } from "@/auth/password";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/auth/session";
import { findAuthorizedUser } from "@/auth/users";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").slice(0, 254);
  const password = String(formData.get("password") ?? "").slice(0, 512);
  const user = await findAuthorizedUser(email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.redirect(new URL("/login?erro=credenciais", request.url), 303);
  }

  const token = createSessionToken({ email: user.email, name: user.name, role: user.role });
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
