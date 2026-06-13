import { DonutChart, RankingChart, SalesAreaChart } from "@/components/dashboard/charts";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { WarningPanel } from "@/components/dashboard/warning-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnalyticsRepository } from "@/repositories/analytics.repository";
import { SchemaRepository } from "@/repositories/schema.repository";
import { DashboardService } from "@/services/dashboard.service";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient("anon");
  const metrics = await new DashboardService(new AnalyticsRepository(supabase)).getMetrics();
  const schema = await new SchemaRepository(supabase).getOverview();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant={schema.connected ? "success" : "warning"}>{schema.connected ? "Supabase conectado" : "Supabase pendiente"}</Badge>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-stone-950 dark:text-white sm:text-4xl">Dashboard ejecutivo</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
            Vista de control para entender ventas, pedidos, clientes, productos y alertas en menos de 30 segundos.
          </p>
        </div>
        <Card className="lg:w-[360px]">
          <CardTitle>Modelo detectado</CardTitle>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
            {schema.tables.filter((table) => table.available).length} tablas disponibles, {schema.relations.length} relaciones detectadas.
          </p>
        </Card>
      </section>

      <WarningPanel warnings={[...schema.warnings, ...metrics.warnings]} />
      <KpiGrid kpis={metrics.kpis} />

      <section className="grid gap-4 xl:grid-cols-3">
        <SalesAreaChart data={metrics.salesLast30Days} />
        <DonutChart title="Pedidos por estado" data={metrics.ordersByStatus} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <RankingChart title="Ventas por categoría" data={metrics.salesByCategory} />
        <RankingChart title="Productos más vendidos" data={metrics.topProducts} />
        <RankingChart title="Productos más rentables" data={metrics.profitableProducts} />
        <Card>
          <CardTitle>Business Intelligence</CardTitle>
          <div className="mt-5 space-y-3 text-sm text-stone-600 dark:text-stone-300">
            <p>Los insights se generan automaticamente cuando Supabase expone ventas, productos, clientes e inventario.</p>
            <p>El motor esta preparado para detectar crecimiento, baja rotacion, riesgo de abandono y recomendaciones de produccion.</p>
          </div>
        </Card>
      </section>
    </div>
  );
}
