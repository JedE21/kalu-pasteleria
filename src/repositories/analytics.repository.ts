import type { SupabaseClient } from "@supabase/supabase-js";
import { isRealSupabaseTable, type RealSupabaseTable } from "@/config/supabase-schema";
import { withTimeout } from "@/utils/with-timeout";

export type RawRecord = Record<string, unknown>;
type ReadResult = { data: unknown; error: unknown };
type CountResult = { count: number | null; error: unknown };

export class AnalyticsRepository {
  constructor(private readonly supabase: SupabaseClient | null) {}

  async readFirstAvailable(tables: RealSupabaseTable[], columns = "*", limit = 500): Promise<{ table: RealSupabaseTable | null; rows: RawRecord[]; warning?: string }> {
    if (!this.supabase) {
      console.warn("[Supabase] Cliente no configurado para lectura.", { tables });
      return { table: null, rows: [], warning: "Supabase no esta configurado." };
    }

    for (const table of tables) {
      if (!isRealSupabaseTable(table)) {
        console.warn("[Supabase] Tabla ignorada porque no pertenece al esquema real.", { table });
        continue;
      }

      try {
        console.info("[Supabase] Consultando tabla", { table, columns, limit });
        const { data, error } = await withTimeout<ReadResult>(
          this.supabase.from(table).select(columns).limit(limit) as PromiseLike<ReadResult>,
          4500,
          `Lectura ${table}`
        );

        if (error) {
          console.warn("[Supabase] Error al consultar tabla", { table, error });
          continue;
        }

        const rows = Array.isArray(data) ? (data as unknown as RawRecord[]) : [];
        console.info("[Supabase] Tabla consultada correctamente", { table, exists: true, records: rows.length });
        return { table, rows };
      } catch (error) {
        console.error("[Supabase] Excepcion al consultar tabla", { table, error });
      }
    }

    return {
      table: null,
      rows: [],
      warning: `No se encontro una tabla disponible entre: ${tables.join(", ")}.`
    };
  }

  async countFirstAvailable(tables: RealSupabaseTable[]): Promise<{ table: RealSupabaseTable | null; count: number; warning?: string }> {
    if (!this.supabase) {
      console.warn("[Supabase] Cliente no configurado para conteo.", { tables });
      return { table: null, count: 0, warning: "Supabase no esta configurado." };
    }

    for (const table of tables) {
      if (!isRealSupabaseTable(table)) {
        console.warn("[Supabase] Tabla ignorada porque no pertenece al esquema real.", { table });
        continue;
      }

      try {
        console.info("[Supabase] Contando tabla", { table });
        const { count, error } = await withTimeout<CountResult>(
          this.supabase.from(table).select("*", { count: "exact", head: true }) as PromiseLike<CountResult>,
          4500,
          `Conteo ${table}`
        );

        if (error) {
          console.warn("[Supabase] Error al contar tabla", { table, error });
          continue;
        }

        const safeCount = typeof count === "number" && Number.isFinite(count) ? count : 0;
        console.info("[Supabase] Conteo correcto", { table, exists: true, records: safeCount });
        return { table, count: safeCount };
      } catch (error) {
        console.error("[Supabase] Excepcion al contar tabla", { table, error });
      }
    }

    return {
      table: null,
      count: 0,
      warning: `No se encontro una tabla disponible entre: ${tables.join(", ")}.`
    };
  }
}
