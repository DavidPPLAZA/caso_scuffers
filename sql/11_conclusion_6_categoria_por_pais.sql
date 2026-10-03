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