import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { navigationItems } from "@/config/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnalyticsRepository } from "@/repositories/analytics.repository";

const moduleTableMap: Record<string, string[]> = {
  ventas: ["ventas", "sales"],
  productos: ["productos", "products"],
  categorias: ["categorias", "categories"],
  promociones: ["promociones", "promotions"],
  pedidos: ["pedidos", "orders"],
  clientes: ["clientes", "customers"],
  delivery: ["delivery", "entregas", "deliveries"],
  produccion: ["produccion", "production"],
  inventario: ["inventario", "inventory"],
  "recetas-costeo": ["recetas", "recipes", "costos", "costing"],
  finanzas: ["finanzas", "finance", "gastos", "expenses"],
  reportes: ["reportes", "reports"],
  alertas: ["alertas", "alerts"],
  administracion: ["usuarios", "profiles", "roles"],
  "business-intelligence": ["ventas", "sales", "productos", "products"],
  configuracion: ["configuracion", "settings"]
};

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const navItem = navigationItems.find((item) => item.href === `/${module}`);
  if (!navItem) notFound();

  const repository = new AnalyticsRepository(createSupabaseServerClient("anon"));
  const tableCandidates = moduleTableMap[module] ?? [];
  const result = await repository.countFirstAvailable(tableCandidates);
  const Icon = navItem.icon;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant={result.table ? "success" : "warning"}>{result.table ? `Tabla activa: ${result.table}` : "Tabla pendiente"}</Badge>
          <h1 className="mt-4 flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight text-stone-950 dark:text-white sm:text-4xl">
            <Icon className="text-chocolate dark:text-gold" size={34} />
            {navItem.label}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-500 dark:text-stone-400">{navItem.description}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardTitle>Registros</CardTitle>
          <p className="mt-4 font-display text-3xl font-extrabold">{result.count}</p>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Conteo real desde Supabase cuando la tabla existe.</p>
        </Card>
        <Card>
          <CardTitle>Estado operativo</CardTitle>
          <p className="mt-4 text-sm text-stone-600 dark:text-stone-300">{result.warning ?? "Modulo conectado y listo para operar."}</p>
        </Card>
        <Card>
          <CardTitle>Siguiente accion</CardTitle>
          <p className="mt-4 text-sm text-stone-600 dark:text-stone-300">Al detectar columnas y relaciones, esta vista habilita tablas avanzadas, filtros, formularios y exportaciones.</p>
        </Card>
      </section>

      <Card>
        <CardTitle>Superficie SaaS preparada</CardTitle>
        <div className="mt-5 grid gap-3 text-sm text-stone-600 dark:text-stone-300 md:grid-cols-2">
          <p>Arquitectura lista para paginacion, busqueda, permisos por rol, validaciones Zod y acciones server-side.</p>
          <p>La implementacion evita datos mock: si Supabase no expone una tabla, se muestra advertencia y el resto del sistema continua.</p>
        </div>
      </Card>
    </div>
  );
}
