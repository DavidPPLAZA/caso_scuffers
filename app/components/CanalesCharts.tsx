"use client";
import {
  Bar, BarChart, CartesianGrid, LabelList, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { dec, eur, num } from "@/lib/format";
import { CANALES, CANALES_PAGO, COLOR } from "@/lib/canales";

// El análisis de canales va del 15 de marzo al 30 de junio.
const MESES_V = [3, 4, 5, 6];
const ETIQ: Record<number, string> = { 3: "Mar (15-31)", 4: "Abr", 5: "May", 6: "Jun" };

export type FilaCanalMes = { mes: number; canal: string; pais: string; ventas: number };
export type FilaGastoMes = { mes: number; canal: string; gasto: number };
export type FilaRoasMes = { mes: number; canal: string; roas: number };

const margen = { top: 8, right: 16, left: 8, bottom: 0 };
const redondea = (n: number) => Math.round(n * 100) / 100;

// 1. % del gasto frente a % de las ventas, por canal de pago
export function GastoVsVentas({
  data,
}: {
  data: { canal: string; gasto: number; ventas: number }[];
}) {
  return (
    <div style={{ height: 80 + data.length * 70 }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ ...margen, right: 56 }} barGap={2}>
          <CartesianGrid horizontal={false} stroke="#e7e5e4" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v} %`}
          />
          <YAxis type="category" dataKey="canal" width={90} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v) => `${dec(Number(v), 1)} %`} cursor={{ fill: "#f5f5f4" }} />
          <Legend />
          <Bar dataKey="gasto" name="% del gasto" fill="#44403c">
            <LabelList dataKey="gasto" position="right" formatter={(v) => `${dec(Number(v), 1)} %`} />
          </Bar>
          <Bar dataKey="ventas" name="% de las ventas" fill="#0ea5e9">
            <LabelList dataKey="ventas" position="right" formatter={(v) => `${dec(Number(v), 1)} %`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. De qué país son las ventas de cada canal (100 %)
export function PaisPorCanal({ data }: { data: { canal: string; ES: number; DE: number }[] }) {
  return (
    <div style={{ height: 80 + data.length * 48 }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={margen}>
          <CartesianGrid horizontal={false} stroke="#e7e5e4" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v} %`}
          />
          <YAxis type="category" dataKey="canal" width={90} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v) => `${dec(Number(v), 1)} %`} cursor={{ fill: "#f5f5f4" }} />
          <Legend />
          <Bar dataKey="ES" name="España" stackId="p" fill="#2563eb">
            <LabelList dataKey="ES" position="center" fill="#fff" formatter={(v) => `${dec(Number(v), 0)} %`} />
          </Bar>
          <Bar dataKey="DE" name="Alemania" stackId="p" fill="#f59e0b">
            <LabelList dataKey="DE" position="center" fill="#1c1917" formatter={(v) => `${dec(Number(v), 0)} %`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Gráfico de barras agrupadas (una barra por canal en cada mes)
function Agrupado({
  data,
  claves,
  max,
  alto = 320,
}: {
  data: Record<string, number | string>[];
  claves: string[];
  max: number | "auto";
  alto?: number;
}) {
  return (
    <div style={{ height: alto }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={margen} barGap={1}>
          <CartesianGrid vertical={false} stroke="#e7e5e4" />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} />
          <YAxis
            domain={[0, max]}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${num(Number(v))} €`}
            width={70}
          />
          <Tooltip formatter={(v) => eur(Number(v))} cursor={{ fill: "#f5f5f4" }} />
          <Legend />
          {claves.map((c) => (
            <Bar key={c} dataKey={c} fill={COLOR[c]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 3. Ventas por canal y mes: España y Alemania lado a lado, misma escala
export function VentasCanalMes({ filas }: { filas: FilaCanalMes[] }) {
  const porPais = (pais: string) =>
    MESES_V.map((m) => {
      const fila: Record<string, number | string> = { mes: ETIQ[m] };
      for (const c of CANALES) {
        fila[c] = redondea(
          filas
            .filter((f) => f.mes === m && f.canal === c && f.pais === pais)
            .reduce((s, f) => s + f.ventas, 0)
        );
      }
      return fila;
    });
  const es = porPais("ES");
  const de = porPais("DE");
  const tope = Math.max(
    ...[...es, ...de].flatMap((f) => CANALES.map((c) => Number(f[c])))
  );
  const max = Math.ceil(tope / 200) * 200;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="mb-1 text-sm font-semibold">España</div>
        <Agrupado data={es} claves={CANALES} max={max} />
      </div>
      <div>
        <div className="mb-1 text-sm font-semibold">Alemania</div>
        <Agrupado data={de} claves={CANALES} max={max} />
      </div>
    </div>
  );
}

// 4. Gasto por canal y mes
export function GastoMensual({ filas }: { filas: FilaGastoMes[] }) {
  const data = MESES_V.map((m) => {
    const fila: Record<string, number | string> = { mes: ETIQ[m] };
    for (const c of CANALES_PAGO) {
      fila[c] = filas.find((f) => f.mes === m && f.canal === c)?.gasto ?? 0;
    }
    return fila;
  });
  return <Agrupado data={data} claves={CANALES_PAGO} max="auto" alto={288} />;
}

// 5. ROAS por canal y mes (marzo desde el 15)
export function RoasMensual({ filas }: { filas: FilaRoasMes[] }) {
  const data = MESES_V.map((m) => {
    const fila: Record<string, number | string | null> = { mes: ETIQ[m] };
    for (const c of CANALES_PAGO) {
      fila[c] = filas.find((f) => f.mes === m && f.canal === c)?.roas ?? null;
    }
    return fila;
  });
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={margen}>
          <CartesianGrid vertical={false} stroke="#e7e5e4" />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} />
          <YAxis domain={[0, "auto"]} tickLine={false} axisLine={false} width={40} />
          <Tooltip formatter={(v) => dec(Number(v))} />
          <Legend />
          {CANALES_PAGO.map((c) => (
            <Line
              key={c}
              type="monotone"
              dataKey={c}
              stroke={COLOR[c]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}