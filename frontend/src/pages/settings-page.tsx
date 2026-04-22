import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type GoogleSettingsPayload = {
  spreadsheet_id: string | null;
  folder_id: string | null;
  title_prefix: string | null;
};

type GoogleSettingsForm = {
  spreadsheet_id: string;
  folder_id: string;
  title_prefix: string;
};

const initialForm: GoogleSettingsForm = {
  spreadsheet_id: '',
  folder_id: '',
  title_prefix: 'CRM Export',
};

function toPayload(form: GoogleSettingsForm): GoogleSettingsPayload {
  return {
    spreadsheet_id: form.spreadsheet_id.trim() || null,
    folder_id: form.folder_id.trim() || null,
    title_prefix: form.title_prefix.trim() || null,
  };
}

export function SettingsPage() {
  const [form, setForm] = useState<GoogleSettingsForm>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await api.get<Partial<GoogleSettingsPayload>>('/settings/google');
        setForm({
          spreadsheet_id: response.spreadsheet_id ?? '',
          folder_id: response.folder_id ?? '',
          title_prefix: response.title_prefix ?? 'CRM Export',
        });
      } catch {
        setMessage('Не удалось загрузить текущие настройки. Можно сохранить новые значения вручную.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadSettings();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await api.put('/settings/google', toPayload(form));
      setMessage('Настройки Google сохранены.');
    } catch {
      setMessage('Ошибка сохранения. Проверьте значения и повторите попытку.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Настройки экспорта</h1>
        <p className="mt-1 text-sm text-slate-500">Google settings для выгрузки отчётов в Google Sheets.</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Где взять данные в Google</h2>
              <p className="mt-1 text-sm text-slate-500">Короткая памятка по Spreadsheet ID, Folder ID и OAuth client JSON.</p>
            </div>
            <details className="max-w-xl text-sm text-slate-600">
              <summary className="cursor-pointer list-none font-medium text-slate-700">Открыть инструкцию</summary>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <p><strong>Spreadsheet ID</strong> — это часть URL Google Sheets между <code>/d/</code> и <code>/edit</code>.</p>
                <p><strong>Folder ID</strong> — это часть URL папки Google Drive после <code>/folders/</code>.</p>
                <p><strong>OAuth client JSON</strong> нужно скачать в Google Cloud Console для Desktop App и положить в проект.</p>
              </div>
            </details>
          </div>
        </div>
        {isLoading ? (
          <p className="text-sm text-slate-500">Загрузка...</p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Spreadsheet ID</span>
              <input
                value={form.spreadsheet_id}
                onChange={(event) => setForm((prev) => ({ ...prev, spreadsheet_id: event.target.value }))}
                placeholder="1AbCdEf..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Folder ID</span>
              <input
                value={form.folder_id}
                onChange={(event) => setForm((prev) => ({ ...prev, folder_id: event.target.value }))}
                placeholder="0BxxYyy..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Префикс названия</span>
              <input
                value={form.title_prefix}
                onChange={(event) => setForm((prev) => ({ ...prev, title_prefix: event.target.value }))}
                placeholder="CRM Export"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSaving ? 'Сохраняем...' : 'Сохранить настройки'}
            </button>
          </form>
        )}
      </section>

      {message ? <section className="text-sm text-slate-600">{message}</section> : null}
    </div>
  );
}
