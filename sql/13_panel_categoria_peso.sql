with pedidos as (
  select id, created_at
  from orders
  where created_at >= '2026-01-01' and created_at < '2026-07-01'
    and status in ('delivered', 'pending')
    and deleted_at is null
    and subtotal_cents >= 100
),
lineas as (
  select p.category as categoria,
         o.created_at,
         oi.quantity * oi.unit_price_cents / 100.0 as importe
  from order_items oi
  join pedidos o on o.id = oi.order_id
  join products p on p.id = oi.product_id
)
select categoria,
       round(sum(importe), 2) as ventas_eur,
       round(100.0 * sum(importe) / sum(sum(importe)) over (), 1) as pct_ventas,
       round(coalesce(sum(importe) filter (where created_at >= '2026-05-01'), 0), 2) as ventas_desde_mayo_eur,
       round(100.0 * coalesce(sum(importe) filter (where created_at >= '2026-05-01'), 0)
             / sum(sum(importe) filter (where created_at >= '2026-05-01')) over (), 1) as pct_desde_mayo
from lineas
group by categoria
order by ventas_eur desc;