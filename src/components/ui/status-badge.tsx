import type { Tone } from "@/domain/types";
import { normalizeText } from "@/domain/normalization";

function inferTone(label: string): Tone {
  const value = normalizeText(label);
  if (value.includes("conforme") || value.includes("concluido") || value.includes("confirmado") || value === "pronto") return "success";
  if (value.includes("nao conformidade") || value.includes("erro") || value.includes("divergencia")) return "danger";
  if (value.includes("revis") || value.includes("pendente") || value.includes("atencao") || value.includes("sem pdf")) return "warning";
  if (value.includes("nao verificavel") || value.includes("execucao") || value.includes("mapeado")) return "info";
  return "neutral";
}

export function StatusBadge({ children, tone }: { children: React.ReactNode; tone?: Tone }) {
  const resolved = tone ?? inferTone(String(children));
  return <span className={`status-badge status-${resolved}`}>{children}</span>;
}
