import { FormEvent, useEffect, useState } from 'react';
import { ApiError, api } from '@/lib/api';

type GoogleSettingsState = {
  spreadsheet_id: string | null;
  folder_id: string | null;
  title_prefix: string | null;
  has_client_secret: boolean;
  has_oauth_token: boolean;
};

type GoogleOAuthStartResponse = {
  auth_url: string;
};

type GoogleOAuthExchangeResponse = {
  ok: boolean;
  has_oauth_token: boolean;
};

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

type MessageTone = 'success' | 'error' | 'info';

const initialForm: GoogleSettingsForm = {
  spreadsheet_id: '',
  folder_id: '',
  title_prefix: '',
};

function toPayload(form: GoogleSettingsForm): GoogleSettingsPayload {
  return {
    spreadsheet_id: form.spreadsheet_id.trim() || null,
    folder_id: form.folder_id.trim() || null,
    title_prefix: form.title_prefix.trim() || null,
  };
}

function toMessageTone(error: unknown): MessageTone {
  return error instanceof ApiError ? 'error' : 'info';
}

function toMessageText(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function SettingsPage() {
  const [form, setForm] = useState<GoogleSettingsForm>(initialForm);
  const [hasClientSecret, setHasClientSecret] = useState(false);
  const [hasOAuthToken, setHasOAuthToken] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [oauthCode, setOauthCode] = useState('');
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isExchangingCode, setIsExchangingCode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<MessageTone>('info');

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await api.get<GoogleSettingsState>('/settings/google');
        setForm({
          spreadsheet_id: response.spreadsheet_id ?? '',
          folder_id: response.folder_id ?? '',
          title_prefix: response.title_prefix ?? '',
        });
        setHasClientSecret(response.has_client_secret);
        setHasOAuthToken(response.has_oauth_token);
      } catch (error) {
        setMessage(toMessageText(error, 'Не удалось загрузить текущие настройки. Можно сохранить новые значения вручную.'));
        setMessageTone(toMessageTone(error));
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
    setMessageTone('info');

    try {
      const response = await api.put<GoogleSettingsState>('/settings/google', toPayload(form));
      setForm({
        spreadsheet_id: response.spreadsheet_id ?? '',
        folder_id: response.folder_id ?? '',
        title_prefix: response.title_prefix ?? '',
      });
      setHasClientSecret(response.has_client_secret);
      setHasOAuthToken(response.has_oauth_token);
      setMessage('Настройки Google сохранены.');
      setMessageTone('success');
    } catch (error) {
      setMessage(toMessageText(error, 'Ошибка сохранения. Проверьте значения и повторите попытку.'));
      setMessageTone(toMessageTone(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function onUploadClientSecret() {
    if (!selectedFile) {
      setMessage('Выберите JSON-файл перед загрузкой.');
      setMessageTone('error');
      return;
    }

    setIsUploading(true);
    setMessage(null);
    setMessageTone('info');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post<{ ok: boolean; has_client_secret: boolean }>(
        '/settings/google/client-secret',
        formData,
      );

      setHasClientSecret(response.has_client_secret);
      setHasOAuthToken(false);
      setSelectedFile(null);
      setOauthUrl(null);
      setOauthCode('');
      setMessage('Client secret JSON успешно загружен на сервер. После этого заново подключите Google OAuth.');
      setMessageTone('success');
    } catch (error) {
      setMessage(toMessageText(error, 'Ошибка загрузки client secret JSON. Проверьте файл и повторите попытку.'));
      setMessageTone(toMessageTone(error));
    } finally {
      setIsUploading(false);
    }
  }

  async function onStartGoogleOAuth() {
    setIsConnectingGoogle(true);
    setMessage(null);
    setMessageTone('info');

    try {
      const response = await api.get<GoogleOAuthStartResponse>('/settings/google/oauth/start');
      window.open(response.auth_url, '_blank', 'noopener,noreferrer');
      setMessage('Откройте страницу Google, подтвердите доступ, дождитесь перехода на localhost и вставьте значение параметра code ниже.');
      setMessageTone('info');
    } catch (error) {
      setMessage(toMessageText(error, 'Не удалось получить ссылку Google OAuth. Сначала загрузите корректный client secret JSON.'));
      setMessageTone(toMessageTone(error));
    } finally {
      setIsConnectingGoogle(false);
    }
  }

  async function onExchangeGoogleCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsExchangingCode(true);
    setMessage(null);
    setMessageTone('info');

    try {
      const response = await api.post<GoogleOAuthExchangeResponse>('/settings/google/oauth/exchange', {
        code: oauthCode,
      });
      setHasOAuthToken(response.has_oauth_token);
      setOauthCode('');
      setMessage('Google OAuth успешно подключён. Теперь можно запускать экспорт.');
      setMessageTone('success');
    } catch (error) {
      setMessage(toMessageText(error, 'Не удалось сохранить Google OAuth код. Проверьте код и попробуйте снова.'));
      setMessageTone(toMessageTone(error));
    } finally {
      setIsExchangingCode(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Настройки экспорта</h1>
        <p className="mt-1 text-sm text-slate-500">Google settings для выгрузки отчётов в Google Sheets.</p>
      </header>

      {message ? (
        <section
          className={`rounded-xl border p-4 text-sm ${
            messageTone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : messageTone === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-900'
                : 'border-sky-200 bg-sky-50 text-sky-900'
          }`}
        >
          {message}
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Где взять данные в Google</h2>
              <p className="mt-1 text-sm text-slate-500">Короткая памятка по Spreadsheet ID, Folder ID, OAuth client JSON и ручному завершению Google OAuth.</p>
            </div>
            <details className="max-w-xl text-sm text-slate-600">
              <summary className="cursor-pointer list-none font-medium text-slate-700">Открыть инструкцию</summary>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <p><strong>Spreadsheet ID</strong> — это часть URL Google Sheets между <code>/d/</code> и <code>/edit</code>.</p>
                <p><strong>Folder ID</strong> — это часть URL папки Google Drive после <code>/folders/</code>.</p>
                <p><strong>OAuth client JSON</strong> скачайте в Google Cloud Console и загрузите ниже через форму.</p>
                <p><strong>Как подключить Google OAuth</strong>: сначала загрузите client secret JSON, затем нажмите кнопку «Подключить Google», войдите в Google и подтвердите доступ.</p>
                <p>После подтверждения Google попытается открыть <code>localhost</code> — это ожидаемо. Скопируйте значение параметра <code>code</code> из адресной строки и вставьте его в поле «Код подтверждения Google» ниже.</p>
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

      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">OAuth client secret JSON</h2>
          <p className="mt-1 text-sm text-slate-500">
            Статус: {hasClientSecret ? 'файл уже загружен на сервер' : 'файл пока не загружен'}.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">JSON-файл client secret</span>
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <button
          type="button"
          onClick={onUploadClientSecret}
          disabled={isUploading}
          className="rounded-lg border border-slate-300 px-4 py-2 text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {isUploading ? 'Загружаем...' : 'Загрузить client secret'}
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Подключение Google OAuth</h2>
          <p className="mt-1 text-sm text-slate-500">
            Статус: {hasOAuthToken ? 'Google уже подключён' : 'Google ещё не подключён'}.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartGoogleOAuth}
          disabled={isConnectingGoogle || !hasClientSecret}
          className="rounded-lg border border-slate-300 px-4 py-2 text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {isConnectingGoogle ? 'Готовим ссылку...' : 'Подключить Google'}
        </button>

        <form className="space-y-3" onSubmit={onExchangeGoogleCode}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Код подтверждения Google</span>
            <input
              value={oauthCode}
              onChange={(event) => setOauthCode(event.target.value)}
              placeholder="Вставьте code после подтверждения доступа"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <button
            type="submit"
            disabled={isExchangingCode || !oauthCode.trim()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isExchangingCode ? 'Подключаем...' : 'Сохранить код Google OAuth'}
          </button>
        </form>
      </section>

    </div>
  );
}
