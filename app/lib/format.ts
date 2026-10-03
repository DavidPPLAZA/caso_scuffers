// Locale "de-DE" = mismo formato que España (1.234,56) pero agrupa también los miles de 4 cifras.
const nf = (d: number) =>
  new Intl.NumberFormat("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });

export const eur = (n: number, d = 2) => `${nf(d).format(n)} €`;
export const num = (n: number) => nf(0).format(n);
export const dec = (n: number, d = 2) => nf(d).format(n);
export const pct = (n: number) => `${nf(1).format(n)} %`;