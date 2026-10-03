export async function runSql<T = Record<string, unknown>>(
  query: string
): Promise<T[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Faltan las variables de Supabase");

  const res = await fetch(`${url}/rest/v1/rpc/run_sql`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, quien: "David Plaza" }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Error SQL: ${await res.text()}`);
  return res.json();
}