function points(values: number[], width: number, height: number): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 12) - 6;
      return `${x},${y}`;
    })
    .join(" ");
}

export function MiniLineChart({
  values,
  labels,
  secondaryValues,
  valueFormatter = (value) => String(value),
}: {
  values: number[];
  labels: string[];
  secondaryValues?: number[];
  valueFormatter?: (value: number) => string;
}) {
  const width = 700;
  const height = 180;
  return (
    <div className="line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolução mensal">
        {[0, 1, 2, 3].map((line) => (
          <line key={line} x1="0" x2={width} y1={20 + line * 45} y2={20 + line * 45} className="grid-line" />
        ))}
        {secondaryValues && <polyline points={points(secondaryValues, width, height)} className="chart-line chart-line-secondary" />}
        <polyline points={points(values, width, height)} className="chart-line chart-line-primary" />
      </svg>
      <div className="chart-labels">
        {labels.map((label, index) => (
          <span key={`${label}-${index}`} title={valueFormatter(values[index])}>{label}</span>
        ))}
      </div>
    </div>
  );
}
