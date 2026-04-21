import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppShell } from '../components/layout/app-shell';

describe('AppShell', () => {
  it('рендерит основные пункты навигации и контент маршрута', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <AppShell />,
          children: [{ index: true, element: <h1>Обзор</h1> }],
        },
      ],
      { initialEntries: ['/'] },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByRole('navigation', { name: 'Основная навигация' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Обзор' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Клиенты' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Сделки' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Задачи' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Отчёты' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Обзор' })).toBeInTheDocument();
  });
});
