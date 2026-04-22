type ChartDatum = {
  label: string;
  value: number;
};

type ChartCardProps = {
  title: string;
  description: string;
  data: ChartDatum[];
};

export function ChartCard({ title, description, data }: ChartCardProps) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      <div className="mt-4 space-y-3">
        {data.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm text-slate-700">
              <span>{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-slate-700 transition-all"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
