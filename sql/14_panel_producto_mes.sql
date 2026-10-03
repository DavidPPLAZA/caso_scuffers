with pedidos as (
  select id, created_at
  from orders
  where created_at >= '2026-01-01' and created_at < '2026-07-01'
    and status in ('delivered', 'pending')
    and deleted_at is null
    and subtotal_cents >= 100
)
select extract(month from o.created_at) as mes,
       replace(p.name, 'Sudadera con Capucha', 'Sudadera Capucha') as producto,
       p.category as categoria,
       round(sum(oi.quantity * oi.unit_price_cents / 100.0), 2) as ventas_eur,
       sum(oi.quantity) as unidades
from order_items oi
join pedidos o on o.id = oi.order_id
join products p on p.id = oi.product_id
group by extract(month from o.created_at),
         replace(p.name, 'Sudadera con Capucha', 'Sudadera Capucha'),
         p.category
order by mes, ventas_eur desc;