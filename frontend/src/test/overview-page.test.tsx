import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
  it('показывает loading и error states в палитре Cool Premium', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([], 500))
      .mockResolvedValueOnce(jsonResponse([], 500))
      .mockResolvedValueOnce(jsonResponse([], 500));

    render(<OverviewPage />);

    const loadingState = screen.getByText('Загрузка данных обзора...');
    expect(loadingState).toHaveClass('border-[#bfd0e8]');
    expect(loadingState).toHaveClass('bg-[#f4f8fc]');
    expect(loadingState).toHaveClass('text-[#6b85a6]');

    const errorState = await screen.findByText('Не удалось загрузить данные для обзора. Попробуйте обновить страницу.');
    expect(errorState).toHaveClass('border-[#e7b4b4]');
    expect(errorState).toHaveClass('bg-[#fff5f5]');
    expect(errorState).toHaveClass('text-[#d64545]');
  });

  it('рендерит заголовок, KPI и таблицы на основе данных CRM', async () => {
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

    const periodSelector = screen.getByRole('group', { name: 'Период обзора' });
    expect(periodSelector).toHaveClass('border-[#bfd0e8]');
    expect(periodSelector).toHaveClass('bg-[#f4f8fc]');

    const activePeriodButton = screen.getByRole('button', { name: '30 дней' });
    expect(activePeriodButton).toHaveClass('bg-[#2563eb]');
    expect(activePeriodButton).toHaveClass('text-white');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/clients', expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith('/api/deals', expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith('/api/tasks', expect.any(Object));
    });

    const kpiRegion = screen.getByText('Выиграно сделок').closest('section');
    expect(kpiRegion).not.toBeNull();
    expect(within(kpiRegion as HTMLElement).getByText('Клиенты')).toBeInTheDocument();
    expect(within(kpiRegion as HTMLElement).getByText('Сделки')).toBeInTheDocument();
    expect(within(kpiRegion as HTMLElement).getByText('Задачи')).toBeInTheDocument();
    expect(within(kpiRegion as HTMLElement).getByText('Выиграно сделок')).toBeInTheDocument();

    expect(screen.getByText('Воронка сделок')).toBeInTheDocument();
    expect(screen.getByText('Структура задач')).toBeInTheDocument();

    const latestClientsSection = screen.getByRole('heading', { name: 'Последние клиенты' }).closest('section');
    expect(latestClientsSection).not.toBeNull();
    expect(latestClientsSection).toHaveClass('border-[#bfd0e8]');
    expect(latestClientsSection).toHaveClass('bg-[#f4f8fc]');
  });

  it('применяет палитру Cool Premium к карточкам и акцентам графиков', async () => {
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
            status: 'todo',
            is_done: false,
            due_date: null,
            created_at: '2026-04-22T00:00:00Z',
          },
          {
            id: 11,
            client_id: 1,
            deal_id: 1,
            title: 'Согласовать смету',
            description: null,
            status: 'doing',
            is_done: false,
            due_date: null,
            created_at: '2026-04-22T00:00:00Z',
          },
          {
            id: 12,
            client_id: 1,
            deal_id: 1,
            title: 'Подписать акт',
            description: null,
            status: 'done',
            is_done: true,
            due_date: null,
            created_at: '2026-04-22T00:00:00Z',
          },
        ]),
      );

    render(<OverviewPage />);

    expect(await screen.findByRole('heading', { name: 'Динамика новых записей' })).toBeInTheDocument();

    const trendChartCard = screen.getByRole('heading', { name: 'Динамика новых записей' }).closest('section');
    expect(trendChartCard).not.toBeNull();
    expect(trendChartCard).toHaveClass('border-[#BFD0E8]');
    expect(trendChartCard).toHaveClass('bg-[#F4F8FC]');

    const trendSvg = screen.getByRole('img', { name: 'График динамики клиентов, сделок и задач' });
    const trendSurface = trendSvg.closest('div');
    const trendPanel = trendSurface?.parentElement;
    expect(trendPanel).not.toBeNull();
    expect(trendPanel).toHaveClass('border-[#D4DFEE]');
    expect(trendPanel).toHaveClass('bg-[linear-gradient(180deg,#EAF3FF_0%,#F8FBFF_100%)]');

    expect(trendSurface).not.toBeNull();
    expect(trendSurface).toHaveClass('bg-[#FDFEFF]');
    expect(trendSurface).toHaveClass('border-white/70');

    expect(within(trendSurface as HTMLElement).getByText('0')).toBeInTheDocument();
    expect(trendSvg.querySelectorAll('polyline')).toHaveLength(3);
    expect(trendSvg.querySelectorAll('circle')).toHaveLength(30);
    expect(trendSvg.querySelectorAll('line').length).toBeGreaterThanOrEqual(10);

    const bucketLabels = ['1-6 дн.', '7-12 дн.', '13-18 дн.', '19-24 дн.', '25-30 дн.'];
    bucketLabels.forEach((label) => {
      expect(within(trendPanel as HTMLElement).getByText(label)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '7 дней' }));

    ['1-2 дн.', '3-4 дн.', '5-6 дн.', '7-7 дн.'].forEach((label) => {
      expect(within(trendPanel as HTMLElement).getByText(label)).toBeInTheDocument();
    });
    expect(within(trendPanel as HTMLElement).queryByText('9-7 дн.')).not.toBeInTheDocument();

    const donutChartCard = screen.getByRole('heading', { name: 'Структура задач' }).closest('section');
    expect(donutChartCard).not.toBeNull();
    expect(donutChartCard).toHaveClass('border-[#BFD0E8]');
    expect(donutChartCard).toHaveClass('bg-[#F4F8FC]');

    const todoLegendLabel = within(donutChartCard as HTMLElement).getByText('К выполнению');
    const todoLegendDot = todoLegendLabel.parentElement?.querySelector('span[aria-hidden="true"]');
    expect(todoLegendDot).not.toBeNull();
    expect(todoLegendDot).toHaveStyle({ backgroundColor: '#1D3557' });

    const funnelChart = screen.getByTestId('horizontal-funnel-chart');
    const lostStageLabel = within(funnelChart).getByText('Проиграны');
    const lostStageBar = lostStageLabel.closest('div[class*="bg-[#1D3557]"]') ?? lostStageLabel.parentElement;
    const lostStageValue = within(lostStageBar as HTMLElement).getByText('0');
    expect(lostStageLabel).toHaveClass('text-white');
    expect(lostStageValue).toHaveClass('text-white');
  });
});
