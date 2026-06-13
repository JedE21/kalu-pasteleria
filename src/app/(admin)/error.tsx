"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Kalú Admin page error", error);
  }, [error]);

  return (
    <Card className="mx-auto mt-16 max-w-2xl border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-100">
          <AlertTriangle size={22} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-stone-950 dark:text-white">El modulo no pudo cargarse</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
            El panel capturo una excepcion del navegador. Esto suele pasar por variables de entorno faltantes, datos inesperados de Supabase o un deploy anterior cacheado.
          </p>
          {error.digest ? <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">Codigo: {error.digest}</p> : null}
          <button
            type="button"
            onClick={reset}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-chocolate px-5 py-3 text-sm font-bold text-white transition hover:bg-[#70482c] dark:bg-gold dark:text-[#261B14]"
          >
            <RefreshCw size={17} />
            Reintentar
          </button>
        </div>
      </div>
    </Card>
  );
}
