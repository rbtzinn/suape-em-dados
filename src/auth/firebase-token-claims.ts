export interface FirebaseTokenPayload {
  aud?: string;
  auth_time?: number;
  email?: string;
  email_verified?: boolean;
  exp?: number;
  firebase?: { sign_in_provider?: string };
  iat?: number;
  iss?: string;
  name?: string;
  sub?: string;
  user_id?: string;
}

export function validateFirebasePayload(
  payload: FirebaseTokenPayload,
  projectId: string,
  now = Math.floor(Date.now() / 1000),
): FirebaseTokenPayload {
  if (payload.aud !== projectId || payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error("Token emitido para outro projeto Firebase.");
  }
  if (!payload.sub || payload.sub.length > 128 || payload.user_id !== payload.sub) {
    throw new Error("Identificador do usuário Firebase inválido.");
  }
  if (!payload.exp || payload.exp <= now || !payload.iat || payload.iat > now + 60) {
    throw new Error("Token Firebase expirado ou fora da validade.");
  }
  if (!payload.auth_time || payload.auth_time > now + 60) {
    throw new Error("Horário de autenticação Firebase inválido.");
  }
  if (!payload.email || payload.firebase?.sign_in_provider !== "password") {
    throw new Error("Use uma conta Firebase autorizada por e-mail e senha.");
  }
  return payload;
}
