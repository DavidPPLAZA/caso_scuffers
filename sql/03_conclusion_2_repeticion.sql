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