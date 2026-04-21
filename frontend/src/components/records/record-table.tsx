import type { ReactNode } from 'react';

type Column<T> = {
  id: string;
  title: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

type RecordTableProps<T extends { id: number }> = {
  title: string;
  description: string;
  rows: T[];
  columns: Column<T>[];
  emptyText?: string;
};

export function RecordTable<T extends { id: number }>({
  title,
  description,
  rows,
  columns,
  emptyText = 'Нет данных для отображения.',
}: RecordTableProps<T>) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-2 text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mb-4 text-sm text-slate-500">{description}</p>

      <div className="max-h-[460px] overflow-auto rounded-lg border border-slate-200">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.id} className="px-4 py-3 text-left font-medium text-slate-700">
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  {columns.map((column) => (
                    <td key={column.id} className={`px-4 py-3 text-slate-700 ${column.className ?? ''}`}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
