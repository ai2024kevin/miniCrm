import { FormEvent, useMemo, useState } from 'react';
import { ApiError, api } from '@/lib/api';
import type { ReportResult } from '@/types/crm';

type ReportType = 'clients' | 'deals' | 'tasks';

type ExportResult = ReportResult & {
  reportType: ReportType;
};

const reportOptions: { value: ReportType; label: string; description: string }[] = [
  { value: 'clients', label: 'Клиенты', description: 'Выгрузка списка клиентов с контактами, статусами и комментариями.' },
  { value: 'deals', label: 'Сделки', description: 'Выгрузка текущих сделок с этапами, суммами и привязкой к клиентам.' },
  { value: 'tasks', label: 'Задачи', description: 'Выгрузка задач команды со статусами, сроками и связями с CRM.' },
];

function isValidReportResult(value: unknown): value is ReportResult {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'url' in value &&
      typeof value.url === 'string' &&
      value.url.trim() &&
      !value.url.includes('example.local') &&
      'title' in value &&
      typeof value.title === 'string',
  );
}

function toUserErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.message.trim()) {
    return error.message;
  }

  return 'Не удалось выполнить выгрузку. Проверьте настройки экспорта и попробуйте снова.';
}

export function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('clients');
  const [result, setResult] = useState<ExportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOption = useMemo(
    () => reportOptions.find((option) => option.value === reportType) ?? reportOptions[0],
    [reportType],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<ReportResult>(`/reports/${reportType}`, {});

      if (!isValidReportResult(response)) {
        throw new Error('invalid report result');
      }

      setResult({ ...response, reportType });
    } catch (error) {
      setResult(null);
      setError(toUserErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Экспорт в Google Sheets</h1>
        <p className="mt-1 text-sm text-slate-500">Выберите таблицу, проверьте описание и запустите выгрузку в Google Sheets.</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Таблица для выгрузки</span>
            <select
              value={reportType}
              onChange={(event) => {
                const nextType = event.target.value as ReportType;
                setReportType(nextType);
                setResult(null);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {reportOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">{selectedOption.description}</p>

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading ? 'Выгружаем...' : 'Выгрузить в Google Sheets'}
          </button>
        </form>
      </section>

      {result ? (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <p className="font-medium">
            Готово: {reportOptions.find((option) => option.value === result.reportType)?.label ?? result.reportType}
          </p>
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
