import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DetailsDialog } from '@/components/records/details-dialog';
import { DeleteRecordDialog } from '@/components/records/delete-record-dialog';
import { RecordTable } from '@/components/records/record-table';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { Client, Deal } from '@/types/crm';

type DealForm = {
  client_id: string;
  title: string;
  amount: string;
  stage: Deal['stage'];
  comment: string;
};

const initialForm: DealForm = {
  client_id: '',
  title: '',
  amount: '',
  stage: 'new',
  comment: '',
};

export function DealsPage() {
  const [rows, setRows] = useState<Deal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<DealForm>(initialForm);

  const selected = useMemo(() => rows.find((row) => row.id === selectedId) ?? null, [rows, selectedId]);

  async function loadData() {
    const [deals, clientsData] = await Promise.all([api.get<Deal[]>('/deals'), api.get<Client[]>('/clients')]);
    setRows(deals);
    setClients(clientsData);
    setSelectedId((current) => current ?? deals[0]?.id ?? null);
  }

  useEffect(() => {
    void loadData().catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const clientId = Number(form.client_id);
    const amount = Number(form.amount);

    const payload = {
      client_id: Number.isFinite(clientId) && clientId > 0 ? clientId : null,
      title: form.title,
      amount: Number.isFinite(amount) ? amount : 0,
      stage: form.stage,
      comment: form.comment || null,
      close_date: null,
    };

    await api.post<Deal>('/deals', payload);
    setForm(initialForm);
    await loadData();
  }

  async function onDeleteSelected() {
    if (!selected) return;
    await api.delete(`/deals/${selected.id}`);
    await loadData();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <RecordTable
          title="Список сделок"
          description="Прокручиваемая таблица со всеми сделками CRM."
          rows={rows}
          columns={[
            { id: 'id', title: 'ID', cell: (row) => row.id },
            {
              id: 'title',
              title: 'Сделка',
              cell: (row) => (
                <button
                  type="button"
                  className="font-medium text-blue-700 hover:text-blue-800"
                  onClick={() => setSelectedId(row.id)}
                >
                  {row.title}
                </button>
              ),
            },
            { id: 'client_id', title: 'Client ID', cell: (row) => (row.client_id ?? '—') },
            { id: 'amount', title: 'Сумма', cell: (row) => formatMoney(row.amount) },
            { id: 'stage', title: 'Этап', cell: (row) => row.stage },
            {
              id: 'actions',
              title: 'Действия',
              cell: (row) => (
                <button
                  type="button"
                  className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                  onClick={() => setSelectedId(row.id)}
                >
                  Открыть
                </button>
              ),
            },
          ]}
        />

        <DetailsDialog
          title={selected ? `Сделка #${selected.id} — ${selected.title}` : 'Сделка не выбрана'}
          subtitle="Детали выбранной сделки"
          comment={selected?.comment}
          fields={
            selected
              ? [
                  { label: 'Client ID', value: selected.client_id === null ? '—' : String(selected.client_id) },
                  { label: 'Сумма', value: formatMoney(selected.amount) },
                  { label: 'Этап', value: selected.stage },
                ]
              : []
          }
        />
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-2 text-xl font-semibold text-slate-900">Добавить сделку</h2>
          <p className="mb-4 text-sm text-slate-500">Заполните ключевые параметры сделки и этап воронки.</p>

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
            <input
              required
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Название сделки"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              required
              type="number"
              min="0"
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              placeholder="Сумма"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <select
              value={form.stage}
              onChange={(event) => setForm((prev) => ({ ...prev, stage: event.target.value as Deal['stage'] }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="new">new</option>
              <option value="in_progress">in_progress</option>
              <option value="won">won</option>
              <option value="lost">lost</option>
            </select>
            <textarea
              value={form.comment}
              onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
              placeholder="Комментарий"
              className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
              Сохранить
            </button>
          </form>
        </section>

        <DeleteRecordDialog
          entityTitle="Сделка"
          selectedLabel={selected ? `${selected.title} (#${selected.id})` : ''}
          onConfirm={() => {
            void onDeleteSelected();
          }}
        />
      </div>
    </div>
  );
}
