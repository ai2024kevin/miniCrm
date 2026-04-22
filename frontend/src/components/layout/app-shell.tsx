import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AUTH_SESSION_KEY } from '@/app/auth-guard';

const navItems = [
  { to: '/', label: 'Обзор', end: true },
  { to: '/clients', label: 'Клиенты' },
  { to: '/deals', label: 'Сделки' },
  { to: '/tasks', label: 'Задачи' },
  { to: '/reports', label: 'Отчёты' },
  { to: '/settings', label: 'Настройки' },
];

export function AppShell() {
  const navigate = useNavigate();

  function onLogout() {
    window.sessionStorage.removeItem(AUTH_SESSION_KEY);
    navigate('/login', { replace: true });
  }

  return (
    <div data-testid="app-shell-root" className="flex min-h-screen flex-col bg-transparent text-[#122033]">
      <header className="border-b border-[#bfd0e8] bg-[#f4f8fc]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <strong className="text-sm tracking-wide text-[#1d3557]">MiniCRM</strong>
          <button type="button" onClick={onLogout} className="text-sm text-[#6b85a6] transition hover:text-[#122033]">
            Выйти
          </button>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-3">
          <nav className="flex flex-wrap gap-1" aria-label="Основная навигация">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm transition ${
                    isActive
                      ? 'bg-[#2563eb] text-white shadow-sm'
                      : 'text-[#6b85a6] hover:bg-[#edf3fa] hover:text-[#122033]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">
        <section className="rounded-lg border border-[#bfd0e8] bg-[#f4f8fc] p-6">
          <Outlet />
        </section>
      </main>

      <footer className="border-t border-[#bfd0e8] bg-[#f4f8fc]/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-xs text-[#8ea2bc]">
          <span>MiniCRM</span>
          <span>FastAPI + Vite frontend</span>
        </div>
      </footer>
    </div>
  );
}
