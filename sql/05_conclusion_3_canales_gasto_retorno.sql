with pedidos as (
  select id, country, channel, subtotal_cents
  from orders
  where created_at >= '2026-03-15' and created_at < '2026-07-01'
    and status in ('delivered', 'pending')
    and deleted_at is null
    and subtotal_cents >= 100
),
ventas_canal as (
  select case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
              when trim(channel) = 'Newsletter' then 'Email'
              else trim(channel) end as canal,
         count(*) as pedidos,
         sum(subtotal_cents) / 100.0 as ventas
  from pedidos
  group by case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
                when trim(channel) = 'Newsletter' then 'Email'
                else trim(channel) end
),
gasto_canal as (
  select case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
              else trim(channel) end as canal,
         sum(case when currency_unit = 'EUR_CENTS' then spend_raw / 100.0 else spend_raw end) as gasto
  from (
    select distinct on (date, channel) date, channel, spend_raw, currency_unit
    from marketing_spend
    where date >= '2026-03-15' and date <= '2026-06-30'
    order by date, channel, id
  ) sin_duplicados
  group by case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
                else trim(channel) end
),
por_canal as (
  select v.canal, g.gasto, v.ventas, v.pedidos
  from ventas_canal v
  left join gasto_canal g on g.canal = v.canal
),
totales as (
  select sum(gasto) as gasto_total, sum(ventas) as ventas_total from por_canal
),
resumen as (
  select canal, gasto, ventas, pedidos from por_canal
  union all
  select 'Email + TikTok Ads', sum(gasto), sum(ventas), sum(pedidos)
  from por_canal where canal in ('Email', 'TikTok Ads')
)
select r.canal,
       round(r.gasto, 2) as gasto_eur,
       round(100.0 * r.gasto / t.gasto_total, 1) as pct_del_gasto,
       round(r.ventas, 2) as ventas_netas_eur,
       round(100.0 * r.ventas / t.ventas_total, 1) as pct_de_las_ventas,
       r.pedidos,
       round(r.ventas / r.gasto, 2) as roas,
       round(r.gasto / r.pedidos, 2) as gasto_por_pedido_eur
from resumen r
cross join totales t
order by r.gasto desc nulls last, r.canal;