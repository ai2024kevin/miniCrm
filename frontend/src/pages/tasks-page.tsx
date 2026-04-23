import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { DetailsDialog } from '@/components/records/details-dialog';
import { DeleteRecordDialog } from '@/components/records/delete-record-dialog';
import { RecordTable } from '@/components/records/record-table';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Client, Deal, Task } from '@/types/crm';

type TaskForm = {
  client_id: string;
  deal_id: string;
  title: string;
  description: string;
  status: Task['status'];
  due_date: string;
};

const initialForm: TaskForm = {
  client_id: '',
  deal_id: '',
  title: '',
  description: '',
  status: 'todo',
  due_date: '',
};

export function TasksPage() {
  const [rows, setRows] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<TaskForm>(initialForm);
  const detailsRef = useRef<HTMLElement | null>(null);
  const shouldScrollRef = useRef(false);

  const selected = useMemo(() => rows.find((row) => row.id === selectedId) ?? null, [rows, selectedId]);

  function selectRow(id: number) {
    if (selectedId === id) {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    shouldScrollRef.current = true;
    setSelectedId(id);
  }

  async function loadData() {
    const [tasks, clientsData, dealsData] = await Promise.all([
      api.get<Task[]>('/tasks'),
      api.get<Client[]>('/clients'),
      api.get<Deal[]>('/deals'),
    ]);

    setRows(tasks);
    setClients(clientsData);
    setDeals(dealsData);
    setSelectedId((current) => {
      if (current === null) {
        return tasks[0]?.id ?? null;
      }

      const hasCurrentSelection = tasks.some((row) => row.id === current);
      return hasCurrentSelection ? current : (tasks[0]?.id ?? null);
    });
  }

  useEffect(() => {
    void loadData().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selected || !shouldScrollRef.current) {
      return;
    }

    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    shouldScrollRef.current = false;
  }, [selected]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const clientId = Number(form.client_id);
    const dealId = Number(form.deal_id);

    const payload = {
      client_id: Number.isFinite(clientId) && clientId > 0 ? clientId : null,
      deal_id: Number.isFinite(dealId) && dealId > 0 ? dealId : null,
      title: form.title,
      description: form.description || null,
      status: form.status,
      is_done: form.status === 'done',
      due_date: form.due_date ? new Date(`${form.due_date}T00:00:00.000Z`).toISOString() : null,
    };

    await api.post<Task>('/tasks', payload);
    setForm(initialForm);
    await loadData();
  }

  async function onDeleteSelected() {
    if (!selected) return;
    await api.delete(`/tasks/${selected.id}`);
    await loadData();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <RecordTable
          title="Список задач"
          description=""
          rows={rows}
          columns={[
            { id: 'id', title: 'ID', cell: (row) => row.id },
            {
              id: 'title',
              title: 'Задача',
              cell: (row) => (
                <button
                  type="button"
                  className="font-medium text-blue-700 hover:text-blue-800"
                  onClick={() => selectRow(row.id)}
                >
                  {row.title}
                </button>
              ),
            },
            { id: 'status', title: 'Статус', cell: (row) => row.status },
            { id: 'due_date', title: 'Срок', cell: (row) => formatDate(row.due_date) },
            { id: 'client_id', title: 'Client ID', cell: (row) => (row.client_id ?? '—') },
            {
              id: 'actions',
              title: 'Действия',
              cell: (row) => (
                <button
                  type="button"
                  className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                  onClick={() => selectRow(row.id)}
                >
                  Открыть
                </button>
              ),
            },
          ]}
        />

        <DetailsDialog
          sectionRef={detailsRef}
          title={selected ? `Задача #${selected.id} — ${selected.title}` : 'Задача не выбрана'}
          subtitle="Детали выбранной задачи"
          comment={selected?.description}
          fields={
            selected
              ? [
                  { label: 'Статус', value: selected.status },
                  { label: 'Срок', value: formatDate(selected.due_date) },
                  { label: 'Client ID', value: selected.client_id === null ? '—' : String(selected.client_id) },
                  { label: 'Deal ID', value: selected.deal_id === null ? '—' : String(selected.deal_id) },
                ]
              : []
          }
        />
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-2 text-xl font-semibold text-slate-900">Добавить задачу</h2>
          <p className="mb-4 text-sm text-slate-500">Заполните исполнение, связь с клиентом/сделкой и срок.</p>

          <form className="space-y-3" onSubmit={onSubmit}>
            <select
              value={form.client_id}
              onChange={(event) => setForm((prev) => ({ ...prev, client_id: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Клиент не выбран</option>
              {clients.map((client) => (
                <option key={client.id} value={String(client.id)}>
                  {client.name} (#{client.id})
                </option>
              ))}
            </select>
            <select
              value={form.deal_id}
              onChange={(event) => setForm((prev) => ({ ...prev, deal_id: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Сделка не выбрана</option>
              {deals.map((deal) => (
                <option key={deal.id} value={String(deal.id)}>
                  {deal.title} (#{deal.id})
                </option>
              ))}
            </select>
            <input
              required
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Название задачи"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Описание"
              className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as Task['status'] }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="todo">todo</option>
              <option value="doing">doing</option>
              <option value="done">done</option>
            </select>
            <input
              type="date"
              value={form.due_date}
              onChange={(event) => setForm((prev) => ({ ...prev, due_date: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
              Сохранить
            </button>
          </form>
        </section>

        <DeleteRecordDialog
          entityTitle="Задача"
          selectedLabel={selected ? `${selected.title} (#${selected.id})` : ''}
          onConfirm={() => {
            void onDeleteSelected();
          }}
        />
      </div>
    </div>
  );
}
