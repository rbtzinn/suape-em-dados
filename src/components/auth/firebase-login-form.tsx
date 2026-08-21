"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { firebaseIdToken } from "@/auth/firebase-rest-client";

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
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Sessão não autorizada.");
      router.replace("/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível entrar.");
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
