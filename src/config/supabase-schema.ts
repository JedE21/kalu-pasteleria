export const realSupabaseTables = [
  "alertas",
  "categorias",
  "categorias_gasto",
  "cliente_segmento",
  "clientes",
  "compras_insumos",
  "configuracion_empresa",
  "detalle_compra_insumos",
  "detalle_pedidos",
  "detalle_produccion",
  "direcciones_cliente",
  "entregas",
  "estados_pedido",
  "estados_produccion",
  "gastos",
  "historial_estados_pedido",
  "ingresos",
  "insumos",
  "metodos_pago",
  "metricas_dashboard",
  "movimientos_inventario",
  "notificaciones",
  "pagos",
  "pedidos",
  "permisos",
  "predicciones_ventas",
  "producciones",
  "producto_etiqueta_rel",
  "producto_etiquetas",
  "producto_imagenes",
  "productos",
  "promocion_productos",
  "promocion_reglas",
  "promociones",
  "proveedores",
  "receta_insumos",
  "recetas",
  "repartidores",
  "rol_permisos",
  "roles",
  "segmentos_clientes",
  "seguimiento_entrega",
  "subcategorias",
  "sucursales",
  "usuario_roles",
  "usuarios",
  "variantes_producto"
] as const;

export type RealSupabaseTable = (typeof realSupabaseTables)[number];

export const dashboardCoreTables = [
  "pedidos",
  "productos",
  "clientes",
  "ingresos",
  "pagos",
  "insumos",
  "movimientos_inventario"
] as const satisfies readonly RealSupabaseTable[];

export const moduleTableMap: Record<string, RealSupabaseTable[]> = {
  ventas: ["pedidos", "pagos", "ingresos"],
  productos: ["productos", "variantes_producto", "producto_imagenes", "producto_etiquetas", "producto_etiqueta_rel"],
  categorias: ["categorias", "subcategorias"],
  promociones: ["promociones", "promocion_productos", "promocion_reglas"],
  pedidos: ["pedidos", "detalle_pedidos", "estados_pedido", "historial_estados_pedido"],
  clientes: ["clientes", "cliente_segmento", "segmentos_clientes", "direcciones_cliente"],
  delivery: ["entregas", "seguimiento_entrega", "repartidores"],
  produccion: ["producciones", "detalle_produccion", "estados_produccion"],
  inventario: ["insumos", "movimientos_inventario"],
  "recetas-costeo": ["recetas", "receta_insumos", "insumos", "productos"],
  finanzas: ["ingresos", "gastos", "pagos", "categorias_gasto", "metodos_pago"],
  reportes: ["metricas_dashboard", "pedidos", "pagos", "ingresos", "gastos"],
  alertas: ["alertas", "notificaciones"],
  administracion: ["usuarios", "roles", "permisos", "rol_permisos", "usuario_roles", "sucursales"],
  "business-intelligence": ["metricas_dashboard", "predicciones_ventas", "pedidos", "pagos", "productos"],
  configuracion: ["configuracion_empresa", "sucursales", "metodos_pago"]
};

export function isRealSupabaseTable(table: string): table is RealSupabaseTable {
  return realSupabaseTables.includes(table as RealSupabaseTable);
}
