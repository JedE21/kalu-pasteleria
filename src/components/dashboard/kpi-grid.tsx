import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Kpi } from "@/types/database";

function TrendIcon({ trend }: { trend: Kpi["trend"] }) {
  if (trend === "up") return <ArrowUpRight size={16} />;
  if (trend === "down") return <ArrowDownRight size={16} />;
  return <ArrowRight size={16} />;
}

export function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores clave">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-blush/25 dark:bg-blush/10" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{kpi.label}</p>
              <Badge variant={kpi.severity}>{kpi.change}</Badge>
            </div>
            <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-stone-950 dark:text-white">{kpi.value}</p>
            <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-stone-500 dark:text-stone-400">
              <TrendIcon trend={kpi.trend} />
              Comparacion historica disponible al conectar datos completos.
            </p>
          </div>
        </Card>
      ))}
    </section>
  );
}
