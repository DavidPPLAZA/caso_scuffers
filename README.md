## 1. Perfil por país: el ticket medio de España es un 30 % menor que el de Alemania (60,44 € frente a 86,79 €), con más pedidos y casi las mismas ventas

**Qué dice el dato.** España suma 20.610,07 € de ventas (49,3 %), 341 pedidos (58,3 %) y 111 clientes, con un ticket medio de 60,44 €. Alemania suma 21.176,06 € (50,7 %), 244 pedidos (41,7 %) y 37 clientes, con un ticket medio de 86,79 €. El ticket de España es un 30,4 % menor.

**Por qué importa.** El negocio depende de dos mercados con perfiles distintos.

- **España:** hay tráfico (58 % de los pedidos) pero cada pedido vale poco. Si el ticket subiera 5 € en los 341 pedidos, serían unos 1.700 € al semestre; es un techo, porque supone que todos los pedidos suben.
- **Alemania:** el foco puede estar en captar clientes, porque cada cliente alemán aporta 572 € frente a 186 € en España (unas 3,1 veces más). Hoy el mercado se sostiene con solo 37 clientes. No hay datos de márgenes, así que hablo de valor por cliente y no de beneficio.

**Cómo lo he calculado.**

*Supuestos y limpieza*

- **La tabla de KPIs no cuadra con `orders`.** La vista mensual suma 744 pedidos de enero a junio y `orders` tiene 719; en total (con julio) sobran 26. Son exactamente los 26 pedidos con 2 promociones en `order_promotions`: la vista cuenta cada promoción como un pedido distinto. Partimos de `orders`, donde un pedido es una fila, y no usamos la vista.
- **Pedidos analizables.** De 767 pedidos en la tabla quedan 585:
  - Fuera julio (48), porque el mes está a medias.
  - Fuera los dados de baja (11, `deleted_at` no nulo).
  - Fuera los `cancelled` y `refunded` (115). Entran `delivered` y `pending` (en proceso).
  - Fuera los de subtotal menor de 1 € (8, de 20 y 70 céntimos), porque el producto más barato cuesta 9,95 €.
- **Definición de ventas** = `subtotal_cents`: el valor de los productos vendidos, sin IVA ni envío. El IVA se ingresa a Hacienda y no es ingreso de la empresa, además de ser distinto en Alemania (19 %) y España (21 %). El envío se considera un coste trasladado al cliente.

*Cálculo (medidas), por país sobre los 585 pedidos analizables:*

- Ventas = suma de `subtotal_cents` entre 100, en euros.
- Pedidos = recuento de pedidos (una fila de `orders` es un pedido). Clientes = `customer_id` distintos.
- Ticket medio = ventas / pedidos (20.610,07 / 341 = 60,44 € en España).
- Ventas por cliente = ventas / clientes (21.176,06 / 37 = 572,33 € en Alemania).
- % de ventas y % de pedidos = lo que suma cada país sobre el total de los dos.
- Diferencia de ticket = ticket de España / ticket de Alemania − 1 (−30,4 %).

```sql
with pedidos as (
  select id, country, customer_id, subtotal_cents
  from orders
  where created_at >= '2026-01-01' and created_at < '2026-07-01'
    and status in ('delivered', 'pending')
    and deleted_at is null
    and subtotal_cents >= 100
),
por_pais as (
  select country as pais,
         count(*) as pedidos,
         count(distinct customer_id) as clientes,
         sum(subtotal_cents) / 100.0 as ventas,
         avg(subtotal_cents) / 100.0 as ticket_medio
  from pedidos
  group by country
)
select pais,
       round(ventas, 2) as ventas_eur,
       round(100.0 * ventas / sum(ventas) over (), 1) as pct_ventas,
       pedidos,
       round(100.0 * pedidos / sum(pedidos) over (), 1) as pct_pedidos,
       clientes,
       round(ventas / clientes, 2) as ventas_por_cliente_eur,
       round(ticket_medio, 2) as ticket_medio_eur,
       round((ticket_medio / max(ticket_medio) filter (where pais = 'DE') over () - 1) * 100, 1) as dif_ticket_vs_alemania_pct
from por_pais
order by pais;
```

---

## 2. Repetición por país: en España cada cliente hace 3,1 pedidos frente a 6,6 en Alemania, aunque repiten casi igual (70 % frente a 68 %)

**Qué dice el dato.** España tiene 111 clientes con 341 pedidos (3,07 por cliente) y 78 de ellos (70,3 %) repiten. Alemania tiene 37 clientes con 244 pedidos (6,59 por cliente) y 25 (67,6 %) repiten. Repiten en la misma proporción, pero los alemanes compran más del doble de veces.

**Por qué importa.** La diferencia no está en que el cliente español repita, sino en que repita más veces. La acción es una promoción de fidelización a partir del 2.º o 3.er pedido. Alemania, además, depende de 37 clientes: perder a unos pocos pesa mucho.

**Cómo lo he calculado.**

*Supuestos y limpieza*

- Los de la conclusión 1: partimos de `orders` (no de la vista de KPIs), los mismos 585 pedidos analizables y las ventas sin IVA ni envío.
- **Cliente** = `customer_id` distinto con pedidos analizables en ese país. **Repite** = 2 o más pedidos en el semestre.

*Cálculo (medidas):*

- Primero cuento los pedidos de cada cliente dentro de cada país (una fila por cliente y país).
- Clientes = número de clientes distintos de cada país. Pedidos = suma de los pedidos de esos clientes.
- Pedidos por cliente = pedidos / clientes (341 / 111 = 3,07 en España; 244 / 37 = 6,59 en Alemania).
- Clientes que repiten = clientes con 2 o más pedidos. % que repiten = clientes que repiten / clientes (78 / 111 = 70,3 %; 25 / 37 = 67,6 %).

```sql
with pedidos as (
  select id, country, customer_id, subtotal_cents
  from orders
  where created_at >= '2026-01-01' and created_at < '2026-07-01'
    and status in ('delivered', 'pending')
    and deleted_at is null
    and subtotal_cents >= 100
),
por_cliente as (
  select country, customer_id, count(*) as pedidos
  from pedidos
  group by country, customer_id
)
select country as pais,
       count(*) as clientes,
       sum(pedidos) as pedidos,
       round(sum(pedidos) * 1.0 / count(*), 2) as pedidos_por_cliente,
       count(*) filter (where pedidos >= 2) as clientes_que_repiten,
       round(100.0 * count(*) filter (where pedidos >= 2) / count(*), 1) as pct_clientes_que_repiten
from por_cliente
group by country
order by country;
```

---

## 3. Meta absorbe el 54 % del gasto de marketing (1.534 €) y devuelve 3,7 € de venta por cada euro gastado, mientras que email y TikTok juntos reciben el 19 % (539 €) y devuelven 14,1 €

**Qué dice el dato.** Del 15 de marzo al 30 de junio se gastaron 2.855 € en publicidad. Meta se lleva 1.533,58 € (53,7 %) y se atribuye el 22,5 % de las ventas (5.645,21 €, 69 pedidos): por cada euro gastado vende 3,68 € (ventas atribuidas / gasto, lo que llamo ROAS en adelante) y gasta 22,23 € por pedido. Google gasta el 27,4 % y devuelve un ROAS de 4,84 (13,27 € por pedido). Email y TikTok juntos gastan el 18,9 % (538,61 €), se atribuyen el 30,2 % de las ventas (7.578,21 €) y tienen un ROAS de 14,07 (4,94 € por pedido).

**Por qué importa.** El presupuesto está concentrado en el canal que menos devuelve por euro, y el que mejor devuelve recibe menos de una quinta parte. La acción es mover una parte del gasto de Meta y Google hacia email y TikTok con una prueba limitada (del orden de 100 a 120 €/mes), parando si el retorno cae. Cautelas:

- El ROAS es medio, no marginal: con poco gasto, como en TikTok, no tiene por qué mantenerse al subirlo.
- Es retorno en ventas, no beneficio, porque no hay márgenes.
- El gasto no viene por país, así que no se sabe a quién va dirigido.

**Cómo lo he calculado.**

*Supuestos y limpieza*

- Parto de `orders` y de los pedidos analizables de la conclusión 1 (`delivered` y `pending`, sin dados de baja, subtotal de al menos 1 €), pero solo los creados desde el 15 de marzo: en la ventana son 350 pedidos.
- **Ventana del 15 de marzo al 30 de junio.** En marzo cambió el modelo de atribución y dirección solo da por comparables los ingresos por canal desde esa fecha, pero no dice qué día. Asumo el 15 de marzo.
- **Limpieza de `orders` (canal del pedido):**
  - Unifico las variantes de Meta ("Meta Ads", "Meta Ads " con espacio, "META ADS") en Meta Ads.
  - "Instagram Ads" se suma a Meta Ads, porque el anexo define Meta como Instagram y Facebook.
  - "Newsletter" pasa a Email: es un formato de email marketing y `marketing_spend` no tiene un canal Newsletter, así que sus 27 pedidos (1.907,62 €) se suman a Email. Si se dejara aparte, el ROAS de Email pasaría de 13,21 a 8,38 y el de Email + TikTok de 14,07 a 10,53, y Meta seguiría siendo el que menos devuelve.
  - Direct y Organic no tienen gasto, así que no tienen ROAS.
- **Limpieza de `marketing_spend` (gasto):**
  - Nombres: quito espacios y sumo "Instagram Ads" a Meta Ads.
  - Formatos: Google Ads viene en céntimos (`EUR_CENTS`) y el resto en euros, así que paso todo a euros.
  - Duplicados: elimino una fila repetida por fecha y canal (Google Ads, 22 de mayo, 8,47 €). La ventana queda en 540 filas, 108 días por 5 canales.
- **Cruce:** `orders` y `marketing_spend` no tienen clave en común, así que cada tabla se resume primero por canal en la ventana y luego se unen los resúmenes por el nombre del canal ya limpiado.

*Cálculo (medidas), por canal:*

- Ventas atribuidas = suma de `subtotal_cents` de los pedidos del canal, en euros. Pedidos = recuento de pedidos del canal.
- Gasto = suma del gasto diario del canal en la ventana, en euros.
- ROAS = ventas atribuidas / gasto (euros de venta por cada euro de gasto).
- Gasto por pedido = gasto / pedidos (Meta: 1.533,58 / 69 = 22,23 €).
- % del gasto y % de las ventas = el del canal sobre el total de todos los canales. Email + TikTok es la suma de los dos.

```sql
with pedidos as (
  select id, country, channel, subtotal_cents
  from orders
  where created_at >= '2026-03-15' and created_at < '2026-07-01'
    and status in ('delivered', 'pending')
    and deleted_at is null
    and subtotal_cents >= 100
),
ventas_canal as (
  select case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
              when trim(channel) = 'Newsletter' then 'Email'
              else trim(channel) end as canal,
         count(*) as pedidos,
         sum(subtotal_cents) / 100.0 as ventas
  from pedidos
  group by case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
                when trim(channel) = 'Newsletter' then 'Email'
                else trim(channel) end
),
gasto_canal as (
  select case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
              else trim(channel) end as canal,
         sum(case when currency_unit = 'EUR_CENTS' then spend_raw / 100.0 else spend_raw end) as gasto
  from (
    select distinct on (date, channel) date, channel, spend_raw, currency_unit
    from marketing_spend
    where date >= '2026-03-15' and date <= '2026-06-30'
    order by date, channel, id
  ) sin_duplicados
  group by case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
                else trim(channel) end
),
por_canal as (
  select v.canal, g.gasto, v.ventas, v.pedidos
  from ventas_canal v
  left join gasto_canal g on g.canal = v.canal
),
totales as (
  select sum(gasto) as gasto_total, sum(ventas) as ventas_total from por_canal
),
resumen as (
  select canal, gasto, ventas, pedidos from por_canal
  union all
  select 'Email + TikTok Ads', sum(gasto), sum(ventas), sum(pedidos)
  from por_canal where canal in ('Email', 'TikTok Ads')
)
select r.canal,
       round(r.gasto, 2) as gasto_eur,
       round(100.0 * r.gasto / t.gasto_total, 1) as pct_del_gasto,
       round(r.ventas, 2) as ventas_netas_eur,
       round(100.0 * r.ventas / t.ventas_total, 1) as pct_de_las_ventas,
       r.pedidos,
       round(r.ventas / r.gasto, 2) as roas,
       round(r.gasto / r.pedidos, 2) as gasto_por_pedido_eur
from resumen r
cross join totales t
order by r.gasto desc nulls last, r.canal;
```

---

## 4. El 90 % de las ventas atribuidas a Meta son alemanas: Meta aporta el 38 % de las ventas de Alemania y solo el 4,7 % de las de España

**Qué dice el dato.** De los 5.645,21 € atribuidos a Meta, 5.089,97 € (90,2 %) son de Alemania y 555,24 € (9,8 %) de España. Meta es el 38,4 % de las ventas alemanas y el 4,7 % de las españolas. España vende sobre todo por Organic (36,7 %) y Email (26,0 %), que suman el 62,7 %, frente al 26,9 % de Alemania (10,8 % y 16,1 %).

**Por qué importa.** Los dos países funcionan con canales distintos y el gasto de Meta no viene por país. Si se reparte donde vende, recortar Meta afectaría sobre todo a Alemania; si una parte relevante va a España, donde Meta casi no vende, ahí hay dinero mal usado. Antes de recortar Meta a fondo hay que pedir el gasto por país y, mientras tanto, limitar el recorte. En España, el email es el segundo canal por peso y el vehículo natural para la promoción de fidelización.

**Cómo lo he calculado.**

*Supuestos y limpieza*

- Los de la conclusión 3: ventana del 15 de marzo al 30 de junio (350 pedidos analizables) y la misma limpieza del canal del pedido. El Email de España, por tanto, incluye sus pedidos de newsletter.
- No uso `marketing_spend`, porque el gasto no tiene país y por eso no se puede calcular el ROAS por país.

*Cálculo (medidas), por canal y país:*

- Ventas = suma de `subtotal_cents` de los pedidos del canal en ese país, en euros.
- % de las ventas del país = ventas del canal en el país / ventas totales de ese país (Meta en Alemania: 38,4 %).
- % de las ventas del canal = ventas del canal en el país / ventas totales de ese canal (Meta en Alemania: 90,2 %).

```sql
with pedidos as (
  select id, country, channel, subtotal_cents
  from orders
  where created_at >= '2026-03-15' and created_at < '2026-07-01'
    and status in ('delivered', 'pending')
    and deleted_at is null
    and subtotal_cents >= 100
),
ventas_canal_pais as (
  select case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
              when trim(channel) = 'Newsletter' then 'Email'
              else trim(channel) end as canal,
         country as pais,
         sum(subtotal_cents) / 100.0 as ventas
  from pedidos
  group by case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
                when trim(channel) = 'Newsletter' then 'Email'
                else trim(channel) end,
           country
)
select canal,
       pais,
       round(ventas, 2) as ventas_netas_eur,
       round(100.0 * ventas / sum(ventas) over (partition by pais), 1) as pct_de_las_ventas_del_pais,
       round(100.0 * ventas / sum(ventas) over (partition by canal), 1) as pct_de_las_ventas_del_canal
from ventas_canal_pais
order by canal, pais;
```

---

## 5. El top 5 son 3 prendas de Ropa, unas zapatillas y el Bolso Bandolera, y suma el 39 % de las ventas con 5 de 23 productos; los tres más caros son los que menos unidades venden (8 a 11, el 6,3 % de las ventas) y casi solo en Alemania

**Qué dice el dato.** El top 5 es el Bolso Bandolera (3.846,15 €), la Sudadera (3.452,00 €), el Vestido Midi (3.351,95 €), el Pantalón Cargo (3.012,32 €) y las Zapatillas Running (2.658,10 €): 16.320,52 € (39,1 % de las ventas). Los tres productos de mayor precio medio de venta (Chaqueta Bomber a 89,95 €, Mocasines a 87,96 € y Botas Chelsea a 84,96 €) son los de menos unidades del catálogo: 11, 11 y 8, que suman 2.636,69 € (6,3 %). La Chaqueta y los Mocasines se venden solo en Alemania y las Botas, 7 de 8 unidades en Alemania.

**Por qué importa.** Saber qué productos tiran de las ventas y cuáles no sirve para decidir dónde poner el esfuerzo. Cinco productos hacen el 39 % de las ventas, y son los que ya demuestran demanda en los dos países: ahí es donde las campañas tienen más probabilidades de vender. Los tres que menos se venden (Chaqueta Bomber, Mocasines y Botas Chelsea) se venden casi solo en Alemania y con poco volumen, así que no hay base en los datos para dedicarles presupuesto de campaña ni para llevarlos a España.

**Cómo lo he calculado.**

*Supuestos y limpieza*

- Los de la conclusión 1: pedidos analizables (585) y ventas sin IVA ni envío.
- **Líneas sin ficha de producto.** 16 líneas de pedidos analizables tienen un `product_id` entre 901 y 919 que no existe en `products` (579,20 €). Se excluyen al unir con el catálogo. Sin ellas, las líneas suman exactamente el subtotal de los 585 pedidos; con ellas dejarían de cuadrar.
- **Productos con `active = false`** (Camiseta Técnica, Mochila Deporte y Sudadera con Capucha): se mantienen. Tienen ventas reales en pedidos analizables (el 6,6 % del total) y, al fin y al cabo, son ventas, estén o no activos hoy.
- **Sudaderas unificadas.** "Sudadera con Capucha" (id 24) y "Sudadera Capucha" (id 2) pasan a ser un solo producto: la primera se vende del 4 de enero al 14 de marzo a 54,95 € y la segunda desde el 18 de marzo a 59,95 €, sin solaparse. Es una inferencia, y por eso la Sudadera tiene dos precios y un precio medio de 57,53 €.

*Cálculo (medidas), por producto:*

- Importe de línea = cantidad × `unit_price_cents` / 100.
- Ventas = suma de los importes de línea del producto. Unidades = suma de las cantidades, y por país (España y Alemania).
- Precio medio de venta = ventas / unidades.
- % de las ventas y % acumulado = ventas del producto sobre el total de 41.786,13 €, y suma acumulada en orden de ventas.
- Rankings = por ventas, por precio medio de venta y por menos unidades.

```sql
with pedidos as (
  select id, country, subtotal_cents, created_at
  from orders
  where created_at >= '2026-01-01' and created_at < '2026-07-01'
    and status in ('delivered', 'pending')
    and deleted_at is null
    and subtotal_cents >= 100
),
lineas as (
  select oi.order_id,
         replace(p.name, 'Sudadera con Capucha', 'Sudadera Capucha') as producto,
         p.category as categoria,
         o.country as pais,
         o.created_at,
         oi.quantity,
         oi.quantity * oi.unit_price_cents / 100.0 as importe
  from order_items oi
  join pedidos o on o.id = oi.order_id
  join products p on p.id = oi.product_id
),
por_producto as (
  select producto,
         max(categoria) as categoria,
         sum(importe) as ventas,
         sum(quantity) as unidades,
         coalesce(sum(quantity) filter (where pais = 'ES'), 0) as unidades_es,
         coalesce(sum(quantity) filter (where pais = 'DE'), 0) as unidades_de
  from lineas
  group by producto
)
select producto,
       categoria,
       round(ventas, 2) as ventas_eur,
       round(100.0 * ventas / sum(ventas) over (), 1) as pct_ventas,
       round(100.0 * sum(ventas) over (order by ventas desc) / sum(ventas) over (), 1) as pct_ventas_acumulado,
       unidades,
       unidades_es,
       unidades_de,
       round(ventas / unidades, 2) as precio_medio_venta_eur,
       rank() over (order by ventas desc) as ranking_ventas,
       rank() over (order by ventas / unidades desc) as ranking_precio,
       rank() over (order by unidades asc) as ranking_menos_unidades
from por_producto
order by ventas desc;
```

---

## 6. Calzado y Deporte crecen en Alemania (+24 % y de 206 € a 671 €) y retroceden en España (−8,5 % y de 668 € a 560 €), donde son las dos categorías de menor peso (16 % y 6 %)

**Qué dice el dato.** En Alemania, Calzado pasa de 2.540,18 € en el primer trimestre a 3.158,75 € en el segundo (+24,4 %) y supone el 26,9 % de sus ventas. En España baja de 1.713,51 € a 1.568,65 € (−8,5 %) y pesa un 15,9 %. Deporte, con datos solo desde mayo, pasa en Alemania de 205,60 € en mayo a 671,00 € en junio (4,1 % de las ventas); en España baja de 668,00 € a 560,10 € (6,0 %).

**Por qué importa.** Calzado y Deporte tienen tirón en Alemania, pero en España no despegan y pesan poco: ahí está el margen de crecimiento. Hay que empujar el calzado en España, por ejemplo con campañas por email, y vigilar Deporte con cautela, porque solo tiene dos meses de datos y la tendencia puede ser ruido.

**Cómo lo he calculado.**

*Supuestos y limpieza*

- Los de la conclusión 1 (pedidos analizables y ventas) y los de la conclusión 5: se descartan las 16 líneas sin ficha en `products` y se mantienen los productos inactivos.
- La categoría es la de la ficha del producto. Las Zapatillas Trail Urbanas figuran en Accesorios y se respeta.
- Deporte tiene fecha de alta el 1 de mayo, aunque el anexo dice que existe desde principios de año. Lo declaro como discrepancia y por eso solo comparo mayo con junio.
- T1 es enero–marzo y T2 es abril–junio.

*Cálculo (medidas):*

- Importe de línea = cantidad × `unit_price_cents` / 100, agregado por país y categoría (el país sale de `orders`).
- Variación = ventas T2 / ventas T1 − 1. Peso = porcentaje sobre las ventas del país.

```sql
with pedidos as (
  select id, country, created_at
  from orders
  where created_at >= '2026-01-01' and created_at < '2026-07-01'
    and status in ('delivered', 'pending')
    and deleted_at is null
    and subtotal_cents >= 100
),
lineas as (
  select o.country as pais,
         p.category as categoria,
         extract(month from o.created_at) as mes,
         oi.quantity * oi.unit_price_cents / 100.0 as importe
  from order_items oi
  join pedidos o on o.id = oi.order_id
  join products p on p.id = oi.product_id
),
por_categoria as (
  select pais,
         categoria,
         sum(importe) as ventas,
         sum(importe) filter (where mes <= 3) as ventas_t1,
         sum(importe) filter (where mes >= 4) as ventas_t2,
         sum(importe) filter (where mes = 5) as ventas_mayo,
         sum(importe) filter (where mes = 6) as ventas_junio
  from lineas
  group by pais, categoria
)
select pais,
       categoria,
       round(ventas, 2) as ventas_eur,
       round(100.0 * ventas / sum(ventas) over (partition by pais), 1) as pct_ventas_pais,
       round(ventas_t1, 2) as ventas_t1_eur,
       round(ventas_t2, 2) as ventas_t2_eur,
       round((ventas_t2 / nullif(ventas_t1, 0) - 1) * 100, 1) as var_t2_vs_t1_pct,
       round(ventas_mayo, 2) as ventas_mayo_eur,
       round(ventas_junio, 2) as ventas_junio_eur
from por_categoria
order by pais, ventas desc;
```

---

## Modelado

```mermaid
erDiagram
    orders ||--o{ order_items : "order_id"
    products ||--o{ order_items : "product_id"
    orders {
        id id
        string country
        string channel
        string status
        int subtotal_cents
        timestamp created_at
        timestamp deleted_at
    }
    order_items {
        id order_id
        id product_id
        int quantity
        int unit_price_cents
    }
    products {
        id id
        string name
        string category
    }
    marketing_spend {
        date date
        string channel
        number spend_raw
        string currency_unit
    }
```

- `orders` basta para país, cliente, canal y ventas: un pedido es una fila.
- `order_items` y `products` solo se usan en producto y categoría (conclusiones 5 y 6), con cruce interno.
- `marketing_spend` no tiene clave común con `orders` ni país: se resume por canal y se une por el nombre del canal ya limpiado (conclusión 3).
- No se usa la vista `v_kpis_mensuales`: cuenta dos veces los pedidos con dos promociones.
