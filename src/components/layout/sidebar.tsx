"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { navigationItems } from "@/config/navigation";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/utils/cn";

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <aside className={cn("hidden border-r border-stone-200 bg-cream/90 p-4 transition-all duration-300 dark:border-white/10 dark:bg-[#17110d] lg:block", collapsed ? "w-[92px]" : "w-[286px]")}>
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Ir al dashboard">
          <img src="/img/icon/favicon_io/android-chrome-192x192.png" alt="" className="h-11 w-11 rounded-2xl shadow-soft" />
          {!collapsed && (
            <span className="min-w-0">
              <span className="block font-display text-sm font-extrabold text-stone-950 dark:text-white">Kalú Admin</span>
              <span className="block text-xs text-stone-500 dark:text-stone-400">ERP Pastelería</span>
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={toggleSidebar}
          className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:text-chocolate dark:border-white/10 dark:bg-white/5 dark:text-stone-300"
          aria-label="Colapsar menu lateral"
        >
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>

      <nav className="mt-7 space-y-1" aria-label="Menu administrativo">
        {navigationItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-stone-600 transition hover:bg-white hover:text-chocolate hover:shadow-sm dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white",
                active && "bg-white text-chocolate shadow-sm ring-1 ring-gold/30 dark:bg-white/10 dark:text-white",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
