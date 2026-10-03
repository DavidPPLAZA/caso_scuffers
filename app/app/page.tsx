import { runSql } from "@/lib/db";
import { SQL } from "@/lib/sql.generated";
import { eur, num, dec, pct } from "@/lib/format";
import EvolucionChart, { PuntoMes, PuntoDia } from "@/components/EvolucionChart";

const MESES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun"];
const NOMBRES_MES = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio"];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Mes = {
  mes: number; ventas_eur: number; ventas_es_eur: number; ventas_de_eur: number;
  pedidos: number; ticket_medio_eur: number;
};
type Dia = {
  mes: number; dia: number; ventas_es_eur: number; ventas_de_eur: number; pedidos: number;
};
type Pais = {
  pais: string; ventas_eur: number; pct_ventas: number; pedidos: number; pct_pedidos: number;
  clientes: number; ventas_por_cliente_eur: number; ticket_medio_eur: number;
  dif_ticket_vs_alemania_pct: number;
};
type Repeticion = {
  pais: string; clientes: number; pedidos_por_cliente: number; pct_clientes_que_repiten: number;
};

export default async function Ventas() {
  const [meses, paises, rep, dias] = await Promise.all([
    runSql<Mes>(SQL["01_panel_ventas_mensual"]),
    runSql<Pais>(SQL["02_conclusion_1_perfil_pais"]),
    runSql<Repeticion>(SQL["03_conclusion_2_repeticion"]),
    runSql<Dia>(SQL["04_panel_ventas_diaria"]),
  ]);

  const data: PuntoMes[] = meses.map((m) => ({
    mesNum: Number(m.mes),
    mes: MESES[Number(m.mes)],
    ES: Number(m.ventas_es_eur),
    DE: Number(m.ventas_de_eur),
    total: Number(m.ventas_eur),
    pedidos: Number(m.pedidos),
  }));
  const diario: PuntoDia[] = dias.map((d) => ({
    mes: Number(d.mes),
    dia: Number(d.dia),
    ES: Number(d.ventas_es_eur),
    DE: Number(d.ventas_de_eur),
    pedidos: Number(d.pedidos),
  }));
  const mejor = data.reduce((a, b) => (b.total > a.total ? b : a));
  const peor = data.reduce((a, b) => (b.total < a.total ? b : a));

  const es = paises.find((p) => p.pais === "ES")!;
  const de = paises.find((p) => p.pais === "DE")!;
  const esRep = rep.find((p) => p.pais === "ES")!;
  const deRep = rep.find((p) => p.pais === "DE")!;

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-xl font-semibold">
          {cap(NOMBRES_MES[mejor.mesNum])} es el mejor mes ({eur(mejor.total, 0)}) y{" "}
          {NOMBRES_MES[peor.mesNum]} el más flojo ({eur(peor.total, 0)})
        </h2>
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <EvolucionChart data={data} diario={diario} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          El ticket medio de España es un{" "}
          {dec(Math.abs(Number(es.dif_ticket_vs_alemania_pct)), 0)} % menor que el de Alemania (
          {dec(Number(es.ticket_medio_eur))} € frente a {dec(Number(de.ticket_medio_eur))} €)
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TarjetaPais nombre="España" p={es} r={esRep} />
          <TarjetaPais nombre="Alemania" p={de} r={deRep} />
        </div>
      </section>
    </div>
  );
}

function TarjetaPais({ nombre, p, r }: { nombre: string; p: Pais; r: Repeticion }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5">
      <div className="text-lg font-semibold">{nombre}</div>
      <dl className="mt-3 space-y-2 text-sm">
        <Fila k="Ventas" v={`${eur(Number(p.ventas_eur))} (${pct(Number(p.pct_ventas))})`} />
        <Fila k="Pedidos" v={`${num(Number(p.pedidos))} (${pct(Number(p.pct_pedidos))})`} />
        <Fila k="Ticket medio" v={`${dec(Number(p.ticket_medio_eur))} €`} />
        <Fila k="Clientes" v={num(Number(p.clientes))} />
        <Fila k="Ventas por cliente" v={`${dec(Number(p.ventas_por_cliente_eur))} €`} />
        <Fila k="Pedidos por cliente" v={dec(Number(r.pedidos_por_cliente))} />
        <Fila k="Clientes que repiten" v={pct(Number(r.pct_clientes_que_repiten))} />
      </dl>
    </div>
  );
}

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-stone-100 pb-1">
      <dt className="text-stone-500">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}