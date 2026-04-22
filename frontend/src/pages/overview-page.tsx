import { useEffect, useMemo, useState } from 'react';
import { ChartCard } from '@/components/overview/chart-card';
import { KpiGrid } from '@/components/overview/kpi-grid';
import { formatMoney } from '@/lib/format';
import { api } from '@/lib/api';
import type { Client, Deal, Task } from '@/types/crm';

export function OverviewPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    async function loadData() {
      const [clientsData, dealsData, tasksData] = await Promise.all([
        api.get<Client[]>('/clients'),
        api.get<Deal[]>('/deals'),
        api.get<Task[]>('/tasks'),
      ]);

      setClients(clientsData);
      setDeals(dealsData);
      setTasks(tasksData);
    }

    void loadData().catch(() => undefined);
  }, []);

  const totalRevenue = useMemo(() => deals.reduce((sum, deal) => sum + deal.amount, 0), [deals]);
  const activeClients = useMemo(() => clients.filter((item) => item.status === 'active').length, [clients]);
  const openTasks = useMemo(() => tasks.filter((item) => item.status !== 'done').length, [tasks]);

  const stageData = useMemo(() => {
    const buckets: Record<Deal['stage'], number> = {
      new: 0,
      in_progress: 0,
      won: 0,
      lost: 0,
    };

    for (const deal of deals) {
      buckets[deal.stage] += 1;
    }

    return [
      { label: 'new', value: buckets.new },
      { label: 'in_progress', value: buckets.in_progress },
      { label: 'won', value: buckets.won },
      { label: 'lost', value: buckets.lost },
    ];
  }, [deals]);

  const taskData = useMemo(() => {
    const buckets: Record<Task['status'], number> = {
      todo: 0,
      doing: 0,
      done: 0,
    };

    for (const task of tasks) {
      buckets[task.status] += 1;
    }

    return [
      { label: 'todo', value: buckets.todo },
      { label: 'doing', value: buckets.doing },
      { label: 'done', value: buckets.done },
    ];
  }, [tasks]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Обзор за последние 30 дней</h1>
        <p className="mt-1 text-sm text-slate-500">Ключевые показатели CRM и сводка по текущему состоянию воронки.</p>
      </header>

      <KpiGrid
        items={[
          { label: 'Клиенты', value: String(clients.length), hint: `Активных: ${activeClients}` },
          { label: 'Сделки', value: String(deals.length), hint: `Сумма: ${formatMoney(totalRevenue)}` },
          { label: 'Задачи', value: String(tasks.length), hint: `Открытых: ${openTasks}` },
          { label: 'Выиграно сделок', value: String(stageData.find((item) => item.label === 'won')?.value ?? 0) },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Воронка сделок" description="Распределение сделок по этапам." data={stageData} />
        <ChartCard title="Статусы задач" description="Актуальная загрузка команды по задачам." data={taskData} />
      </div>
    </div>
  );
}
