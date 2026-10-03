with ventas as (
  select extract(month from created_at) as mes,
         case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
              when trim(channel) = 'Newsletter' then 'Email'
              else trim(channel) end as canal,
         sum(subtotal_cents) / 100.0 as ventas
  from orders
  where created_at >= '2026-03-15' and created_at < '2026-07-01'
    and status in ('delivered', 'pending')
    and deleted_at is null
    and subtotal_cents >= 100
  group by extract(month from created_at),
           case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
                when trim(channel) = 'Newsletter' then 'Email'
                else trim(channel) end
),
gasto as (
  select extract(month from date) as mes,
         case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
              else trim(channel) end as canal,
         sum(case when currency_unit = 'EUR_CENTS' then spend_raw / 100.0 else spend_raw end) as gasto
  from (
    select distinct on (date, channel) date, channel, spend_raw, currency_unit
    from marketing_spend
    where date >= '2026-03-15' and date <= '2026-06-30'
    order by date, channel, id
  ) sin_duplicados
  group by extract(month from date),
           case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
                else trim(channel) end
)
select g.mes,
       g.canal,
       round(g.gasto, 2) as gasto_eur,
       round(coalesce(v.ventas, 0), 2) as ventas_eur,
       round(coalesce(v.ventas, 0) / g.gasto, 2) as roas
from gasto g
left join ventas v on v.mes = g.mes and v.canal = g.canal
order by g.mes, g.canal;