import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportsPage } from '@/pages/reports-page';

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

describe('ReportsPage', () => {
  it('exports selected report and shows the matching success state', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        title: 'Deals export',
        url: 'https://example.com/deals-sheet',
      }),
    );

    render(<ReportsPage />);

    fireEvent.change(screen.getByLabelText('Таблица для выгрузки'), { target: { value: 'deals' } });
    fireEvent.click(screen.getByRole('button', { name: 'Выгрузить в Google Sheets' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/reports/deals', expect.objectContaining({ method: 'POST' }));
    });

    expect(await screen.findByText('Готово: Сделки')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Открыть таблицу' })).toHaveAttribute('href', 'https://example.com/deals-sheet');
  });

  it('clears stale success state when report type changes', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        title: 'Clients export',
        url: 'https://example.com/clients-sheet',
      }),
    );

    render(<ReportsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Выгрузить в Google Sheets' }));
    expect(await screen.findByText('Готово: Клиенты')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Таблица для выгрузки'), { target: { value: 'tasks' } });

    expect(screen.queryByText('Готово: Клиенты')).not.toBeInTheDocument();
  });

  it('shows error when backend returns invalid export payload', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ title: 'Broken export' }));

    render(<ReportsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Выгрузить в Google Sheets' }));

    expect(await screen.findByText('Не удалось выполнить выгрузку. Проверьте настройки экспорта и попробуйте снова.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Открыть таблицу' })).not.toBeInTheDocument();
  });

  it('rejects stub export urls and keeps the page in error state', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        title: 'Clients export',
        url: 'https://example.local/reports/clients?items=50',
      }),
    );

    render(<ReportsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Выгрузить в Google Sheets' }));

    expect(await screen.findByText('Не удалось выполнить выгрузку. Проверьте настройки экспорта и попробуйте снова.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Открыть таблицу' })).not.toBeInTheDocument();
  });

  it('shows localized backend validation message instead of fake success', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Для экспорта в Google загрузите OAuth client secret JSON в настройках.' }, 400));

    render(<ReportsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Выгрузить в Google Sheets' }));

    expect(await screen.findByText('Для экспорта в Google загрузите OAuth client secret JSON в настройках.')).toBeInTheDocument();
    expect(screen.queryByText('Готово: Клиенты')).not.toBeInTheDocument();
  });
});
