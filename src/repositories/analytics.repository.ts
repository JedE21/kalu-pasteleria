import type { SupabaseClient } from "@supabase/supabase-js";

export type RawRecord = Record<string, unknown>;

export class AnalyticsRepository {
  constructor(private readonly supabase: SupabaseClient | null) {}

  async readFirstAvailable(tables: string[], columns = "*", limit = 500): Promise<{ table: string | null; rows: RawRecord[]; warning?: string }> {
    if (!this.supabase) {
      return { table: null, rows: [], warning: "Supabase no esta configurado." };
    }

    for (const table of tables) {
      const { data, error } = await this.supabase.from(table).select(columns).limit(limit);
      if (!error && data) {
        return { table, rows: data as unknown as RawRecord[] };
      }
    }

    return {
      table: null,
      rows: [],
      warning: `No se encontro una tabla disponible entre: ${tables.join(", ")}.`
    };
  }

  async countFirstAvailable(tables: string[]): Promise<{ table: string | null; count: number; warning?: string }> {
    if (!this.supabase) {
      return { table: null, count: 0, warning: "Supabase no esta configurado." };
    }

    for (const table of tables) {
      const { count, error } = await this.supabase.from(table).select("*", { count: "exact", head: true });
      if (!error && typeof count === "number") {
        return { table, count };
      }
    }

    return {
      table: null,
      count: 0,
      warning: `No se encontro una tabla disponible entre: ${tables.join(", ")}.`
    };
  }
}
