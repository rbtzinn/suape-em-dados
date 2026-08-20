"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

export function BootstrapSheetsButton() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function bootstrap() {
    setState("loading");
    setMessage("");
    try {
      const response = await fetch("/api/admin/sheets/bootstrap", { method: "POST" });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message || "Não foi possível preparar as abas.");
      setState("success");
      setMessage(data.message || "Estrutura preparada.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Erro não identificado.");
    }
  }

  return (
    <div className="bootstrap-action">
      <button className="button button-primary" onClick={bootstrap} disabled={state === "loading"}>
        <Icon name="database" />
        {state === "loading" ? "Preparando…" : "Preparar abas canônicas"}
      </button>
      {message && <p className={`action-message action-${state}`}>{message}</p>}
    </div>
  );
}
