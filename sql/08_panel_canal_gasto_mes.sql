select extract(month from date) as mes,
       case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
            else trim(channel) end as canal,
       round(sum(case when currency_unit = 'EUR_CENTS' then spend_raw / 100.0 else spend_raw end), 2) as gasto_eur
from (
  select distinct on (date, channel) date, channel, spend_raw, currency_unit
  from marketing_spend
  where date >= '2026-03-15' and date <= '2026-06-30'
  order by date, channel, id
) sin_duplicados
group by extract(month from date),
         case when lower(trim(channel)) like '%meta%' or trim(channel) = 'Instagram Ads' then 'Meta Ads'
              else trim(channel) end
order by mes, canal;