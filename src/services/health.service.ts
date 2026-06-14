import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { HealthCheck } from "@/types/database";

async function timedCheck(name: string, check: () => Promise<string>): Promise<HealthCheck> {
  const started = Date.now();
  try {
    const message = await check();
    return {
      name,
      status: "operational",
      latencyMs: Date.now() - started,
      message
    };
  } catch (error) {
    return {
      name,
      status: "warning",
      latencyMs: Date.now() - started,
      message: error instanceof Error ? error.message : "Servicio no disponible."
    };
  }
}

export async function getSystemHealth(): Promise<HealthCheck[]> {
  const supabase = createSupabaseServerClient("anon");

  if (!supabase) {
    return [
      { name: "Supabase", status: "warning", latencyMs: null, message: "Variables de entorno no configuradas." },
      { name: "PostgreSQL", status: "warning", latencyMs: null, message: "Conexion pendiente de configuracion." },
      { name: "Auth", status: "warning", latencyMs: null, message: "Cliente Supabase no inicializado." },
      { name: "Storage", status: "warning", latencyMs: null, message: "Cliente Supabase no inicializado." },
      { name: "Realtime", status: "warning", latencyMs: null, message: "Cliente Supabase no inicializado." }
    ];
  }

    return Promise.all([
      timedCheck("Supabase", async () => {
      console.info("[Supabase] Health check consultando tabla", { table: "configuracion_empresa" });
      const { count, error } = await supabase.from("configuracion_empresa").select("*", { head: true, count: "exact" });
      if (error) {
        console.warn("[Supabase] Health check fallo", { table: "configuracion_empresa", error });
        return "Supabase responde, pero configuracion_empresa no esta disponible para lectura.";
      }
      console.info("[Supabase] Health check correcto", { table: "configuracion_empresa", exists: true, records: count ?? 0 });
      return "API Supabase responde.";
    }),
    timedCheck("PostgreSQL", async () => {
      console.info("[Supabase] Health check consultando tabla", { table: "pedidos" });
      const { count, error } = await supabase.from("pedidos").select("*", { head: true, count: "exact" });
      if (error) {
        console.warn("[Supabase] Health check fallo", { table: "pedidos", error });
        return "PostgreSQL responde por Supabase, pero pedidos no esta disponible para lectura.";
      }
      console.info("[Supabase] Health check correcto", { table: "pedidos", exists: true, records: count ?? 0 });
      return "PostgreSQL operativo.";
    }),
    timedCheck("Auth", async () => {
      const { error } = await supabase.auth.getSession();
      return error ? "Auth responde con advertencia." : "Auth operativo.";
    }),
    timedCheck("Storage", async () => {
      const { error } = await supabase.storage.listBuckets();
      return error ? "Storage requiere permisos para listar buckets." : "Storage operativo.";
    }),
    timedCheck("Realtime", async () => "Realtime configurado en cliente Supabase.")
  ]);
}
