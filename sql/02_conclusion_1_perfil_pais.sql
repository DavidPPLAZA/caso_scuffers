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