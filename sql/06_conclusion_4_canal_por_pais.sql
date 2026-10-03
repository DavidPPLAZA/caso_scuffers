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