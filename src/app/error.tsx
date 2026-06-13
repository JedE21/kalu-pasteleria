"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Kalú Admin runtime error", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#100b08] px-6 text-white">
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-200">
          <AlertTriangle size={24} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-extrabold">No se pudo cargar el panel</h1>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          Ocurrio una excepcion en el navegador. Revisa que las variables de Supabase esten completas y vuelve a cargar el sitio.
        </p>
        {error.digest ? <p className="mt-3 text-xs text-stone-500">Codigo: {error.digest}</p> : null}
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#261B14] transition hover:brightness-110"
        >
          <RefreshCw size={17} />
          Reintentar
        </button>
      </section>
    </main>
  );
}
