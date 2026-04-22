import { type ReactNode, useMemo } from 'react';

type ChartCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

type TrendPoint = {
  label: string;
  clients: number;
  deals: number;
  tasks: number;
};

type StageDatum = {
  label: string;
  value: number;
  hint: string;
};

type DonutDatum = {
  label: string;
  value: number;
  color: string;
};

const SERIES_COLORS = {
  clients: '#1D3557',
  deals: '#2563EB',
  tasks: '#2F855A',
};

export function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <section className="rounded-2xl border border-[#BFD0E8] bg-[#F4F8FC] p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#122033]">{title}</h2>
      <p className="mt-1 text-sm text-[#6B85A6]">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function buildPolyline(values: number[], maxValue: number) {
  const width = 100;
  const height = 44;

  if (values.length < 2) {
    return '';
  }

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - (value / maxValue) * height;
      return `${x},${y}`;
    })
    .join(' ');
}

export function TrendLinesChart({ data, periodDays = 30 }: { data: TrendPoint[]; periodDays?: number }) {
  const hasData = data.some((point) => point.clients > 0 || point.deals > 0 || point.tasks > 0);

  const maxValue = Math.max(
    ...data.flatMap((point) => [point.clients, point.deals, point.tasks]),
    1,
  );

  const clientsPoints = useMemo(() => buildPolyline(data.map((point) => point.clients), maxValue), [data, maxValue]);
  const dealsPoints = useMemo(() => buildPolyline(data.map((point) => point.deals), maxValue), [data, maxValue]);
  const tasksPoints = useMemo(() => buildPolyline(data.map((point) => point.tasks), maxValue), [data, maxValue]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#D4DFEE] bg-[#DBEAFE] p-4">
        {hasData ? (
          <svg viewBox="0 0 100 44" className="h-36 w-full" role="img" aria-label="График динамики клиентов, сделок и задач">
            <polyline points={clientsPoints} fill="none" stroke={SERIES_COLORS.clients} strokeWidth="1.8" strokeLinecap="round" />
            <polyline points={dealsPoints} fill="none" stroke={SERIES_COLORS.deals} strokeWidth="1.8" strokeLinecap="round" />
            <polyline points={tasksPoints} fill="none" stroke={SERIES_COLORS.tasks} strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <div className="flex h-36 items-center justify-center text-sm text-[#6B85A6]">Нет новых записей за последние {periodDays} дней.</div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <LegendItem label="Клиенты" color={SERIES_COLORS.clients} />
        <LegendItem label="Сделки" color={SERIES_COLORS.deals} />
        <LegendItem label="Задачи" color={SERIES_COLORS.tasks} />
      </div>

    </div>
  );
}

function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#D4DFEE] bg-[#F4F8FC] px-2 py-1 text-xs text-[#6B85A6]">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function StageFunnelCards({ data }: { data: StageDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const hasData = total > 0;
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-4" data-testid="horizontal-funnel-chart">
      <div className="flex items-center justify-between rounded-xl border border-[#D4DFEE] bg-[#DBEAFE] px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#6B85A6]">Всего сделок</p>
          <p className="text-2xl font-semibold text-[#122033]">{total}</p>
        </div>
        <p className="text-xs text-[#6B85A6]">За выбранный период</p>
      </div>

      {hasData ? (
        <div className="space-y-3">
          {data.map((item) => {
            const share = Math.round((item.value / total) * 100);
            const width = Math.max(12, Math.round((item.value / maxValue) * 100));
            const isDarkFill = width >= 45;

            return (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-end text-sm">
                  <span className="text-xs text-[#6B85A6]">{item.hint}</span>
                </div>

                <div className="relative h-9 overflow-hidden rounded-full bg-[#D4DFEE]">
                  <div
                    className="flex h-full items-center justify-between rounded-full bg-[#1D3557] px-3"
                    style={{ width: `${width}%` }}
                  >
                    <span className={`truncate text-xs font-medium ${isDarkFill ? 'text-white' : 'text-[#122033]'}`}>{item.label}</span>
                    <span className={`ml-3 shrink-0 text-xs font-semibold ${isDarkFill ? 'text-white' : 'text-[#122033]'}`}>
                      {item.value}
                    </span>
                  </div>
                  {!isDarkFill ? (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#1D3557]">
                      {share}%
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="pt-1 text-sm text-[#6B85A6]">Сделок в выбранном периоде пока нет.</p>
      )}
    </div>
  );
}

export function TaskDonutChart({ data }: { data: DonutDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const background = useMemo(() => {
    if (total === 0) {
      return 'conic-gradient(#D4DFEE 0 100%)';
    }

    let cursor = 0;
    const segments = data.map((item) => {
      const start = cursor;
      const angle = (item.value / total) * 360;
      cursor += angle;
      return `${item.color} ${start}deg ${cursor}deg`;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }, [data, total]);

  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="relative mx-auto h-36 w-36 rounded-full" style={{ background }} role="img" aria-label="Диаграмма структуры задач">
        <div className="absolute inset-4 grid place-items-center rounded-full bg-[#F4F8FC] text-center">
          <p className="text-xl font-semibold text-[#122033]">{total}</p>
          <p className="text-[11px] text-[#6B85A6]">всего задач</p>
        </div>
      </div>

      <div className="space-y-2">
        {data.map((item) => {
          const share = total > 0 ? Math.round((item.value / total) * 100) : 0;

          return (
            <div key={item.label} className="flex items-center justify-between rounded-lg border border-[#D4DFEE] bg-[#F4F8FC] px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-[#1D3557]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
                {item.label}
              </span>
              <span className="text-[#6B85A6]">{item.value} ({share}%)</span>
            </div>
          );
        })}
        {total === 0 ? <p className="text-sm text-[#6B85A6]">Пока нет задач за последние 30 дней.</p> : null}
      </div>
    </div>
  );
}
