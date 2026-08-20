export interface BarItem {
  label: string;
  value: number;
  display: string;
  tone?: "blue" | "yellow" | "green" | "slate";
}

export function HorizontalBars({ items }: { items: BarItem[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="horizontal-bars">
      {items.map((item) => (
        <div className="bar-row" key={item.label}>
          <div className="bar-copy"><span>{item.label}</span><strong>{item.display}</strong></div>
          <div className="bar-track"><span className={`bar-fill fill-${item.tone ?? "blue"}`} style={{ width: `${Math.max(3, (item.value / max) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
