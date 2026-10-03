select round(sum(subtotal_cents) / 100.0, 2) as ventas_eur,
       count(*) as pedidos,
       round(avg(subtotal_cents) / 100.0, 2) as ticket_medio_eur
from orders
where created_at >= '2026-01-01' and created_at < '2026-07-01'
  and status in ('delivered', 'pending')
  and deleted_at is null
  and subtotal_cents >= 100;