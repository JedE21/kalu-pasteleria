import type { ReactNode } from "react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream text-stone-900 dark:bg-[#100b08] dark:text-stone-100">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Topbar />
          <main className="mx-auto w-full max-w-[1500px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-6">{children}</main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
