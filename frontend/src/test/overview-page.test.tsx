import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OverviewPage } from '@/pages/overview-page';

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
});

afterEach(() => {
  cleanup();
});

describe('OverviewPage', () => {
  it('рендерит заголовок, KPI и графики на основе данных CRM', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 1,
            name: 'Анна Смирнова',
            phone: null,
            email: null,
            company: 'Northwind',
            status: 'active',
            comment: null,
            created_at: '2026-04-22T00:00:00Z',
          },
          {
            id: 2,
            name: 'Борис Лебедев',
            phone: null,
            email: null,
            company: 'Skyline',
            status: 'archived',
            comment: null,
            created_at: '2026-04-22T00:00:00Z',
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 1,
            client_id: 1,
            title: 'Продление контракта',
            amount: 150000,
            stage: 'won',
            comment: null,
            close_date: null,
            created_at: '2026-04-22T00:00:00Z',
          },
          {
            id: 2,
            client_id: 2,
            title: 'Апселл лицензий',
            amount: 50000,
            stage: 'in_progress',
            comment: null,
            close_date: null,
            created_at: '2026-04-22T00:00:00Z',
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 10,
            client_id: 1,
            deal_id: 1,
            title: 'Подготовить договор',
            description: null,
            status: 'doing',
            is_done: false,
            due_date: null,
            created_at: '2026-04-22T00:00:00Z',
          },
          {
            id: 11,
            client_id: 2,
            deal_id: 2,
            title: 'Отправить КП',
            description: null,
            status: 'done',
            is_done: true,
            due_date: null,
            created_at: '2026-04-22T00:00:00Z',
          },
        ]),
      );

    render(<OverviewPage />);

    expect(screen.getByRole('heading', { name: 'Обзор за последние 30 дней' })).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/clients', expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith('/api/deals', expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith('/api/tasks', expect.any(Object));
    });

    expect(screen.getByText('Клиенты')).toBeInTheDocument();
    expect(screen.getByText('Сделки')).toBeInTheDocument();
    expect(screen.getByText('Задачи')).toBeInTheDocument();
    expect(screen.getByText('Выиграно сделок')).toBeInTheDocument();

    expect(screen.getByText('Воронка сделок')).toBeInTheDocument();
    expect(screen.getByText('Статусы задач')).toBeInTheDocument();
  });
});
