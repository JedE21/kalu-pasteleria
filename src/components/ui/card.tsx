import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-stone-200/80 bg-white/90 p-5 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/[0.04]", className)}>{children}</section>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("font-display text-base font-bold text-stone-950 dark:text-white", className)}>{children}</h2>;
}
