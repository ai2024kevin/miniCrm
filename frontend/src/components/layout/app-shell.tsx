import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Обзор', end: true },
  { to: '/clients', label: 'Клиенты' },
  { to: '/deals', label: 'Сделки' },
  { to: '/tasks', label: 'Задачи' },
  { to: '/reports', label: 'Отчёты' },
  { to: '/settings', label: 'Настройки' },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <strong className="text-sm tracking-wide">VPH03 CRM</strong>
          <span className="text-xs text-slate-500">minimal scaffold</span>
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
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
