select extract(month from created_at) as mes,
       case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
            when trim(channel) = 'Newsletter' then 'Email'
            else trim(channel) end as canal,
       country as pais,
       round(sum(subtotal_cents) / 100.0, 2) as ventas_eur,
       count(*) as pedidos
from orders
where created_at >= '2026-03-15' and created_at < '2026-07-01'
  and status in ('delivered', 'pending')
  and deleted_at is null
  and subtotal_cents >= 100
group by extract(month from created_at),
         case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
              when trim(channel) = 'Newsletter' then 'Email'
              else trim(channel) end,
         country
order by mes, canal, pais;