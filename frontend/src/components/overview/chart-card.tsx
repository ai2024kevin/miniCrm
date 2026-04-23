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

const TREND_CHART = {
  width: 360,
  height: 192,
  paddingTop: 14,
  paddingRight: 8,
  paddingBottom: 18,
  paddingLeft: 8,
  yTicks: 4,
} as const;

function getTrendCoordinates(values: number[], maxValue: number) {
  const plotWidth = TREND_CHART.width - TREND_CHART.paddingLeft - TREND_CHART.paddingRight;
  const plotHeight = TREND_CHART.height - TREND_CHART.paddingTop - TREND_CHART.paddingBottom;

  return values.map((value, index) => {
    const x = values.length === 1
      ? TREND_CHART.paddingLeft
      : TREND_CHART.paddingLeft + (index / (values.length - 1)) * plotWidth;
    const y = TREND_CHART.paddingTop + plotHeight - (value / maxValue) * plotHeight;

    return { x, y, value };
  });
}

function buildPolyline(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) {
    return '';
  }

  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

export function TrendLinesChart({ data, periodDays = 30 }: { data: TrendPoint[]; periodDays?: number }) {
  const hasData = data.some((point) => point.clients > 0 || point.deals > 0 || point.tasks > 0);

  const maxValue = Math.max(
    ...data.flatMap((point) => [point.clients, point.deals, point.tasks]),
    1,
  );

  const yAxisLabels = useMemo(
    () => Array.from({ length: TREND_CHART.yTicks + 1 }, (_, index) => Math.round((maxValue / TREND_CHART.yTicks) * (TREND_CHART.yTicks - index))),
    [maxValue],
  );
  const clientsCoordinates = useMemo(() => getTrendCoordinates(data.map((point) => point.clients), maxValue), [data, maxValue]);
  const dealsCoordinates = useMemo(() => getTrendCoordinates(data.map((point) => point.deals), maxValue), [data, maxValue]);
  const tasksCoordinates = useMemo(() => getTrendCoordinates(data.map((point) => point.tasks), maxValue), [data, maxValue]);
  const clientsPoints = useMemo(() => buildPolyline(clientsCoordinates), [clientsCoordinates]);
  const dealsPoints = useMemo(() => buildPolyline(dealsCoordinates), [dealsCoordinates]);
  const tasksPoints = useMemo(() => buildPolyline(tasksCoordinates), [tasksCoordinates]);
  const plotWidth = TREND_CHART.width - TREND_CHART.paddingLeft - TREND_CHART.paddingRight;
  const plotHeight = TREND_CHART.height - TREND_CHART.paddingTop - TREND_CHART.paddingBottom;

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-[28px] border border-[#D4DFEE] bg-[linear-gradient(180deg,#EAF3FF_0%,#F8FBFF_100%)] px-3 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:px-4">
        {hasData ? (
          <>
            <div className="overflow-hidden rounded-[22px] border border-white/70 bg-[#FDFEFF] px-0 py-2 shadow-sm">
              <svg
                viewBox={`0 0 ${TREND_CHART.width} ${TREND_CHART.height}`}
                preserveAspectRatio="none"
                className="h-60 w-full"
                role="img"
                aria-label="График динамики клиентов, сделок и задач"
              >
                {yAxisLabels.map((label, index) => {
                  const y = TREND_CHART.paddingTop + (plotHeight / TREND_CHART.yTicks) * index;
                  const isBaseline = index === TREND_CHART.yTicks;

                  return (
                    <g key={`grid-${label}-${index}`}>
                      <line
                        x1={TREND_CHART.paddingLeft}
                        y1={y}
                        x2={TREND_CHART.width - TREND_CHART.paddingRight}
                        y2={y}
                        stroke={isBaseline ? '#7F9BC2' : '#D8E4F2'}
                        strokeWidth={isBaseline ? 1.8 : 1}
                        strokeDasharray={isBaseline ? undefined : '5 5'}
                      />
                      <text x="8" y={y - 6} textAnchor="start" fontSize="11" fill="#58769B">
                        {label}
                      </text>
                    </g>
                  );
                })}

                {data.map((point, index) => {
                  const x = data.length === 1
                    ? TREND_CHART.paddingLeft
                    : TREND_CHART.paddingLeft + (index / (data.length - 1)) * plotWidth;

                  return (
                    <line
                      key={point.label}
                      x1={x}
                      y1={TREND_CHART.paddingTop}
                      x2={x}
                      y2={TREND_CHART.paddingTop + plotHeight}
                      stroke="#E4EDF8"
                      strokeWidth="1"
                    />
                  );
                })}

                <polyline points={clientsPoints} fill="none" stroke={SERIES_COLORS.clients} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points={dealsPoints} fill="none" stroke={SERIES_COLORS.deals} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points={tasksPoints} fill="none" stroke={SERIES_COLORS.tasks} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

                {[
                  { key: 'clients', points: clientsCoordinates, color: SERIES_COLORS.clients },
                  { key: 'deals', points: dealsCoordinates, color: SERIES_COLORS.deals },
                  { key: 'tasks', points: tasksCoordinates, color: SERIES_COLORS.tasks },
                ].flatMap((series) =>
                  series.points.map((point, index) => (
                    <g key={`${series.key}-${index}`}>
                      <circle cx={point.x} cy={point.y} r="5" fill="white" stroke={series.color} strokeWidth="2.5" />
                      <circle cx={point.x} cy={point.y} r="2" fill={series.color} />
                    </g>
                  )),
                )}
              </svg>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-[11px] font-medium text-[#58769B]">
              {data.map((point) => (
                <div key={point.label} className="rounded-full bg-white/80 px-2 py-1 shadow-sm">
                  {point.label}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-60 items-center justify-center rounded-[22px] border border-white/70 bg-[#FDFEFF] text-sm text-[#6B85A6]">
            Нет новых записей за последние {periodDays} дней.
          </div>
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
                    <span className="truncate text-xs font-medium text-white">{item.label}</span>
                    <span className="ml-3 shrink-0 text-xs font-semibold text-white">
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
