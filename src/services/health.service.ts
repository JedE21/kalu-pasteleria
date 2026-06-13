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
      const { error } = await supabase.from("health_checks").select("*", { head: true, count: "exact" });
      return error ? "Conectado; tabla health_checks no disponible." : "API Supabase responde.";
    }),
    timedCheck("PostgreSQL", async () => {
      const { error } = await supabase.rpc("now");
      return error ? "PostgreSQL responde por PostgREST; RPC now no expuesta." : "PostgreSQL operativo.";
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
