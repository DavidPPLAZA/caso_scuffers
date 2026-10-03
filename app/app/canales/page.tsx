import { runSql } from "@/lib/db";
import { SQL } from "@/lib/sql.generated";
import { eur, num, dec, pct } from "@/lib/format";
import { CANALES, CANALES_PAGO, COLOR } from "@/lib/canales";
import {
  GastoMensual, GastoVsVentas, PaisPorCanal, RoasMensual, VentasCanalMes,
  FilaCanalMes, FilaGastoMes, FilaRoasMes,
} from "@/components/CanalesCharts";

type R5 = {
  canal: string; gasto_eur: number | null; pct_del_gasto: number | null;
  ventas_netas_eur: number; pct_de_las_ventas: number; pedidos: number;
  roas: number | null; gasto_por_pedido_eur: number | null;
};
type R6 = {
  canal: string; pais: string; ventas_netas_eur: number;
  pct_de_las_ventas_del_pais: number; pct_de_las_ventas_del_canal: number;
};
type R7 = { mes: number; canal: string; pais: string; ventas_eur: number; pedidos: number };
type R8 = { mes: number; canal: string; gasto_eur: number };
type R9 = { mes: number; canal: string; gasto_eur: number; ventas_eur: number; roas: number };

export default async function Canales() {
  const [r5, r6, r7, r8, r9] = await Promise.all([
    runSql<R5>(SQL["05_conclusion_3_canales_gasto_retorno"]),
    runSql<R6>(SQL["06_conclusion_4_canal_por_pais"]),
    runSql<R7>(SQL["07_panel_canal_ventas_mes"]),
    runSql<R8>(SQL["08_panel_canal_gasto_mes"]),
    runSql<R9>(SQL["09_panel_canal_roas_mes"]),
  ]);

  const resumen = r5.filter((r) => r.canal !== "Email + TikTok Ads");
  const pago = CANALES_PAGO.map((c) => resumen.find((r) => r.canal === c)!);
  const sinGasto = resumen.filter((r) => r.gasto_eur === null);
  const meta = pago[0];
  const metaDE = r6.find((r) => r.canal === "Meta Ads" && r.pais === "DE")!;

  const gastoVsVentas = pago.map((r) => ({
    canal: r.canal,
    gasto: Number(r.pct_del_gasto),
    ventas: Number(r.pct_de_las_ventas),
  }));
  const paisPorCanal = CANALES.map((c) => ({
    canal: c,
    ES: Number(r6.find((r) => r.canal === c && r.pais === "ES")!.pct_de_las_ventas_del_canal),
    DE: Number(r6.find((r) => r.canal === c && r.pais === "DE")!.pct_de_las_ventas_del_canal),
  }));

  const ventasMes: FilaCanalMes[] = r7.map((r) => ({
    mes: Number(r.mes), canal: r.canal, pais: r.pais, ventas: Number(r.ventas_eur),
  }));
  const gastoMes: FilaGastoMes[] = r8.map((r) => ({
    mes: Number(r.mes), canal: r.canal, gasto: Number(r.gasto_eur),
  }));
  const roasMes: FilaRoasMes[] = r9.map((r) => ({
    mes: Number(r.mes), canal: r.canal, roas: Number(r.roas),
  }));

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-xl font-semibold">
          Meta recibe el {pct(Number(meta.pct_del_gasto))} del gasto y aporta el{" "}
          {pct(Number(meta.pct_de_las_ventas))} de las ventas
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Del 15 de marzo al 30 de junio de 2026. ROAS = ventas netas atribuidas al canal / gasto
          del canal (es un retorno medio, no marginal, y no mide beneficio). Meta incluye Instagram
          Ads y Email incluye Newsletter.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pago.map((r) => (
            <div key={r.canal} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="h-3 w-3 rounded-full" style={{ background: COLOR[r.canal] }} />
                {r.canal}
              </div>
              <div className="mt-2 text-3xl font-semibold">{dec(Number(r.roas))}</div>
              <div className="text-xs text-stone-500">ROAS (€ de ventas por € de gasto)</div>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Gasto</dt>
                  <dd>
                    {eur(Number(r.gasto_eur))} ({pct(Number(r.pct_del_gasto))})
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Ventas</dt>
                  <dd>{eur(Number(r.ventas_netas_eur))}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Pedidos</dt>
                  <dd>{num(Number(r.pedidos))}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-stone-500">
          Sin gasto asignado (no tienen ROAS):{" "}
          {sinGasto
            .map(
              (r) =>
                `${r.canal} ${eur(Number(r.ventas_netas_eur))} (${num(Number(r.pedidos))} pedidos)`
            )
            .join(" · ")}
          .
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Dónde va el dinero y qué devuelve</h2>
        <p className="mt-1 text-sm text-stone-500">
          Parte del gasto y parte de las ventas de cada canal, sobre el total del periodo (el total
          de ventas incluye Direct y Organic).
        </p>
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <GastoVsVentas data={gastoVsVentas} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          El {pct(Number(metaDE.pct_de_las_ventas_del_canal))} de las ventas de Meta son alemanas
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          De qué país es la venta de cada canal, del 15 de marzo al 30 de junio. España vende sobre
          todo por Orgánico y Email.
        </p>
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <PaisPorCanal data={paisPorCanal} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Ventas por canal y mes, España y Alemania</h2>
        <p className="mt-1 text-sm text-stone-500">
          Del 15 de marzo al 30 de junio (marzo cuenta solo desde el día 15). Los dos gráficos usan
          la misma escala para poder compararlos. Enero y febrero no se muestran porque la
          atribución de canales era distinta.
        </p>
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <VentasCanalMes filas={ventasMes} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Gasto por canal y mes</h2>
        <p className="mt-1 text-sm text-stone-500">
          Del 15 de marzo al 30 de junio. El gasto no se registra por país, así que aquí no hay
          desglose. Marzo cuenta desde el día 15.
        </p>
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <GastoMensual filas={gastoMes} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">ROAS por canal y mes</h2>
        <p className="mt-1 text-sm text-stone-500">
          Mismo periodo, del 15 de marzo al 30 de junio. TikTok no tuvo ventas atribuidas en la
          segunda mitad de marzo. El ROAS tampoco se calcula por país, porque el gasto no lo tiene.
          Con gastos pequeños, un solo mes puede moverse mucho.
        </p>
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <RoasMensual filas={roasMes} />
        </div>
      </section>
    </div>
  );
}