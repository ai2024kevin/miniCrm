import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AuthGuard, AUTH_SESSION_KEY } from '@/app/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { LoginPage } from '@/pages/login-page';
import '@/styles/theme.css';

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: vi.fn().mockResolvedValue(body === undefined ? '' : JSON.stringify(body)),
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('LoginPage', () => {
  it('успешно логинит пользователя и сохраняет auth token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true, token: 'test-auth-token' }));

    const router = createMemoryRouter(
      [
        { path: '/login', element: <LoginPage /> },
        { path: '/', element: <h1>CRM</h1> },
      ],
      { initialEntries: ['/login'] },
    );

    render(<RouterProvider router={router} />);

    fireEvent.change(screen.getByLabelText('Логин'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.any(Object)));
    await waitFor(() => expect(window.sessionStorage.getItem(AUTH_SESSION_KEY)).toBe('test-auth-token'));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'CRM' })).toBeInTheDocument());
  });

  it('показывает ошибку при невалидных credentials', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: 'bad credentials' }, 401));

    const router = createMemoryRouter([{ path: '/login', element: <LoginPage /> }], {
      initialEntries: ['/login'],
    });

    render(<RouterProvider router={router} />);

    fireEvent.change(screen.getByLabelText('Логин'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Неверный логин или пароль. Попробуйте ещё раз.')).toBeInTheDocument();
    expect(window.sessionStorage.getItem(AUTH_SESSION_KEY)).toBeNull();
  });

  it('применяет палитру Cool Premium на форме логина', () => {
    const router = createMemoryRouter([{ path: '/login', element: <LoginPage /> }], {
      initialEntries: ['/login'],
    });

    render(<RouterProvider router={router} />);

    const heading = screen.getByRole('heading', { name: 'Вход в CRM' });
    expect(heading.parentElement?.parentElement).toHaveClass('bg-[#f4f8fc]');

    const loginInput = screen.getByLabelText('Логин');
    expect(loginInput).toHaveClass('border-[#bfd0e8]', 'focus:border-[#2563eb]');

    const submitButton = screen.getByRole('button', { name: 'Войти' });
    expect(submitButton).toHaveClass('bg-[#2563eb]');
  });

  it('редиректит к /login без токена и пускает внутрь при наличии токена', async () => {
    const routerWithoutSession = createMemoryRouter(
      [
        { path: '/login', element: <LoginPage /> },
        {
          element: <AuthGuard />,
          children: [
            {
              path: '/',
              element: <AppShell />,
              children: [{ index: true, element: <h1>Обзор</h1> }],
            },
          ],
        },
      ],
      { initialEntries: ['/'] },
    );

    render(<RouterProvider router={routerWithoutSession} />);
    expect(await screen.findByRole('heading', { name: 'Вход в CRM' })).toBeInTheDocument();

    cleanup();
    window.sessionStorage.setItem(AUTH_SESSION_KEY, 'existing-token');

    const routerWithSession = createMemoryRouter(
      [
        { path: '/login', element: <LoginPage /> },
        {
          element: <AuthGuard />,
          children: [
            {
              path: '/',
              element: <AppShell />,
              children: [{ index: true, element: <h1>Обзор</h1> }],
            },
          ],
        },
      ],
      { initialEntries: ['/'] },
    );

    render(<RouterProvider router={routerWithSession} />);
    expect(await screen.findByRole('heading', { name: 'Обзор' })).toBeInTheDocument();

    expect(screen.getByTestId('app-shell-root')).toHaveClass('bg-transparent', 'text-[#122033]');
    expect(screen.getByRole('banner')).toHaveClass('border-[#bfd0e8]');
    expect(screen.getByRole('navigation', { name: 'Основная навигация' })).toBeInTheDocument();
  });
});
