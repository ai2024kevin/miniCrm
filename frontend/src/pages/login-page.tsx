import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AUTH_SESSION_KEY, isAuthenticated } from '@/app/auth-guard';
import { api } from '@/lib/api';


type LoginResponse = {
  ok: boolean;
  token: string;
};

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const locationState = location.state as LocationState | null;
  const redirectTo = locationState?.from?.pathname || '/';

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<LoginResponse>('/auth/login', { login, password });

      if (!response?.ok || typeof response.token !== 'string' || response.token.trim().length === 0) {
        throw new Error('invalid login response');
      }

      window.sessionStorage.setItem(AUTH_SESSION_KEY, response.token);
      navigate(redirectTo, { replace: true });
    } catch {
      setError('Неверный логин или пароль. Попробуйте ещё раз.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#bfd0e8] bg-[#f4f8fc] p-6 shadow-[0_12px_32px_rgba(25,45,84,0.08)]">
        <div>
          <p className="text-sm font-medium tracking-wide text-[#6b85a6]">MiniCRM</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#122033]">Вход в CRM</h1>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#122033]">Логин</span>
            <input
              type="text"
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              className="w-full rounded-lg border border-[#bfd0e8] bg-white px-3 py-2 text-[#122033] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
              autoComplete="username"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#122033]">Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-[#bfd0e8] bg-white px-3 py-2 text-[#122033] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="text-sm text-[#d64545]">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#9eb6d5]"
            disabled={isLoading}
          >
            {isLoading ? 'Выполняем вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
