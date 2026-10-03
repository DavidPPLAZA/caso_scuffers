import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.cwd(), "..", "sql");
if (!fs.existsSync(dir)) process.exit(0); // en Vercel se usa el fichero ya generado

const out = {};
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  out[f.replace(".sql", "")] = fs.readFileSync(path.join(dir, f), "utf8");
}
fs.writeFileSync(
  path.resolve("lib", "sql.generated.ts"),
  "// Fichero generado desde /sql. No editar a mano.\nexport const SQL: Record<string, string> = " +
    JSON.stringify(out, null, 2) + ";\n"
);