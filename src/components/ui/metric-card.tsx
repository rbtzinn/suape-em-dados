import type { IconName } from "./icon";
import { Icon } from "./icon";

export function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  detail: React.ReactNode;
  icon: IconName;
  tone?: "blue" | "yellow" | "green" | "slate";
}) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-${tone}`}><Icon name={icon} /></div>
      <div className="metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}
