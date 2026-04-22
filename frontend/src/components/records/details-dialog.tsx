import type { Ref } from 'react';

type DetailsDialogProps = {
  title: string;
  subtitle?: string;
  comment?: string | null;
  fields?: Array<{ label: string; value: string }>;
  sectionRef?: Ref<HTMLElement>;
};

export function DetailsDialog({ title, subtitle, comment, fields = [], sectionRef }: DetailsDialogProps) {
  return (
    <section ref={sectionRef} className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-2 text-lg font-semibold text-slate-900">Комментарий и карточка</h3>
      <p className="mb-4 text-sm text-slate-500">{subtitle ?? title}</p>

      <div className="space-y-3 rounded-lg bg-slate-50 p-4">
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Название</div>
          <div className="text-sm font-medium text-slate-800">{title}</div>
        </div>

        {fields.map((field) => (
          <div key={field.label}>
            <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">{field.label}</div>
            <div className="text-sm text-slate-700">{field.value || '—'}</div>
          </div>
        ))}

        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Комментарий</div>
          <div className="text-sm text-slate-700">{comment?.trim() ? comment : 'Комментарий не указан'}</div>
        </div>
      </div>
    </section>
  );
}
