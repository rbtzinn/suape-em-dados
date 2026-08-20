export interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  hideOnMobile?: boolean;
}

export function DataTable({
  columns,
  rows,
  caption,
}: {
  columns: TableColumn[];
  rows: Array<Record<string, React.ReactNode>>;
  caption: string;
}) {
  return (
    <div className="table-scroll">
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead><tr>{columns.map((column) => <th key={column.key} className={`${column.align ? `align-${column.align}` : ""} ${column.hideOnMobile ? "mobile-hidden" : ""}`}>{column.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)}>
              {columns.map((column) => <td key={column.key} className={`${column.align ? `align-${column.align}` : ""} ${column.hideOnMobile ? "mobile-hidden" : ""}`}>{row[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
