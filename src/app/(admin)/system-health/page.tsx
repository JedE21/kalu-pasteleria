import { Activity, CheckCircle2, CircleAlert, CircleX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { getSystemHealth } from "@/services/health.service";
import type { HealthCheck } from "@/types/database";

function StatusIcon({ status }: { status: HealthCheck["status"] }) {
  if (status === "operational") return <CheckCircle2 className="text-emerald-500" size={22} />;
  if (status === "error") return <CircleX className="text-rose-500" size={22} />;
  return <CircleAlert className="text-amber-500" size={22} />;
}

function statusLabel(status: HealthCheck["status"]) {
  if (status === "operational") return "Operativo";
  if (status === "error") return "Error";
  return "Advertencia";
}

export default async function SystemHealthPage() {
  const checks = await getSystemHealth();

  return (
    <div className="space-y-6">
      <section>
        <Badge variant="neutral">Observabilidad</Badge>
        <h1 className="mt-4 flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight text-stone-950 dark:text-white sm:text-4xl">
          <Activity className="text-chocolate dark:text-gold" size={34} />
          System Health
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-500 dark:text-stone-400">Estado de Supabase, PostgreSQL, Auth, Storage y Realtime con latencia y diagnostico visual.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {checks.map((check) => (
          <Card key={check.name}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{check.name}</CardTitle>
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{check.message}</p>
              </div>
              <StatusIcon status={check.status} />
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <Badge variant={check.status === "operational" ? "success" : check.status === "error" ? "danger" : "warning"}>{statusLabel(check.status)}</Badge>
              <span className="text-sm font-semibold text-stone-500 dark:text-stone-400">{check.latencyMs === null ? "Sin medicion" : `${check.latencyMs} ms`}</span>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
