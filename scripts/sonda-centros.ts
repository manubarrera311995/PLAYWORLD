/**
 * Sonda: compara promedio contra mediana y mide cuánto separa el cartel sus
 * medianas, para decidir qué cifras merecen el titular del capítulo 03.
 * Uso: npx tsx scripts/sonda-centros.ts energy
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const metric = process.argv[2] ?? "energy";

function mediana(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function cuantil(nums: number[], f: number): number {
  const s = [...nums].sort((a, b) => a - b);
  const p = (s.length - 1) * f;
  const lo = Math.floor(p);
  const hi = Math.ceil(p);
  return s[lo]! + (s[hi]! - s[lo]!) * (p - lo);
}

const promedio = (nums: number[]) => nums.reduce((a, b) => a + b, 0) / nums.length;
const r = (n: number) => Math.round(n * 10) / 10;

for (const carpeta of readdirSync(join(process.cwd(), "raw"))) {
  const dir = join(process.cwd(), "raw", carpeta);
  const actos = new Map<string, number[]>();
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const prefix = file.replace(/\.json$/i, "").split("_")[0]!;
    for (const row of JSON.parse(readFileSync(join(dir, file), "utf8")) as Record<string, unknown>[]) {
      const v = row[metric];
      if (typeof v !== "number") continue;
      actos.set(prefix, [...(actos.get(prefix) ?? []), v]);
    }
  }
  const canciones = [...actos.values()].flat();
  if (!canciones.length) continue;
  const centros = [...actos.values()].map(mediana);
  const med = mediana(canciones);
  const prom = promedio(canciones);
  const dentro = centros.filter((c) => Math.abs(c - med) <= 10).length;
  console.log(
    [
      carpeta.replace("DATA_", ""),
      `n=${String(canciones.length).padStart(4)}`,
      `actos=${String(centros.length).padStart(3)}`,
      `mediana=${String(r(med)).padStart(5)}`,
      `promedio=${String(r(prom)).padStart(5)}`,
      `desvío=${String(r(prom - med)).padStart(5)}`,
      `medActos=${String(r(mediana(centros))).padStart(5)}`,
      `actosP25-P75=${r(cuantil(centros, 0.25))}–${r(cuantil(centros, 0.75))}`,
      `±10 mediana=${dentro}/${centros.length}`,
    ].join("  "),
  );
}
