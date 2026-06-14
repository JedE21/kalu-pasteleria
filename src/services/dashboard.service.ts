import { AnalyticsRepository, type RawRecord } from "@/repositories/analytics.repository";
import type { ChartPoint, DashboardMetrics, Kpi } from "@/types/database";

const commercialTables = ["pedidos", "pagos", "ingresos"] as const;
const pedidosTables = ["pedidos"] as const;
const productosTables = ["productos"] as const;
const clientesTables = ["clientes"] as const;
const alertsTables = ["alertas"] as const;
const dashboardTables = ["metricas_dashboard"] as const;

function asNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function asDate(value: unknown): Date | null {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pickNumber(row: RawRecord, keys: string[]): number {
  const key = keys.find((candidate) => candidate in row);
  return key ? asNumber(row[key]) : 0;
}

function pickString(row: RawRecord, keys: string[], fallback = "Sin clasificar"): string {
  const key = keys.find((candidate) => typeof row[candidate] === "string");
  const value = key ? String(row[key]).trim() : "";
  return value || fallback;
}

function pickDate(row: RawRecord): Date | null {
  return asDate(row.created_at ?? row.fecha);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);
}

function groupSum(rows: RawRecord[], labelKeys: string[], valueKeys: string[]): ChartPoint[] {
  const grouped = new Map<string, number>();

  rows.forEach((row) => {
    const label = pickString(row, labelKeys);
    const amount = pickNumber(row, valueKeys);
    grouped.set(label, (grouped.get(label) ?? 0) + amount);
  });

  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value: Number.isFinite(value) ? value : 0 }))
    .filter((point) => point.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

function buildSalesTimeline(rows: RawRecord[]): ChartPoint[] {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - index));
    const key = date.toISOString().slice(0, 10);
    return { key, name: date.toLocaleDateString("es-PE", { day: "2-digit", month: "short" }), value: 0 };
  });

  const indexByKey = new Map(days.map((day, index) => [day.key, index]));
  rows.forEach((row) => {
    const date = pickDate(row);
    if (!date) return;
    const key = date.toISOString().slice(0, 10);
    const index = indexByKey.get(key);
    if (typeof index === "number") {
      days[index].value += pickNumber(row, ["total", "monto", "amount", "importe", "precio_total"]);
    }
  });

  return days.map(({ name, value }) => ({ name, value: Number.isFinite(value) ? value : 0 }));
}

export class DashboardService {
  constructor(private readonly analytics: AnalyticsRepository) {}

  async getMetrics(): Promise<DashboardMetrics> {
    const warnings: string[] = [];
    const [dashboardRows, commercial, pedidos, productos, clientes, alerts] = await Promise.all([
      this.analytics.readFirstAvailable([...dashboardTables]),
      this.analytics.readFirstAvailable([...commercialTables]),
      this.analytics.readFirstAvailable([...pedidosTables]),
      this.analytics.readFirstAvailable([...productosTables]),
      this.analytics.readFirstAvailable([...clientesTables]),
      this.analytics.countFirstAvailable([...alertsTables])
    ]);

    [dashboardRows.warning, commercial.warning, pedidos.warning, productos.warning, clientes.warning, alerts.warning]
      .filter(Boolean)
      .forEach((warning) => warnings.push(warning as string));

    const todayKey = new Date().toISOString().slice(0, 10);
    const monthKey = new Date().toISOString().slice(0, 7);
    const commercialRows = commercial.rows;
    const pedidoRows = pedidos.rows;
    const clienteRows = clientes.rows;
    const productoRows = productos.rows;

    const todaySales = commercialRows
      .filter((row) => pickDate(row)?.toISOString().slice(0, 10) === todayKey)
      .reduce((sum, row) => sum + pickNumber(row, ["total", "monto", "amount", "importe", "precio_total"]), 0);

    const monthSales = commercialRows
      .filter((row) => pickDate(row)?.toISOString().slice(0, 7) === monthKey)
      .reduce((sum, row) => sum + pickNumber(row, ["total", "monto", "amount", "importe", "precio_total"]), 0);

    const todayOrders = pedidoRows.filter((row) => pickDate(row)?.toISOString().slice(0, 10) === todayKey).length;
    const averageTicketRaw = commercialRows.length ? commercialRows.reduce((sum, row) => sum + pickNumber(row, ["total", "monto", "amount", "importe", "precio_total"]), 0) / commercialRows.length : 0;
    const averageTicket = Number.isFinite(averageTicketRaw) ? averageTicketRaw : 0;
    const newCustomers = clienteRows.filter((row) => pickDate(row)?.toISOString().slice(0, 7) === monthKey).length;
    const activeProducts = productoRows.filter((row) => row.activo === true || row.estado === "activo").length || productoRows.length;

    const kpis: Kpi[] = [
      { label: "Ventas Hoy", value: formatCurrency(todaySales), change: "+0.0%", trend: "flat", severity: "success" },
      { label: "Ventas Mes", value: formatCurrency(monthSales), change: "+0.0%", trend: "flat", severity: "success" },
      { label: "Pedidos Hoy", value: String(todayOrders), change: "+0.0%", trend: "flat", severity: "neutral" },
      { label: "Ticket Promedio", value: formatCurrency(averageTicket), change: "+0.0%", trend: "flat", severity: "neutral" },
      { label: "Clientes Nuevos", value: String(newCustomers), change: "+0.0%", trend: "flat", severity: "neutral" },
      { label: "Clientes Recurrentes", value: "0", change: "Pendiente", trend: "flat", severity: "warning" },
      { label: "Productos Activos", value: String(activeProducts), change: "Catalogo", trend: "flat", severity: "neutral" },
      { label: "Alertas", value: String(alerts.count), change: alerts.count ? "Revisar" : "Sin alertas", trend: "flat", severity: alerts.count ? "warning" : "success" }
    ];

    return {
      kpis,
      ventasUltimos30Dias: buildSalesTimeline(commercialRows),
      ventasPorCategoria: groupSum(commercialRows, ["categoria", "categoria_nombre"], ["total", "monto", "importe"]),
      productosMasVendidos: groupSum(commercialRows, ["producto", "producto_nombre", "nombre"], ["cantidad", "total"]),
      productosMasRentables: groupSum(productoRows, ["nombre", "producto"], ["margen", "utilidad"]),
      pedidosPorEstado: groupSum(pedidoRows, ["estado"], ["total", "monto", "cantidad"]),
      warnings
    };
  }
}
