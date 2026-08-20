import type { SystemSnapshot } from "@/domain/types";
import { Icon } from "./icon";

export function SourceBanner({ meta }: { meta: SystemSnapshot["meta"] }) {
  const modeLabel =
    meta.mode === "sheets"
      ? "Google Sheets ativo"
      : meta.mode === "degraded"
        ? "Integração requer atenção"
        : "Modo demonstração";
  return (
    <aside className={`source-banner source-${meta.mode}`}>
      <div className="source-icon"><Icon name={meta.mode === "degraded" ? "warning" : "database"} /></div>
      <div>
        <strong>{modeLabel}</strong>
        <span>{meta.updatedAt}</span>
      </div>
      <p>{meta.notice}</p>
    </aside>
  );
}
