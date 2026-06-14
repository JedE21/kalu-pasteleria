import { Card, CardTitle } from "@/components/ui/card";
import type { ChartPoint } from "@/types/database";

const palette = ["#8B5E3C", "#D4AF37", "#F8C8DC", "#A97855", "#5F3D29", "#E7B7C9"];

function EmptyChart() {
  return (
    <div className="grid h-[260px] place-items-center rounded-xl border border-dashed border-stone-200 text-center text-sm text-stone-500 dark:border-white/10 dark:text-stone-400">
      Sin datos disponibles. El modulo se llenara automaticamente desde Supabase.
    </div>
  );
}

function safePoints(data: ChartPoint[]) {
  return data
    .map((point) => ({
      name: point.name || "Sin clasificar",
      value: Number.isFinite(point.value) ? Math.max(0, point.value) : 0
    }))
    .filter((point) => point.value > 0);
}

export function VentasAreaChart({ data }: { data: ChartPoint[] }) {
  const points = data.map((point) => ({
    name: point.name,
    value: Number.isFinite(point.value) ? Math.max(0, point.value) : 0
  }));
  const max = Math.max(...points.map((point) => point.value), 1);
  const graphPoints = points.map((point, index) => {
    const x = points.length <= 1 ? 0 : (index / (points.length - 1)) * 100;
    const y = 100 - (point.value / max) * 86;
    return `${x},${y}`;
  });
  const areaPath = graphPoints.length ? `M0,100 L${graphPoints.join(" L")} L100,100 Z` : "";

  return (
    <Card className="xl:col-span-2">
      <CardTitle>Ventas últimos 30 días</CardTitle>
      <div className="mt-5 h-[310px]">
        {points.some((point) => point.value > 0) ? (
          <div className="flex h-full flex-col">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-[250px] w-full overflow-visible rounded-xl border border-stone-100 bg-cream/70 p-2 dark:border-white/10 dark:bg-white/5" role="img" aria-label="Ventas últimos 30 días">
              <defs>
                <linearGradient id="ventasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F8C8DC" stopOpacity="0.9" />
                  <stop offset="95%" stopColor="#F8C8DC" stopOpacity="0.06" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#ventasGradient)" />
              <polyline points={graphPoints.join(" ")} fill="none" stroke="#8B5E3C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="mt-3 flex justify-between text-xs text-stone-400">
              <span>{points[0]?.name}</span>
              <span>{points[points.length - 1]?.name}</span>
            </div>
          </div>
        ) : (
          <EmptyChart />
        )}
      </div>
    </Card>
  );
}

export function RankingChart({ title, data }: { title: string; data: ChartPoint[] }) {
  const points = safePoints(data).slice(0, 7);
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-5 h-[260px]">
        {points.length ? (
          <div className="space-y-4">
            {points.map((point) => (
              <div key={point.name} className="grid gap-1">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-stone-500 dark:text-stone-400">
                  <span className="truncate">{point.name}</span>
                  <span>{point.value.toLocaleString("es-PE")}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
                  <div className="h-full rounded-full bg-chocolate dark:bg-gold" style={{ width: `${Math.max(8, (point.value / max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyChart />
        )}
      </div>
    </Card>
  );
}

export function DonutChart({ title, data }: { title: string; data: ChartPoint[] }) {
  const points = safePoints(data).slice(0, 6);
  const total = points.reduce((sum, point) => sum + point.value, 0);
  let cursor = 0;
  const gradient = points
    .map((point, index) => {
      const start = cursor;
      const end = cursor + (point.value / total) * 100;
      cursor = end;
      return `${palette[index % palette.length]} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-5 h-[260px]">
        {points.length && total > 0 ? (
          <div className="flex h-full items-center justify-center gap-6">
            <div className="grid h-36 w-36 place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
              <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-sm font-bold text-stone-700 shadow-inner dark:bg-[#17110d] dark:text-white">
                {total.toLocaleString("es-PE")}
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              {points.map((point, index) => (
                <div key={point.name} className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                  <span className="truncate">{point.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyChart />
        )}
      </div>
    </Card>
  );
}
