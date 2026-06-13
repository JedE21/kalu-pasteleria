import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Brain,
  CreditCard,
  LayoutDashboard,
  LineChart,
  Package,
  Percent,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Tags,
  Truck,
  UserRoundCog,
  Users,
  Utensils
} from "lucide-react";

export const navigationItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, description: "Vista ejecutiva del negocio" },
  { label: "Ventas", href: "/ventas", icon: LineChart, description: "Ingresos, canales y tendencias" },
  { label: "Productos", href: "/productos", icon: Package, description: "Catalogo, precios y rentabilidad" },
  { label: "Categorias", href: "/categorias", icon: Tags, description: "Familias comerciales y orden" },
  { label: "Promociones", href: "/promociones", icon: Percent, description: "Campanas, combos y conversion" },
  { label: "Pedidos", href: "/pedidos", icon: ShoppingCart, description: "Operacion diaria y estados" },
  { label: "Clientes", href: "/clientes", icon: Users, description: "CRM, segmentos y recurrencia" },
  { label: "Delivery", href: "/delivery", icon: Truck, description: "Rutas, tiempos y zonas" },
  { label: "Produccion", href: "/produccion", icon: Utensils, description: "Planificacion y rendimiento" },
  { label: "Inventario", href: "/inventario", icon: Boxes, description: "Stock, alertas y movimientos" },
  { label: "Recetas y Costeo", href: "/recetas-costeo", icon: CreditCard, description: "Margenes, insumos y costos" },
  { label: "Finanzas", href: "/finanzas", icon: BarChart3, description: "Flujo de caja y utilidad" },
  { label: "Reportes", href: "/reportes", icon: ShoppingBag, description: "Exportaciones ejecutivas" },
  { label: "Alertas", href: "/alertas", icon: AlertTriangle, description: "Prioridades y excepciones" },
  { label: "Administracion", href: "/administracion", icon: UserRoundCog, description: "Usuarios, roles y permisos" },
  { label: "Business Intelligence", href: "/business-intelligence", icon: Brain, description: "Insights y recomendaciones" },
  { label: "Configuracion", href: "/configuracion", icon: Settings, description: "Preferencias del sistema" },
  { label: "System Health", href: "/system-health", icon: ShieldCheck, description: "Supabase, Auth, Storage y Realtime" }
] as const;

export type NavigationHref = (typeof navigationItems)[number]["href"];
