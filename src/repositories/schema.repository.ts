import type { SupabaseClient } from "@supabase/supabase-js";
import { realSupabaseTables } from "@/config/supabase-schema";
import type { SchemaColumn, SchemaOverview, SchemaTable } from "@/types/database";

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

    return this.probeExpectedTables();
  }

  private async probeExpectedTables(): Promise<SchemaOverview> {
    if (!this.supabase) {
      return { connected: false, tables: [], relations: [], warnings: [] };
    }

    const warnings: string[] = [];

    const tables = await Promise.all(
      realSupabaseTables.map(async (tableName): Promise<SchemaTable> => {
        try {
          console.info("[Supabase] Detectando tabla", { table: tableName });
          const { data, error } = await this.supabase!.from(tableName).select("*").limit(1);

          if (error) {
            console.warn("[Supabase] Tabla no disponible", { table: tableName, error });
            return {
              name: tableName,
              schema: "public",
              columns: [],
              available: false,
              warning: `Tabla ${tableName} no disponible o sin permisos de lectura.`
            };
          }

          const firstRow = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : undefined;
          const columns: SchemaColumn[] = firstRow
            ? Object.keys(firstRow).map((columnName) => ({
                tableName,
                columnName,
                dataType: typeof firstRow[columnName],
                isNullable: firstRow[columnName] === null,
                columnDefault: null
              }))
            : [];

          console.info("[Supabase] Tabla detectada", { table: tableName, exists: true, records: Array.isArray(data) ? data.length : 0, columns: columns.length });

          return {
            name: tableName,
            schema: "public",
            columns,
            available: true
          };
        } catch (error) {
          console.error("[Supabase] Excepcion detectando tabla", { table: tableName, error });
          return {
            name: tableName,
            schema: "public",
            columns: [],
            available: false,
            warning: `Tabla ${tableName} no disponible o sin permisos de lectura.`
          };
        }
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
