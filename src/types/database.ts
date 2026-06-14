export type Severity = "success" | "warning" | "danger" | "neutral";

export type SchemaColumn = {
  tableName: string;
  columnName: string;
  dataType: string;
  isNullable: boolean;
  columnDefault: string | null;
};

export type SchemaTable = {
  name: string;
  schema: string;
  columns: SchemaColumn[];
  available: boolean;
  warning?: string;
};

export type ForeignKeyRelation = {
  tableName: string;
  columnName: string;
  foreignTableName: string;
  foreignColumnName: string;
};

export type SchemaOverview = {
  connected: boolean;
  tables: SchemaTable[];
  relations: ForeignKeyRelation[];
  warnings: string[];
};

export type Kpi = {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "flat";
  severity: Severity;
};

export type ChartPoint = {
  name: string;
  value: number;
  secondary?: number;
};

export type DashboardMetrics = {
  kpis: Kpi[];
  ventasUltimos30Dias: ChartPoint[];
  ventasPorCategoria: ChartPoint[];
  productosMasVendidos: ChartPoint[];
  productosMasRentables: ChartPoint[];
  pedidosPorEstado: ChartPoint[];
  warnings: string[];
};

export type HealthCheck = {
  name: string;
  status: "operational" | "warning" | "error";
  latencyMs: number | null;
  message: string;
};
