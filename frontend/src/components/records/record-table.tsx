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
    <section className="rounded-xl border border-[#bfd0e8] bg-[#f4f8fc] p-6">
      <h2 className="mb-2 text-xl font-semibold text-[#122033]">{title}</h2>
      <p className="mb-4 text-sm text-[#6b85a6]">{description}</p>

      <div className="max-h-[460px] overflow-auto rounded-lg border border-[#d4dfee] bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-[#edf3fa]">
            <tr>
              {columns.map((column) => (
                <th key={column.id} className="px-4 py-3 text-left font-medium text-[#122033]">
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-[#6b85a6]" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-[#d4dfee]">
                  {columns.map((column) => (
                    <td key={column.id} className={`px-4 py-3 text-[#122033] ${column.className ?? ''}`}>
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
