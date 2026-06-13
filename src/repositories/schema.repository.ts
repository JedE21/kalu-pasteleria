import type { SupabaseClient } from "@supabase/supabase-js";
import type { ForeignKeyRelation, SchemaColumn, SchemaOverview, SchemaTable } from "@/types/database";

const expectedTables = [
  "ventas",
  "sales",
  "pedidos",
  "orders",
  "productos",
  "products",
  "categorias",
  "categories",
  "clientes",
  "customers",
  "promociones",
  "promotions",
  "inventario",
  "inventory",
  "alertas",
  "alerts"
];

type RpcSchemaResponse = {
  tables?: Array<{
    name: string;
    schema?: string;
    columns?: SchemaColumn[];
  }>;
  relations?: ForeignKeyRelation[];
};

export class SchemaRepository {
  constructor(private readonly supabase: SupabaseClient | null) {}

  async getOverview(): Promise<SchemaOverview> {
    if (!this.supabase) {
      return {
        connected: false,
        tables: [],
        relations: [],
        warnings: ["Supabase no esta configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY."]
      };
    }

    const rpcOverview = await this.getRpcOverview();
    if (rpcOverview) {
      return rpcOverview;
    }

    return this.probeExpectedTables();
  }

  private async getRpcOverview(): Promise<SchemaOverview | null> {
    if (!this.supabase) {
      return null;
    }

    const { data, error } = await this.supabase.rpc("get_schema_overview");
    if (error || !data) {
      return null;
    }

    const payload = data as RpcSchemaResponse;
    const tables = (payload.tables ?? []).map<SchemaTable>((table) => ({
      name: table.name,
      schema: table.schema ?? "public",
      columns: table.columns ?? [],
      available: true
    }));

    return {
      connected: true,
      tables,
      relations: payload.relations ?? [],
      warnings: tables.length ? [] : ["La funcion get_schema_overview no devolvio tablas."]
    };
  }

  private async probeExpectedTables(): Promise<SchemaOverview> {
    if (!this.supabase) {
      return { connected: false, tables: [], relations: [], warnings: [] };
    }

    const warnings: string[] = [
      "No se encontro una funcion RPC get_schema_overview; se uso deteccion tolerante de tablas esperadas."
    ];

    const tables = await Promise.all(
      expectedTables.map(async (tableName): Promise<SchemaTable> => {
        const { error } = await this.supabase!.from(tableName).select("*", { count: "exact", head: true });

        if (error) {
          return {
            name: tableName,
            schema: "public",
            columns: [],
            available: false,
            warning: `Tabla ${tableName} no disponible o sin permisos de lectura.`
          };
        }

        return {
          name: tableName,
          schema: "public",
          columns: [],
          available: true
        };
      })
    );

    tables
      .filter((table) => !table.available && table.warning)
      .forEach((table) => warnings.push(table.warning as string));

    return {
      connected: true,
      tables,
      relations: [],
      warnings
    };
  }
}
