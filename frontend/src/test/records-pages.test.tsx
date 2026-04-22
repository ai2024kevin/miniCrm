import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientsPage } from '@/pages/clients-page';
import { DealsPage } from '@/pages/deals-page';
import { TasksPage } from '@/pages/tasks-page';

const fetchMock = vi.fn();
const scrollIntoViewMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: vi.fn().mockResolvedValue(body === undefined ? '' : JSON.stringify(body)),
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  scrollIntoViewMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: scrollIntoViewMock,
  });
});

afterEach(() => {
  cleanup();
});

describe('ClientsPage', () => {
  it('shows list and add section titles', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: 1,
          name: 'Роман Жуков',
          phone: '+7 999 111-22-33',
          email: null,
          company: 'DeltaFrame',
          status: 'active',
          comment: 'Комментарий',
          created_at: '2026-04-22T00:00:00Z',
        },
      ]),
    );

    render(<ClientsPage />);

    expect(screen.getByText('Список клиентов')).toBeInTheDocument();
    expect(screen.getByText('Добавить клиента')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/clients', expect.any(Object));
    });
  });

  it('scrolls to client card after user selection', async () => {
    fetchMock.mockResolvedValue(
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
          status: 'active',
          comment: null,
          created_at: '2026-04-22T00:00:00Z',
        },
      ]),
    );

    render(<ClientsPage />);

    await screen.findByText('Борис Лебедев');
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Борис Лебедев' }));

    expect(screen.getByText('Клиент #2 — Борис Лебедев')).toBeInTheDocument();
    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });
  });

  it('selects first remaining client after deleting current selection', async () => {
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
            status: 'active',
            comment: null,
            created_at: '2026-04-22T00:00:00Z',
          },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse(undefined, 204))
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
        ]),
      );

    render(<ClientsPage />);

    await screen.findByText('Борис Лебедев');
    fireEvent.click(screen.getByRole('button', { name: 'Борис Лебедев' }));
    expect(screen.getByText('Клиент #2 — Борис Лебедев')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/clients/2', expect.objectContaining({ method: 'DELETE' }));
    });
    await waitFor(() => {
      expect(screen.getByText('Клиент #1 — Анна Смирнова')).toBeInTheDocument();
    });
  });
});

describe('DealsPage', () => {
  it('blocks submit when amount is invalid', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([]))
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
        ]),
      );

    render(<DealsPage />);

    await screen.findByText('Добавить сделку');

    fireEvent.change(screen.getByPlaceholderText('Название сделки'), { target: { value: 'Новая сделка' } });
    fireEvent.change(screen.getByPlaceholderText('Сумма'), { target: { value: '-5' } });

    const submitButton = screen.getByRole('button', { name: 'Сохранить' });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Введите корректную сумму сделки.')).toBeInTheDocument();

    const form = submitButton.closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('scrolls to deal card after user selection', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 1,
            client_id: 1,
            title: 'Продление контракта',
            amount: 150000,
            stage: 'new',
            comment: null,
            close_date: null,
            created_at: '2026-04-22T00:00:00Z',
          },
          {
            id: 2,
            client_id: 1,
            title: 'Апселл лицензий',
            amount: 200000,
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
            id: 1,
            name: 'Анна Смирнова',
            phone: null,
            email: null,
            company: 'Northwind',
            status: 'active',
            comment: null,
            created_at: '2026-04-22T00:00:00Z',
          },
        ]),
      );

    render(<DealsPage />);

    await screen.findByText('Апселл лицензий');
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Апселл лицензий' }));

    await waitFor(() => {
      expect(screen.getByText('Сделка #2 — Апселл лицензий')).toBeInTheDocument();
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });
  });

  it('selects first remaining deal after deleting current selection', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 1,
            client_id: 1,
            title: 'Продление контракта',
            amount: 150000,
            stage: 'new',
            comment: null,
            close_date: null,
            created_at: '2026-04-22T00:00:00Z',
          },
          {
            id: 2,
            client_id: 1,
            title: 'Апселл лицензий',
            amount: 200000,
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
            id: 1,
            name: 'Анна Смирнова',
            phone: null,
            email: null,
            company: 'Northwind',
            status: 'active',
            comment: null,
            created_at: '2026-04-22T00:00:00Z',
          },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse(undefined, 204))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 1,
            client_id: 1,
            title: 'Продление контракта',
            amount: 150000,
            stage: 'new',
            comment: null,
            close_date: null,
            created_at: '2026-04-22T00:00:00Z',
          },
        ]),
      )
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
        ]),
      );

    render(<DealsPage />);

    await screen.findByText('Апселл лицензий');
    fireEvent.click(screen.getByRole('button', { name: 'Апселл лицензий' }));
    expect(screen.getByText('Сделка #2 — Апселл лицензий')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/deals/2', expect.objectContaining({ method: 'DELETE' }));
    });
    await waitFor(() => {
      expect(screen.getByText('Сделка #1 — Продление контракта')).toBeInTheDocument();
    });
  });
});

describe('TasksPage', () => {
  it('scrolls to task card after user selection', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 7,
            client_id: 1,
            deal_id: 2,
            title: 'Подготовить договор',
            description: null,
            status: 'todo',
            is_done: false,
            due_date: null,
            created_at: '2026-04-22T00:00:00Z',
          },
          {
            id: 8,
            client_id: 1,
            deal_id: 2,
            title: 'Отправить КП',
            description: null,
            status: 'doing',
            is_done: false,
            due_date: null,
            created_at: '2026-04-22T00:00:00Z',
          },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));

    render(<TasksPage />);

    await screen.findByText('Отправить КП');
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Отправить КП' }));

    await waitFor(() => {
      expect(screen.getByText('Задача #8 — Отправить КП')).toBeInTheDocument();
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });
  });

  it('resets selection when deleting the last task', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 7,
            client_id: 1,
            deal_id: 2,
            title: 'Подготовить договор',
            description: null,
            status: 'todo',
            is_done: false,
            due_date: null,
            created_at: '2026-04-22T00:00:00Z',
          },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse(undefined, 204))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));

    render(<TasksPage />);

    await screen.findByText('Подготовить договор');
    expect(screen.getByText('Задача #7 — Подготовить договор')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/tasks/7', expect.objectContaining({ method: 'DELETE' }));
    });
    await waitFor(() => {
      expect(screen.getByText('Задача не выбрана')).toBeInTheDocument();
    });
  });
});
