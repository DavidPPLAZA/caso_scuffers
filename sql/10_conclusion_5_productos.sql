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