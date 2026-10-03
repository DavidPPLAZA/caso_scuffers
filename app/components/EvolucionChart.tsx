"use client";
import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { eur, num } from "@/lib/format";

export type PuntoMes = {
  mesNum: number; mes: string; ES: number; DE: number; total: number; pedidos: number;
};
export type PuntoDia = { mes: number; dia: number; ES: number; DE: number; pedidos: number };

const NOMBRES = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio"];

export default function EvolucionChart({
  data,
  diario,
}: {
  data: PuntoMes[];
  diario: PuntoDia[];
}) {
  const [sel, setSel] = useState<number | null>(null);

  const detalle =
    sel === null
      ? []
      : Array.from({ length: new Date(2026, sel, 0).getDate() }, (_, i) => {
          const d = diario.find((x) => x.mes === sel && x.dia === i + 1);
          return { dia: i + 1, ES: d?.ES ?? 0, DE: d?.DE ?? 0, pedidos: d?.pedidos ?? 0 };
        });

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 rounded-md border border-stone-300 bg-stone-100 px-3 py-2 text-sm text-stone-700">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
          <path d="M3 2 L3 13 L6 10 L8 14 L10 13 L8 9.5 L12 9.5 Z" fill="#18181b" />
        </svg>
        <span>
          <strong>Haz clic en una barra</strong> para ver las ventas de ese mes día a día, por país.
        </span>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e7e5e4" />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} />
            <YAxis
              domain={[0, "auto"]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${num(Number(v))} €`}
              width={70}
            />
            <Tooltip
              cursor={{ fill: "#f5f5f4" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as PuntoMes;
                return (
                  <div className="rounded border border-stone-200 bg-white p-3 text-sm shadow">
                    <div className="font-semibold">{label}</div>
                    <div>Total: {eur(p.total)}</div>
                    <div className="text-blue-600">España: {eur(p.ES)}</div>
                    <div className="text-amber-600">Alemania: {eur(p.DE)}</div>
                    <div className="text-stone-500">{num(p.pedidos)} pedidos</div>
                    <div className="mt-1 text-xs text-stone-400">Clic para ver el detalle diario</div>
                  </div>
                );
              }}
            />
            <Legend />
            <Bar
              dataKey="ES"
              name="España"
              stackId="a"
              fill="#2563eb"
              cursor="pointer"
              onClick={(_: unknown, i: number) => setSel(data[i].mesNum)}
            >
              {data.map((d) => (
                <Cell key={d.mesNum} fillOpacity={sel === null || sel === d.mesNum ? 1 : 0.35} />
              ))}
            </Bar>
            <Bar
              dataKey="DE"
              name="Alemania"
              stackId="a"
              fill="#f59e0b"
              cursor="pointer"
              onClick={(_: unknown, i: number) => setSel(data[i].mesNum)}
            >
              {data.map((d) => (
                <Cell key={d.mesNum} fillOpacity={sel === null || sel === d.mesNum ? 1 : 0.35} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {sel !== null && (
        <div className="mt-6 border-t border-stone-200 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Ventas diarias de {NOMBRES[sel]}, por país</h3>
            <button
              onClick={() => setSel(null)}
              className="rounded-full border border-stone-300 px-3 py-1 text-sm text-stone-600 hover:border-stone-900"
            >
              Cerrar ✕
            </button>
          </div>
          <p className="text-xs text-stone-500">Los días sin pedidos aparecen a 0 €.</p>
          <div className="mt-2 h-72 w-full">
            <ResponsiveContainer>
              <LineChart data={detalle} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="dia" tickLine={false} axisLine={false} />
                <YAxis
                  domain={[0, "auto"]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${num(Number(v))} €`}
                  width={70}
                />
                <Tooltip
                  formatter={(v) => eur(Number(v))}
                  labelFormatter={(d) => `${d} de ${NOMBRES[sel]}`}
                />
                <Legend />
                <Line type="monotone" dataKey="ES" name="España" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="DE" name="Alemania" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}