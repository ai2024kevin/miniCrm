import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientsPage } from '@/pages/clients-page';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('ClientsPage', () => {
  it('shows list and add section titles', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(
        JSON.stringify([
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
      ),
    });

    render(<ClientsPage />);

    expect(screen.getByText('Список клиентов')).toBeInTheDocument();
    expect(screen.getByText('Добавить клиента')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/clients', expect.any(Object));
    });
  });
});
