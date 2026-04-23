import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from '@/pages/settings-page';

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

describe('SettingsPage', () => {
  it('shows visible success feedback after saving Google settings', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          spreadsheet_id: null,
          folder_id: null,
          title_prefix: null,
          has_client_secret: false,
          has_oauth_token: false,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          spreadsheet_id: null,
          folder_id: 'folder-123',
          title_prefix: null,
          has_client_secret: false,
          has_oauth_token: false,
        }),
      );

    render(<SettingsPage />);

    expect(await screen.findByRole('button', { name: 'Сохранить настройки' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Folder ID'), { target: { value: 'folder-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить настройки' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        '/api/settings/google',
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    const message = await screen.findByText('Настройки Google сохранены.');
    expect(message).toBeInTheDocument();
    expect(message.closest('section')).toHaveClass('bg-emerald-50');
  });

  it('shows manual OAuth instructions and keeps only the connect button', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        spreadsheet_id: null,
        folder_id: null,
        title_prefix: null,
        has_client_secret: true,
        has_oauth_token: false,
      }),
    );

    render(<SettingsPage />);

    expect(await screen.findByRole('button', { name: 'Подключить Google' })).toBeInTheDocument();

    fireEvent.click(screen.getByText('Открыть инструкцию'));

    expect(screen.getByText(/Google попытается открыть/i)).toBeInTheDocument();
    expect(screen.getByText(/Скопируйте значение параметра/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Открыть Google OAuth страницу' })).not.toBeInTheDocument();
  });
});
