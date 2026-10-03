import { runSql } from "@/lib/db";
import { SQL } from "@/lib/sql.generated";
import { eur, num, dec, pct } from "@/lib/format";
import { CATEGORIAS, COLOR_CAT } from "@/lib/categorias";
import {
  ComposicionCategoria, LeyendaCategorias, PiesCategoria, TendenciaPais, Top5Mes, TodosProductos,
  FilaCatMes, FilaPeso, FilaProdMes, FilaProducto,
} from "@/components/ProductosCharts";

type R10 = {
  producto: string; categoria: string; ventas_eur: number; pct_ventas: number;
  pct_ventas_acumulado: number; unidades: number; unidades_es: number; unidades_de: number;
  precio_medio_venta_eur: number; ranking_ventas: number; ranking_precio: number;
};
type R11 = {
  pais: string; categoria: string; ventas_eur: number; pct_ventas_pais: number;
  ventas_t1_eur: number | null; ventas_t2_eur: number | null; var_t2_vs_t1_pct: number | null;
  ventas_mayo_eur: number; ventas_junio_eur: number;
};
type R12 = { mes: number; pais: string; categoria: string; ventas_eur: number };
type R13 = {
  categoria: string; ventas_eur: number; pct_ventas: number;
  ventas_desde_mayo_eur: number; pct_desde_mayo: number;
};
type R14 = { mes: number; producto: string; categoria: string; ventas_eur: number; unidades: number };

const signo = (v: number) => `${v > 0 ? "+" : ""}${dec(v, 1)} %`;

export default async function Productos() {
  const [r10, r11, r12, r13, r14] = await Promise.all([
    runSql<R10>(SQL["10_conclusion_5_productos"]),
    runSql<R11>(SQL["11_conclusion_6_categoria_por_pais"]),
    runSql<R12>(SQL["12_panel_categoria_mes_pais"]),
    runSql<R13>(SQL["13_panel_categoria_peso"]),
    runSql<R14>(SQL["14_panel_producto_mes"]),
  ]);

  // Todos los productos
  const productos: FilaProducto[] = r10.map((r) => ({
    producto: r.producto,
    categoria: r.categoria,
    ventas: Number(r.ventas_eur),
    pct: Number(r.pct_ventas),
    unidades: Number(r.unidades),
    es: Number(r.unidades_es),
    de: Number(r.unidades_de),
    precio: Number(r.precio_medio_venta_eur),
    ranking: Number(r.ranking_ventas),
    etiqueta: `${eur(Number(r.ventas_eur), 0)} · ${num(Number(r.unidades))} uds · ${eur(
      Number(r.precio_medio_venta_eur)
    )}/ud`,
  }));
  const top5acum = Number(r10.find((r) => Number(r.ranking_ventas) === 5)!.pct_ventas_acumulado);

  // Top 5 por mes
  const mensual: FilaProdMes[] = r14.map((r) => ({
    mes: Number(r.mes),
    producto: r.producto,
    categoria: r.categoria,
    ventas: Number(r.ventas_eur),
    unidades: Number(r.unidades),
  }));
  const semestre: FilaProdMes[] = r10.map((r) => ({
    mes: 0,
    producto: r.producto,
    categoria: r.categoria,
    ventas: Number(r.ventas_eur),
    unidades: Number(r.unidades),
  }));

  // Pesos de categoría
  const pesoSemestre: FilaPeso[] = r13.map((r) => ({
    categoria: r.categoria,
    ventas: Number(r.ventas_eur),
    pct: Number(r.pct_ventas),
  }));
  const pesoMayo: FilaPeso[] = r13.map((r) => ({
    categoria: r.categoria,
    ventas: Number(r.ventas_desde_mayo_eur),
    pct: Number(r.pct_desde_mayo),
  }));
  const ropa = r13.find((r) => r.categoria === "Ropa")!;
  const deporte = r13.find((r) => r.categoria === "Deporte")!;
  const productosCat = r10.map((r) => ({
    producto: r.producto,
    categoria: r.categoria,
    ventas: Number(r.ventas_eur),
  }));

  // Tendencia por país
  const filasPais = (p: string): FilaCatMes[] =>
    r12
      .filter((r) => r.pais === p)
      .map((r) => ({ mes: Number(r.mes), categoria: r.categoria, ventas: Number(r.ventas_eur) }));
  const tope = Math.max(...r12.map((r) => Number(r.ventas_eur)));
  const max = Math.ceil(tope / 200) * 200;

  const fila = (p: string, c: string) => r11.find((r) => r.pais === p && r.categoria === c)!;
  const calDE = fila("DE", "Calzado");
  const depDE = fila("DE", "Deporte");
  const calES = fila("ES", "Calzado");
  const depES = fila("ES", "Deporte");

  return (
    <div className="space-y-14">
      <section>
        <h2 className="text-xl font-semibold">
          El top 5 suma el {pct(top5acum)} de las ventas con 5 de {r10.length} productos
        </h2>
        <div className="mt-3">
          <LeyendaCategorias />
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <TodosProductos data={productos} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Los cinco productos que más venden en cada mes</h2>
        <p className="mt-1 text-sm text-stone-500">
          Elige un mes para ver su top 5, o el semestre completo. El color es la categoría.
        </p>
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <Top5Mes mensual={mensual} semestre={semestre} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          Ropa es el {pct(Number(ropa.pct_ventas))} de las ventas; Deporte, un{" "}
          {pct(Number(deporte.pct_ventas))} del semestre y un {pct(Number(deporte.pct_desde_mayo))}{" "}
          desde que está en venta
        </h2>
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <PiesCategoria semestre={pesoSemestre} desdeMayo={pesoMayo} />
        </div>

        <h3 className="mt-8 text-lg font-semibold">De qué productos se compone cada categoría</h3>
        <div className="mt-3 rounded-lg border border-stone-200 bg-white p-4">
          <ComposicionCategoria productos={productosCat} pesos={pesoSemestre} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          Calzado y Deporte crecen en Alemania ({signo(Number(calDE.var_t2_vs_t1_pct))} y de{" "}
          {eur(Number(depDE.ventas_mayo_eur), 0)} a {eur(Number(depDE.ventas_junio_eur), 0)}) y
          retroceden en España ({signo(Number(calES.var_t2_vs_t1_pct))} y de{" "}
          {eur(Number(depES.ventas_mayo_eur), 0)} a {eur(Number(depES.ventas_junio_eur), 0)}),
          donde son las dos categorías de menor peso ({dec(Number(calES.pct_ventas_pais), 0)} % y{" "}
          {dec(Number(depES.pct_ventas_pais), 0)} %)
        </h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {[
            { p: "ES", nombre: "España" },
            { p: "DE", nombre: "Alemania" },
          ].map(({ p, nombre }) => (
            <div key={p} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="mb-1 text-sm font-semibold">{nombre}</div>
              <TendenciaPais filas={filasPais(p)} max={max} />
              <ul className="mt-3 space-y-1 text-sm">
                {CATEGORIAS.map((c) => {
                  const r = fila(p, c);
                  return (
                    <li key={c} className="flex gap-2">
                      <span
                        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: COLOR_CAT[c] }}
                      />
                      <span>
                        <span className="font-medium">{c}</span>:{" "}
                        {r.ventas_t1_eur === null
                          ? `mayo ${eur(Number(r.ventas_mayo_eur), 0)} → junio ${eur(Number(r.ventas_junio_eur), 0)}`
                          : `T1 ${eur(Number(r.ventas_t1_eur), 0)} → T2 ${eur(Number(r.ventas_t2_eur), 0)} (${signo(Number(r.var_t2_vs_t1_pct))})`}{" "}
                        · {pct(Number(r.pct_ventas_pais))} de las ventas del país
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}