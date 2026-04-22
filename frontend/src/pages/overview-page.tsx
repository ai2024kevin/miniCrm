import { useEffect, useMemo, useState } from 'react';
import { RecordTable } from '@/components/records/record-table';
import { ChartCard, StageFunnelCards, TaskDonutChart, TrendLinesChart } from '@/components/overview/chart-card';
import { KpiGrid } from '@/components/overview/kpi-grid';
import { formatDate, formatMoney } from '@/lib/format';
import { api } from '@/lib/api';
import type { Client, Deal, Task } from '@/types/crm';

const DEFAULT_PERIOD_DAYS = 30;
const PERIOD_OPTIONS = [7, 14, 30] as const;
const RECENT_ROWS_LIMIT = 10;

const dealStageLabels: Record<Deal['stage'], string> = {
  new: 'Новые',
  in_progress: 'В работе',
  won: 'Выиграны',
  lost: 'Проиграны',
};

const taskStatusLabels: Record<Task['status'], string> = {
  todo: 'К выполнению',
  doing: 'В работе',
  done: 'Завершены',
};

function isInLastDays(value: string, days: number) {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return false;
  }

  const windowStart = Date.now() - days * 24 * 60 * 60 * 1000;
  return timestamp >= windowStart;
}

function getDayBucketLabel(indexFromStart: number, bucketSize: number, periodDays: number) {
  const startDay = indexFromStart * bucketSize + 1;
  const endDay = Math.min(periodDays, startDay + bucketSize - 1);
  return `${startDay}-${endDay} дн.`;
}

function getBucketIndex(createdAt: string, periodDays: number, bucketSize: number) {
  const timestamp = Date.parse(createdAt);

  if (Number.isNaN(timestamp)) {
    return -1;
  }

  const diffMs = Date.now() - timestamp;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays < 0 || diffDays >= periodDays) {
    return -1;
  }

  return Math.floor((periodDays - 1 - diffDays) / bucketSize);
}

function sortByCreatedAtDesc<T extends { id: number; created_at: string }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const timestampA = Date.parse(a.created_at);
    const timestampB = Date.parse(b.created_at);

    if (Number.isNaN(timestampA) && Number.isNaN(timestampB)) {
      return b.id - a.id;
    }

    if (Number.isNaN(timestampA)) {
      return 1;
    }

    if (Number.isNaN(timestampB)) {
      return -1;
    }

    if (timestampA === timestampB) {
      return b.id - a.id;
    }

    return timestampB - timestampA;
  });
}

export function OverviewPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodDays, setPeriodDays] = useState<number>(DEFAULT_PERIOD_DAYS);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [clientsData, dealsData, tasksData] = await Promise.all([
          api.get<Client[]>('/clients'),
          api.get<Deal[]>('/deals'),
          api.get<Task[]>('/tasks'),
        ]);

        setClients(clientsData);
        setDeals(dealsData);
        setTasks(tasksData);
      } catch {
        setError('Не удалось загрузить данные для обзора. Попробуйте обновить страницу.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  const clientsInWindow = useMemo(() => clients.filter((item) => isInLastDays(item.created_at, periodDays)), [clients, periodDays]);
  const dealsInWindow = useMemo(() => deals.filter((item) => isInLastDays(item.created_at, periodDays)), [deals, periodDays]);
  const tasksInWindow = useMemo(() => tasks.filter((item) => isInLastDays(item.created_at, periodDays)), [tasks, periodDays]);

  const latestClients = useMemo(() => sortByCreatedAtDesc(clients).slice(0, RECENT_ROWS_LIMIT), [clients]);
  const latestDeals = useMemo(() => sortByCreatedAtDesc(deals).slice(0, RECENT_ROWS_LIMIT), [deals]);
  const currentTasks = useMemo(() => sortByCreatedAtDesc(tasks.filter((task) => task.status !== 'done')), [tasks]);

  const totalRevenue = useMemo(() => dealsInWindow.reduce((sum, deal) => sum + deal.amount, 0), [dealsInWindow]);
  const activeClients = useMemo(() => clientsInWindow.filter((item) => item.status === 'active').length, [clientsInWindow]);
  const openTasks = useMemo(() => tasksInWindow.filter((item) => item.status !== 'done').length, [tasksInWindow]);

  const stageData = useMemo(() => {
    const buckets: Record<Deal['stage'], number> = {
      new: 0,
      in_progress: 0,
      won: 0,
      lost: 0,
    };

    for (const deal of dealsInWindow) {
      buckets[deal.stage] += 1;
    }

    return [
      { label: dealStageLabels.new, value: buckets.new, hint: `${buckets.new} сделок` },
      { label: dealStageLabels.in_progress, value: buckets.in_progress, hint: `${buckets.in_progress} сделок` },
      { label: dealStageLabels.won, value: buckets.won, hint: `${buckets.won} сделок` },
      { label: dealStageLabels.lost, value: buckets.lost, hint: `${buckets.lost} сделок` },
    ];
  }, [dealsInWindow]);

  const taskData = useMemo(() => {
    const buckets: Record<Task['status'], number> = {
      todo: 0,
      doing: 0,
      done: 0,
    };

    for (const task of tasksInWindow) {
      buckets[task.status] += 1;
    }

    return [
      { label: taskStatusLabels.todo, value: buckets.todo, color: '#1D3557' },
      { label: taskStatusLabels.doing, value: buckets.doing, color: '#2563EB' },
      { label: taskStatusLabels.done, value: buckets.done, color: '#2F855A' },
    ];
  }, [tasksInWindow]);

  const trendData = useMemo(() => {
    const bucketCount = 5;
    const bucketSize = Math.max(1, Math.ceil(periodDays / bucketCount));
    const points = Array.from({ length: bucketCount }, (_, index) => ({
      label: getDayBucketLabel(index, bucketSize, periodDays),
      clients: 0,
      deals: 0,
      tasks: 0,
    }));

    for (const client of clientsInWindow) {
      const index = getBucketIndex(client.created_at, periodDays, bucketSize);
      if (index >= 0) {
        points[index].clients += 1;
      }
    }

    for (const deal of dealsInWindow) {
      const index = getBucketIndex(deal.created_at, periodDays, bucketSize);
      if (index >= 0) {
        points[index].deals += 1;
      }
    }

    for (const task of tasksInWindow) {
      const index = getBucketIndex(task.created_at, periodDays, bucketSize);
      if (index >= 0) {
        points[index].tasks += 1;
      }
    }

    return points;
  }, [clientsInWindow, dealsInWindow, tasksInWindow, periodDays]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#122033]">Обзор за последние {periodDays} дней</h1>
          <p className="mt-1 text-sm text-[#6b85a6]">Ключевые показатели CRM и сводка по записям, созданным за последние {periodDays} дней.</p>
        </div>
        <div className="inline-flex w-fit rounded-xl border border-[#bfd0e8] bg-[#f4f8fc] p-1 shadow-sm" role="group" aria-label="Период обзора">
          {PERIOD_OPTIONS.map((option) => {
            const isActive = option === periodDays;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setPeriodDays(option)}
                className={[
                  'rounded-lg px-3 py-1.5 text-sm transition-colors',
                  isActive ? 'bg-[#2563eb] text-white shadow-sm' : 'text-[#6b85a6] hover:bg-[#edf3fa] hover:text-[#122033]',
                ].join(' ')}
                aria-pressed={isActive}
              >
                {option} дней
              </button>
            );
          })}
        </div>
      </header>

      {isLoading ? (
        <section className="rounded-xl border border-[#bfd0e8] bg-[#f4f8fc] p-4 text-sm text-[#6b85a6]">Загрузка данных обзора...</section>
      ) : null}

      {error ? (
        <section className="rounded-xl border border-[#e7b4b4] bg-[#fff5f5] p-4 text-sm text-[#d64545]">{error}</section>
      ) : null}

      <KpiGrid
        items={[
          { label: 'Клиенты', value: String(clientsInWindow.length), hint: `Активных: ${activeClients}` },
          { label: 'Сделки', value: String(dealsInWindow.length), hint: `Сумма: ${formatMoney(totalRevenue)}` },
          { label: 'Задачи', value: String(tasksInWindow.length), hint: `Открытых: ${openTasks}` },
          {
            label: 'Выиграно сделок',
            value: String(stageData.find((item) => item.label === dealStageLabels.won)?.value ?? 0),
            hint: `Всего сделок: ${deals.length}`,
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard
            title="Динамика новых записей"
            description={`Клиенты, сделки и задачи, созданные за последние ${periodDays} дней с равномерной разбивкой по интервалам.`}
          >
            <TrendLinesChart data={trendData} periodDays={periodDays} />
          </ChartCard>
        </div>

        <ChartCard
          title="Структура задач"
          description="Распределение задач по статусам помогает быстро оценить загрузку команды."
        >
          <TaskDonutChart data={taskData} />
        </ChartCard>
      </div>

      <ChartCard title="Воронка сделок" description={`Текущий состав сделок по этапам в рамках последних ${periodDays} дней.`}>
        <StageFunnelCards data={stageData} />
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <RecordTable
          title="Последние клиенты"
          description="10 последних клиентов по дате создания."
          rows={latestClients}
          columns={[
            { id: 'id', title: 'ID', cell: (row) => row.id },
            { id: 'name', title: 'Имя', cell: (row) => row.name },
            { id: 'company', title: 'Компания', cell: (row) => row.company || '—' },
            { id: 'status', title: 'Статус', cell: (row) => row.status },
            { id: 'created_at', title: 'Создан', cell: (row) => formatDate(row.created_at) },
          ]}
          emptyText="Пока нет клиентов. Добавьте первого клиента, чтобы увидеть его здесь."
        />

        <RecordTable
          title="Последние сделки"
          description="10 последних сделок по дате создания."
          rows={latestDeals}
          columns={[
            { id: 'id', title: 'ID', cell: (row) => row.id },
            { id: 'title', title: 'Сделка', cell: (row) => row.title },
            { id: 'amount', title: 'Сумма', cell: (row) => formatMoney(row.amount) },
            { id: 'stage', title: 'Этап', cell: (row) => dealStageLabels[row.stage] },
            { id: 'created_at', title: 'Создана', cell: (row) => formatDate(row.created_at) },
          ]}
          emptyText="Пока нет сделок. Создайте первую сделку, чтобы увидеть её в обзоре."
        />
      </div>

      <RecordTable
        title="Текущие задачи"
        description="Все задачи со статусами «К выполнению» и «В работе»."
        rows={currentTasks}
        columns={[
          { id: 'id', title: 'ID', cell: (row) => row.id },
          { id: 'title', title: 'Задача', cell: (row) => row.title },
          { id: 'status', title: 'Статус', cell: (row) => taskStatusLabels[row.status] },
          { id: 'due_date', title: 'Срок', cell: (row) => formatDate(row.due_date) },
          { id: 'client_id', title: 'Client ID', cell: (row) => (row.client_id ?? '—') },
          { id: 'deal_id', title: 'Deal ID', cell: (row) => (row.deal_id ?? '—') },
        ]}
        emptyText="Сейчас нет текущих задач. Когда появятся задачи в работе, они будут отображаться здесь."
      />
    </div>
  );
}
