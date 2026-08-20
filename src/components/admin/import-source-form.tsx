"use client";

import { useState, type FormEvent } from "react";

import { Icon } from "@/components/ui/icon";

interface ImportResponse {
  message?: string;
  summary?: {
    batchId: string;
    module: string;
    normalizedRecords: number;
    qualityIssues: number;
    rawRecords: number;
  };
}

export function ImportSourceForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<ImportResponse | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setResult(null);
    try {
      const response = await fetch("/api/admin/imports", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const payload = (await response.json()) as ImportResponse;
      if (!response.ok) throw new Error(payload.message || "Não foi possível importar o arquivo.");
      setState("success");
      setResult(payload);
      event.currentTarget.reset();
    } catch (error) {
      setState("error");
      setResult({ message: error instanceof Error ? error.message : "Falha não identificada." });
    }
  }

  return (
    <form className="import-upload" onSubmit={submit}>
      <div className="import-form-grid">
        <div className="field">
          <label htmlFor="import-file">Planilha de origem (.xlsx)</label>
          <input id="import-file" name="file" type="file" accept=".xlsx" required />
        </div>
        <div className="field">
          <label htmlFor="import-module">Tipo da fonte</label>
          <select id="import-module" name="module" defaultValue="AUTO">
            <option value="AUTO">Detectar automaticamente</option>
            <option value="LAI">LAI — contratos</option>
            <option value="REMESSA">Remessa TCE</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="import-competence">Competência</label>
          <input id="import-competence" name="competence" type="month" required />
        </div>
        <div className="field">
          <label htmlFor="import-drive-url">Link do original no Drive (opcional)</label>
          <input id="import-drive-url" name="driveUrl" type="url" placeholder="https://drive.google.com/…" />
        </div>
      </div>
      <div className="import-submit-row">
        <button className="button button-primary" disabled={state === "loading"} type="submit">
          <Icon name="database" />
          {state === "loading" ? "Lendo todas as colunas…" : "Importar para a base geral"}
        </button>
        <p>O mesmo SHA-256 não duplica dados. Linhas não reconhecidas continuam guardadas na camada bruta.</p>
      </div>
      {result?.message && (
        <div className={`import-result action-${state}`} role="status">
          <strong>{result.message}</strong>
          {result.summary && (
            <span>
              Lote {result.summary.batchId.slice(0, 8)} · {result.summary.module} · {result.summary.qualityIssues} apontamento(s) de qualidade
            </span>
          )}
        </div>
      )}
    </form>
  );
}
