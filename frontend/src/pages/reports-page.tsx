import { FormEvent, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { ReportResult } from '@/types/crm';

type ReportType = 'clients' | 'deals' | 'tasks';

const reportOptions: { value: ReportType; label: string }[] = [
  { value: 'clients', label: 'Клиенты' },
  { value: 'deals', label: 'Сделки' },
  { value: 'tasks', label: 'Задачи' },
];

export function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('clients');
  const [result, setResult] = useState<ReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLabel = useMemo(
    () => reportOptions.find((option) => option.value === reportType)?.label ?? reportType,
    [reportType],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<ReportResult>(`/reports/${reportType}/export`, {});
      setResult(response);
    } catch {
      setResult(null);
      setError('Не удалось выполнить выгрузку. Проверьте Google settings и попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Отчёты</h1>
        <p className="mt-1 text-sm text-slate-500">Выберите таблицу и запустите выгрузку в Google Sheets.</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Таблица для выгрузки</span>
            <select
              value={reportType}
              onChange={(event) => setReportType(event.target.value as ReportType)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {reportOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading ? 'Выгружаем...' : 'Выгрузить'}
          </button>
        </form>
      </section>

      {result ? (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <p className="font-medium">Готово: {selectedLabel}</p>
          <a href={result.url} target="_blank" rel="noreferrer" className="mt-2 inline-block underline">
            Открыть таблицу
          </a>
        </section>
      ) : null}

      {error ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">{error}</section>
      ) : null}
    </div>
  );
}
