"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

async function firebaseIdToken(email: string, password: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("Firebase API key não configurada.");
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const payload = (await response.json()) as { idToken?: string };
  if (!response.ok || !payload.idToken) throw new Error("Credencial Firebase inválida.");
  return payload.idToken;
}

export function FirebaseLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    try {
      const idToken = await firebaseIdToken(
        String(data.get("email") ?? "").trim(),
        String(data.get("password") ?? ""),
      );
      const response = await fetch("/api/auth/firebase-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) throw new Error("Acesso não autorizado para este e-mail.");
      router.replace("/");
      router.refresh();
    } catch {
      setError("E-mail ou senha inválidos, ou usuário sem autorização no portal.");
      setLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={submit}>
      {error && <div className="login-error" role="alert">{error}</div>}
      <div className="field">
        <label htmlFor="email">E-mail autorizado</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="field">
        <label htmlFor="password">Senha do Firebase</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required minLength={6} />
      </div>
      <button className="button button-primary" type="submit" disabled={loading}>
        {loading ? "Validando…" : "Acessar ambiente"}
      </button>
    </form>
  );
}
