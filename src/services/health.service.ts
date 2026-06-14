import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import type { HealthCheck } from "@/types/database";
import { withTimeout } from "@/utils/with-timeout";

type CountResult = { count: number | null; error: unknown };
type ErrorResult = { error: unknown };

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
  const supabaseHost = env.supabaseUrl ? new URL(env.supabaseUrl).host : "";
  const projectRef = supabaseHost.split(".")[0] ?? "";

  const projectCheck: HealthCheck = {
    name: "Proyecto Supabase",
    status: projectRef ? "operational" : "warning",
    latencyMs: null,
    message: projectRef ? `Conectado a ${projectRef}` : "VITE_SUPABASE_URL no esta configurado."
  };

  if (!supabase) {
    return [
      projectCheck,
      { name: "Supabase", status: "warning", latencyMs: null, message: "Variables de entorno no configuradas." },
      { name: "PostgreSQL", status: "warning", latencyMs: null, message: "Conexion pendiente de configuracion." },
      { name: "Auth", status: "warning", latencyMs: null, message: "Cliente Supabase no inicializado." },
      { name: "Storage", status: "warning", latencyMs: null, message: "Cliente Supabase no inicializado." },
      { name: "Realtime", status: "warning", latencyMs: null, message: "Cliente Supabase no inicializado." }
    ];
  }

  const checks = await Promise.all([
    timedCheck("Supabase", async () => {
      console.info("[Supabase] Health check consultando tabla", { table: "configuracion_empresa" });
      const { count, error } = await withTimeout<CountResult>(
        supabase.from("configuracion_empresa").select("*", { head: true, count: "exact" }) as PromiseLike<CountResult>,
        4500,
        "Health configuracion_empresa"
      );
      if (error) {
        console.warn("[Supabase] Health check fallo", { table: "configuracion_empresa", error });
        return "Supabase responde, pero configuracion_empresa no esta disponible para lectura.";
      }
      console.info("[Supabase] Health check correcto", { table: "configuracion_empresa", exists: true, records: count ?? 0 });
      return "API Supabase responde.";
    }),
    timedCheck("PostgreSQL", async () => {
      console.info("[Supabase] Health check consultando tabla", { table: "pedidos" });
      const { count, error } = await withTimeout<CountResult>(
        supabase.from("pedidos").select("*", { head: true, count: "exact" }) as PromiseLike<CountResult>,
        4500,
        "Health pedidos"
      );
      if (error) {
        console.warn("[Supabase] Health check fallo", { table: "pedidos", error });
        return "PostgreSQL responde por Supabase, pero pedidos no esta disponible para lectura.";
      }
      console.info("[Supabase] Health check correcto", { table: "pedidos", exists: true, records: count ?? 0 });
      return "PostgreSQL operativo.";
    }),
    timedCheck("Auth", async () => {
      const { error } = await withTimeout<ErrorResult>(supabase.auth.getSession(), 3500, "Health Auth");
      return error ? "Auth responde con advertencia." : "Auth operativo.";
    }),
    timedCheck("Storage", async () => {
      const { error } = await withTimeout<ErrorResult>(supabase.storage.listBuckets(), 4500, "Health Storage");
      return error ? "Storage requiere permisos para listar buckets." : "Storage operativo.";
    }),
    timedCheck("Realtime", async () => "Realtime configurado en cliente Supabase.")
  ]);

  return [projectCheck, ...checks];
}
