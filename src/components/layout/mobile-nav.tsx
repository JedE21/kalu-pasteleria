"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, Menu, ShoppingCart, Users } from "lucide-react";
import { cn } from "@/utils/cn";

const mobileItems = [
  { label: "Inicio", href: "/", icon: LayoutDashboard },
  { label: "Ventas", href: "/ventas", icon: BarChart3 },
  { label: "Pedidos", href: "/pedidos", icon: ShoppingCart },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Mas", href: "/configuracion", icon: Menu }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/92 px-2 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-[#17110d]/92 lg:hidden" aria-label="Navegacion movil">
      <div className="grid grid-cols-5 gap-1">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold text-stone-500 transition",
                active && "bg-cream text-chocolate shadow-sm dark:bg-white/10 dark:text-white"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
