import type { SupabaseClient } from "@supabase/supabase-js";
import { dashboardCoreTables } from "@/config/supabase-schema";
import type { SchemaOverview, SchemaTable } from "@/types/database";
import { withTimeout } from "@/utils/with-timeout";

export class SchemaRepository {
  constructor(private readonly supabase: SupabaseClient | null) {}

  async getOverview(): Promise<SchemaOverview> {
    if (!this.supabase) {
      return {
        connected: false,
        tables: [],
        relations: [],
        warnings: ["Supabase no esta configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Netlify."]
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
      dashboardCoreTables.map(async (tableName): Promise<SchemaTable> => {
        try {
          console.info("[Supabase] Detectando tabla", { table: tableName });
          const { count, error } = await withTimeout<{ count: number | null; error: unknown }>(
            this.supabase!.from(tableName).select("*", { count: "exact", head: true }) as PromiseLike<{ count: number | null; error: unknown }>,
            3500,
            `Deteccion ${tableName}`
          );

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

          console.info("[Supabase] Tabla detectada", { table: tableName, exists: true, records: count ?? 0, columns: 0 });

          return {
            name: tableName,
            schema: "public",
            columns: [],
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
