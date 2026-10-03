"use client";
import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { dec, eur, num, pct } from "@/lib/format";
import { CATEGORIAS, COLOR_CAT } from "@/lib/categorias";

const MESES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun"];
const BOTONES_MES = ["Semestre", "Ene", "Feb", "Mar", "Abr", "May", "Jun"];
const PALETA = [
  "#4c78a8", "#f58518", "#54a24b", "#e45756", "#72b7b2",
  "#eeca3b", "#b279a2", "#ff9da6", "#9d755d", "#bab0ac",
];
const margen = { top: 8, right: 16, left: 8, bottom: 0 };

export type FilaProducto = {
  producto: string; categoria: string; ventas: number; pct: number; unidades: number;
  es: number; de: number; precio: number; ranking: number; etiqueta: string;
};
export type FilaProdMes = {
  mes: number; producto: string; categoria: string; ventas: number; unidades: number;
};
export type FilaPeso = { categoria: string; ventas: number; pct: number };
export type FilaCatMes = { mes: number; categoria: string; ventas: number };

export function LeyendaCategorias() {
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      {CATEGORIAS.map((c) => (
        <span key={c} className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: COLOR_CAT[c] }} />
          {c}
        </span>
      ))}
    </div>
  );
}

function Boton({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm ${
        activo
          ? "border-stone-900 bg-stone-900 text-white"
          : "border-stone-300 text-stone-600 hover:border-stone-900"
      }`}
    >
      {children}
    </button>
  );
}

// 1. Todos los productos: ventas, unidades y precio por unidad
export function TodosProductos({ data }: { data: FilaProducto[] }) {
  return (
    <div style={{ height: 60 + data.length * 32 }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ ...margen, right: 280 }}>
          <CartesianGrid horizontal={false} stroke="#e7e5e4" />
          <XAxis
            type="number"
            domain={[0, "auto"]}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${num(Number(v))} €`}
          />
          <YAxis
            type="category"
            dataKey="producto"
            width={170}
            interval={0}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "#f5f5f4" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as FilaProducto;
              return (
                <div className="rounded border border-stone-200 bg-white p-3 text-sm shadow">
                  <div className="font-semibold">{p.producto}</div>
                  <div className="text-stone-500">{p.categoria}</div>
                  <div className="mt-1">
                    Ventas: {eur(p.ventas)} ({pct(p.pct)})
                  </div>
                  <div>
                    {num(p.unidades)} uds · {eur(p.precio)} por unidad
                  </div>
                  <div className="text-stone-500">
                    España {num(p.es)} uds · Alemania {num(p.de)} uds
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="ventas">
            {data.map((d) => (
              <Cell
                key={d.producto}
                fill={COLOR_CAT[d.categoria]}
                fillOpacity={d.ranking <= 5 ? 1 : 0.55}
              />
            ))}
            <LabelList dataKey="etiqueta" position="right" fontSize={12} fill="#44403c" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Top 5 de cada mes (o del semestre), con selector
export function Top5Mes({
  mensual,
  semestre,
}: {
  mensual: FilaProdMes[];
  semestre: FilaProdMes[];
}) {
  const [sel, setSel] = useState(0);
  const filas = (sel === 0 ? semestre : mensual.filter((f) => f.mes === sel))
    .slice()
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, 5);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-stone-500">Periodo:</span>
        {BOTONES_MES.map((l, i) => (
          <Boton key={l} activo={sel === i} onClick={() => setSel(i)}>
            {l}
          </Boton>
        ))}
      </div>
      <div style={{ height: 60 + filas.length * 48 }} className="w-full">
        <ResponsiveContainer>
          <BarChart data={filas} layout="vertical" margin={{ ...margen, right: 72 }}>
            <CartesianGrid horizontal={false} stroke="#e7e5e4" />
            <XAxis
              type="number"
              domain={[0, "auto"]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${num(Number(v))} €`}
            />
            <YAxis
              type="category"
              dataKey="producto"
              width={170}
              interval={0}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "#f5f5f4" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as FilaProdMes;
                return (
                  <div className="rounded border border-stone-200 bg-white p-3 text-sm shadow">
                    <div className="font-semibold">{p.producto}</div>
                    <div className="text-stone-500">{p.categoria}</div>
                    <div className="mt-1">Ventas: {eur(p.ventas)}</div>
                    <div>{num(p.unidades)} uds</div>
                  </div>
                );
              }}
            />
            <Bar dataKey="ventas">
              {filas.map((d) => (
                <Cell key={d.producto} fill={COLOR_CAT[d.categoria]} />
              ))}
              <LabelList dataKey="ventas" position="right" formatter={(v) => eur(Number(v), 0)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 3a. Peso de cada categoría: semestre y desde mayo
const etiquetaPct = (e: unknown) => `${dec((e as { pct: number }).pct, 1)} %`;

function PieCategorias({ data, titulo }: { data: FilaPeso[]; titulo: string }) {
  return (
    <div>
      <div className="mb-1 text-center text-sm font-semibold">{titulo}</div>
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="ventas"
              nameKey="categoria"
              outerRadius={95}
              label={etiquetaPct}
            >
              {data.map((d) => (
                <Cell key={d.categoria} fill={COLOR_CAT[d.categoria]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => eur(Number(v))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function PiesCategoria({
  semestre,
  desdeMayo,
}: {
  semestre: FilaPeso[];
  desdeMayo: FilaPeso[];
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PieCategorias data={semestre} titulo="Todo el semestre" />
      <PieCategorias data={desdeMayo} titulo="Desde el 1 de mayo (con Deporte ya en venta)" />
    </div>
  );
}

// 3b. De qué productos se compone cada categoría
export function ComposicionCategoria({
  productos,
  pesos,
}: {
  productos: { producto: string; categoria: string; ventas: number }[];
  pesos: FilaPeso[];
}) {
  const [cat, setCat] = useState(CATEGORIAS[0]);
  const lista = productos.filter((p) => p.categoria === cat).sort((a, b) => b.ventas - a.ventas);
  const total = lista.reduce((s, p) => s + p.ventas, 0);
  const peso = pesos.find((p) => p.categoria === cat);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-stone-500">Categoría:</span>
        {CATEGORIAS.map((c) => (
          <Boton key={c} activo={cat === c} onClick={() => setCat(c)}>
            {c}
          </Boton>
        ))}
      </div>
      {peso && (
        <div className="mb-2 text-sm font-semibold">
          {cat}: {eur(peso.ventas, 0)} ({pct(peso.pct)} de las ventas)
        </div>
      )}
      <div className="grid items-center gap-4 md:grid-cols-2">
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={lista} dataKey="ventas" nameKey="producto" outerRadius={105}>
                {lista.map((p, i) => (
                  <Cell key={p.producto} fill={PALETA[i % PALETA.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => eur(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-1.5 text-sm">
          {lista.map((p, i) => (
            <li key={p.producto} className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ background: PALETA[i % PALETA.length] }}
              />
              <span className="flex-1">{p.producto}</span>
              <span className="text-stone-500">{eur(p.ventas, 0)}</span>
              <span className="w-14 text-right font-medium">{pct((100 * p.ventas) / total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// 4. Ventas mensuales por categoría en un país
export function TendenciaPais({ filas, max }: { filas: FilaCatMes[]; max: number }) {
  const data = [1, 2, 3, 4, 5, 6].map((m) => {
    const fila: Record<string, number | string | null> = { mes: MESES[m] };
    for (const c of CATEGORIAS) {
      fila[c] = filas.find((f) => f.mes === m && f.categoria === c)?.ventas ?? null;
    }
    return fila;
  });
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={margen}>
          <CartesianGrid vertical={false} stroke="#e7e5e4" />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} />
          <YAxis
            domain={[0, max]}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${num(Number(v))} €`}
            width={70}
          />
          <Tooltip formatter={(v) => eur(Number(v))} />
          <Legend />
          {CATEGORIAS.map((c) => (
            <Line
              key={c}
              type="monotone"
              dataKey={c}
              stroke={COLOR_CAT[c]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}