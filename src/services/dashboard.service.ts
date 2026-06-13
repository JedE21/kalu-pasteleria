import { AnalyticsRepository, type RawRecord } from "@/repositories/analytics.repository";
import type { ChartPoint, DashboardMetrics, Kpi } from "@/types/database";

const salesTables = ["ventas", "sales", "orders", "pedidos"];
const ordersTables = ["pedidos", "orders", "ventas", "sales"];
const productsTables = ["productos", "products"];
const customersTables = ["clientes", "customers"];
const alertsTables = ["alertas", "alerts"];

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(",", ".")) || 0;
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
  return key ? String(row[key]) : fallback;
}

function pickDate(row: RawRecord): Date | null {
  return asDate(row.created_at ?? row.fecha ?? row.order_date ?? row.sale_date ?? row.createdAt);
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
    .map(([name, value]) => ({ name, value }))
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

  return days.map(({ name, value }) => ({ name, value }));
}

export class DashboardService {
  constructor(private readonly analytics: AnalyticsRepository) {}

  async getMetrics(): Promise<DashboardMetrics> {
    const warnings: string[] = [];
    const [sales, orders, products, customers, alerts] = await Promise.all([
      this.analytics.readFirstAvailable(salesTables),
      this.analytics.readFirstAvailable(ordersTables),
      this.analytics.readFirstAvailable(productsTables),
      this.analytics.readFirstAvailable(customersTables),
      this.analytics.countFirstAvailable(alertsTables)
    ]);

    [sales.warning, orders.warning, products.warning, customers.warning, alerts.warning]
      .filter(Boolean)
      .forEach((warning) => warnings.push(warning as string));

    const todayKey = new Date().toISOString().slice(0, 10);
    const monthKey = new Date().toISOString().slice(0, 7);
    const salesRows = sales.rows;
    const orderRows = orders.rows;
    const customerRows = customers.rows;
    const productRows = products.rows;

    const todaySales = salesRows
      .filter((row) => pickDate(row)?.toISOString().slice(0, 10) === todayKey)
      .reduce((sum, row) => sum + pickNumber(row, ["total", "monto", "amount", "importe", "precio_total"]), 0);

    const monthSales = salesRows
      .filter((row) => pickDate(row)?.toISOString().slice(0, 7) === monthKey)
      .reduce((sum, row) => sum + pickNumber(row, ["total", "monto", "amount", "importe", "precio_total"]), 0);

    const todayOrders = orderRows.filter((row) => pickDate(row)?.toISOString().slice(0, 10) === todayKey).length;
    const averageTicket = salesRows.length ? salesRows.reduce((sum, row) => sum + pickNumber(row, ["total", "monto", "amount", "importe", "precio_total"]), 0) / salesRows.length : 0;
    const newCustomers = customerRows.filter((row) => pickDate(row)?.toISOString().slice(0, 7) === monthKey).length;
    const activeProducts = productRows.filter((row) => row.activo === true || row.active === true || row.estado === "activo" || row.status === "active").length || productRows.length;

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
      salesLast30Days: buildSalesTimeline(salesRows),
      salesByCategory: groupSum(salesRows, ["categoria", "category", "categoria_nombre"], ["total", "monto", "amount", "importe"]),
      topProducts: groupSum(salesRows, ["producto", "product", "producto_nombre", "nombre"], ["cantidad", "quantity", "qty", "total"]),
      profitableProducts: groupSum(productRows, ["nombre", "name", "producto"], ["margen", "margin", "utilidad", "profit"]),
      ordersByStatus: groupSum(orderRows, ["estado", "status"], ["total", "monto", "amount", "cantidad"]),
      warnings
    };
  }
}
