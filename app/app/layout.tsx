import "./globals.css";
import type { Metadata } from "next";
import { runSql } from "@/lib/db";
import { SQL } from "@/lib/sql.generated";
import { eur, num, dec } from "@/lib/format";
import Tabs from "@/components/Tabs";

export const metadata: Metadata = {
  title: "Análisis de rendimiento · Primer semestre de 2026",
  description: "Ventas, canales de adquisición y productos de enero a junio de 2026",
};

type Cabecera = { ventas_eur: number; pedidos: number; ticket_medio_eur: number };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [k] = await runSql<Cabecera>(SQL["00_panel_cabecera"]);

  return (
    <html lang="es">
      <body>
        <div className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-5">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
              <rect width="28" height="28" rx="6" fill="#18181b" />
              <rect x="6" y="14" width="4" height="8" rx="1" fill="#ffffff" />
              <rect x="12" y="9" width="4" height="13" rx="1" fill="#ffffff" />
              <rect x="18" y="5" width="4" height="17" rx="1" fill="#ffffff" />
            </svg>
            <h1 className="text-lg font-semibold tracking-tight text-stone-900">
              Análisis de rendimiento · Primer semestre de 2026
            </h1>
          </div>
        </div>

        <header className="mx-auto max-w-5xl px-4 pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Kpi titulo="Ventas" valor={eur(Number(k.ventas_eur))} />
            <Kpi titulo="Pedidos" valor={num(Number(k.pedidos))} />
            <Kpi titulo="Ticket medio" valor={`${dec(Number(k.ticket_medio_eur))} €`} />
          </div>
          <p className="mt-3 text-xs leading-5 text-stone-500">
            Enero a junio de 2026. Pedidos entregados o pendientes, sin borrados y con importe de
            al menos 1 €. Ventas = subtotal sin IVA ni envío. Ticket medio = ventas / pedidos.
          </p>
          <div className="mt-6">
            <Tabs />
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

function Kpi({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="text-sm text-stone-500">{titulo}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight">{valor}</div>
    </div>
  );
}