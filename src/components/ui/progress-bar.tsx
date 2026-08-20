export function ProgressBar({
  value,
  max,
  label,
  detail,
  tone = "blue",
}: {
  value: number;
  max: number;
  label: string;
  detail?: string;
  tone?: "blue" | "yellow" | "green" | "slate";
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="progress-row">
      <div className="progress-label"><span>{label}</span><strong>{detail ?? `${percent}%`}</strong></div>
      <div className="progress-track" aria-label={`${label}: ${percent}%`}>
        <span className={`progress-fill fill-${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
