import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DetailsDialog } from '@/components/records/details-dialog';
import { DeleteRecordDialog } from '@/components/records/delete-record-dialog';
import { RecordTable } from '@/components/records/record-table';
import { api } from '@/lib/api';
import type { Client } from '@/types/crm';

type ClientForm = {
  name: string;
  phone: string;
  email: string;
  company: string;
  status: Client['status'];
  comment: string;
};

const initialForm: ClientForm = {
  name: '',
  phone: '',
  email: '',
  company: '',
  status: 'active',
  comment: '',
};

export function ClientsPage() {
  const [rows, setRows] = useState<Client[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<ClientForm>(initialForm);

  const selected = useMemo(() => rows.find((row) => row.id === selectedId) ?? null, [rows, selectedId]);

  async function loadClients() {
    const data = await api.get<Client[]>('/clients');
    setRows(data);
    setSelectedId((current) => current ?? data[0]?.id ?? null);
  }

  useEffect(() => {
    void loadClients().catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      company: form.company || null,
      status: form.status,
      comment: form.comment || null,
    };

    await api.post<Client>('/clients', payload);
    setForm(initialForm);
    await loadClients();
  }

  async function onDeleteSelected() {
    if (!selected) return;
    await api.delete(`/clients/${selected.id}`);
    await loadClients();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <RecordTable
          title="Список клиентов"
          description="Прокручиваемая таблица со всеми клиентами CRM."
          rows={rows}
          columns={[
            { id: 'id', title: 'ID', cell: (row) => row.id },
            {
              id: 'name',
              title: 'Имя',
              cell: (row) => (
                <button
                  type="button"
                  className="font-medium text-blue-700 hover:text-blue-800"
                  onClick={() => setSelectedId(row.id)}
                >
                  {row.name}
                </button>
              ),
            },
            { id: 'company', title: 'Компания', cell: (row) => row.company || '—' },
            { id: 'status', title: 'Статус', cell: (row) => row.status },
            { id: 'phone', title: 'Телефон', cell: (row) => row.phone || '—' },
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
          title={selected ? `Клиент #${selected.id} — ${selected.name}` : 'Клиент не выбран'}
          subtitle="Детали выбранного клиента"
          comment={selected?.comment}
          fields={
            selected
              ? [
                  { label: 'Компания', value: selected.company || '—' },
                  { label: 'Email', value: selected.email || '—' },
                  { label: 'Телефон', value: selected.phone || '—' },
                  { label: 'Статус', value: selected.status },
                ]
              : []
          }
        />
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-2 text-xl font-semibold text-slate-900">Добавить клиента</h2>
          <p className="mb-4 text-sm text-slate-500">Заполните основные данные и добавьте комментарий для менеджера.</p>

          <form className="space-y-3" onSubmit={onSubmit}>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Имя"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="Телефон"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              value={form.company}
              onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
              placeholder="Компания"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as Client['status'] }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="active">active</option>
              <option value="archived">archived</option>
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
          entityTitle="Клиент"
          selectedLabel={selected ? `${selected.name} (#${selected.id})` : ''}
          onConfirm={() => {
            void onDeleteSelected();
          }}
        />
      </div>
    </div>
  );
}
