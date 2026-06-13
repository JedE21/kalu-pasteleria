import { Bell, Search, UserRound } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#100b08]/80 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="search"
            placeholder="Buscar pedidos, clientes, productos..."
            className="h-11 w-full rounded-full border border-stone-200 bg-cream pl-10 pr-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-gold focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-gold dark:border-white/10 dark:bg-white/5 dark:text-stone-200" aria-label="Ver notificaciones">
          <Bell size={18} />
        </button>
        <ThemeToggle />
        <button type="button" className="hidden h-10 items-center gap-2 rounded-full border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-gold dark:border-white/10 dark:bg-white/5 dark:text-stone-200 sm:flex" aria-label="Abrir perfil">
          <UserRound size={18} />
          Admin
        </button>
      </div>
    </header>
  );
}
