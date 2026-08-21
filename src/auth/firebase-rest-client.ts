"use client";

interface FirebaseErrorPayload {
  error?: { message?: string };
  idToken?: string;
}

const FIREBASE_MESSAGES: Record<string, string> = {
  API_KEY_INVALID: "A chave pública do Firebase está incorreta na Vercel.",
  INVALID_API_KEY: "A chave pública do Firebase está incorreta na Vercel.",
  OPERATION_NOT_ALLOWED: "Ative o provedor E-mail/senha no Firebase Authentication.",
  TOO_MANY_ATTEMPTS_TRY_LATER: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  USER_DISABLED: "Este usuário foi desativado no Firebase.",
};

export async function firebaseIdToken(email: string, password: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  if (!apiKey) throw new Error("A chave pública do Firebase não foi configurada na Vercel.");
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const payload = (await response.json()) as FirebaseErrorPayload;
  if (response.ok && payload.idToken) return payload.idToken;

  const code = String(payload.error?.message ?? "").split(" : ")[0];
  if (["EMAIL_NOT_FOUND", "INVALID_LOGIN_CREDENTIALS", "INVALID_PASSWORD"].includes(code)) {
    throw new Error("E-mail ou senha inválidos.");
  }
  throw new Error(FIREBASE_MESSAGES[code] ?? `Falha no Firebase (${code || response.status}).`);
}
