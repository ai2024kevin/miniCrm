type KpiItem = {
  label: string;
  value: string;
  hint?: string;
};

type KpiGridProps = {
  items: KpiItem[];
};

export function KpiGrid({ items }: KpiGridProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
          {item.hint ? <p className="mt-1 text-xs text-slate-500">{item.hint}</p> : null}
        </article>
      ))}
    </section>
  );
}
