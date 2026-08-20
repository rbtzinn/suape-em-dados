export function DonutChart({
  value,
  total,
  label,
  detail,
  color = "var(--blue-600)",
}: {
  value: number;
  total: number;
  label: string;
  detail: string;
  color?: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="donut-wrap">
      <div
        className="donut"
        role="img"
        aria-label={`${label}: ${percent}%`}
        style={{ background: `conic-gradient(${color} ${percent}%, var(--slate-100) 0)` }}
      >
        <div><strong>{percent}%</strong><span>{label}</span></div>
      </div>
      <p>{detail}</p>
    </div>
  );
}
