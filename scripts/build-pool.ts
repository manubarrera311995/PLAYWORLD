import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "public", "data", "archivo");

type Track = {
  id: string;
  year: number;
  artist: string;
  dnaCompleto: boolean;
  art: string | null;
  dnaPct: Record<string, number>;
};

function scoreAlma(t: Track, id: string): number {
  const p = t.dnaPct;
  const n = (k: string) => p[k] ?? 50;
  if (id === "noctambula") return 0.34 * n("oscuridad") + 0.33 * n("danceability") + 0.33 * n("energy");
  if (id === "melancolica") return 0.55 * n("nostalgia") + 0.45 * (100 - Math.abs(n("happy") - 50));
  if (id === "intensa") return 0.5 * n("aggressive") + 0.5 * n("energy");
  if (id === "nostalgica") return 0.62 * n("nostalgia") + 0.38 * (100 - n("tempo"));
  if (id === "colectiva") return 0.55 * n("relaxed") + 0.45 * (100 - Math.abs(n("energy") - 40));
  return 0.5 * n("spectralFlatness") + 0.5 * (100 - Math.abs(n("energy") - 50));
}

async function main(): Promise<void> {
  const files = (await readdir(DIR)).filter((f) => f.startsWith("tracks.") && f.endsWith(".json"));
  const all: Track[] = [];
  for (const f of files) {
    const tracks = JSON.parse(await readFile(path.join(DIR, f), "utf8")) as Track[];
    all.push(...tracks);
  }
  const complete = all.filter((t) => t.dnaCompleto);
  const withArt = complete.filter((t) => t.art);
  const almas = ["noctambula", "melancolica", "exploradora", "colectiva", "intensa", "nostalgica"];
  const picked = new Map<string, Track>();
  for (const id of almas) {
    const ranked = [...(withArt.length ? withArt : complete)].sort((a, b) => scoreAlma(b, id) - scoreAlma(a, id));
    for (const t of ranked.slice(0, 12)) picked.set(t.id, t);
  }
  const years = [...new Set(complete.map((t) => t.year))];
  for (const y of years) {
    const ofYear = (withArt.length ? withArt : complete).filter((t) => t.year === y);
    for (const t of ofYear.slice(0, 8)) picked.set(t.id, t);
  }
  const pool = [...picked.values()].slice(0, 120);
  await writeFile(path.join(DIR, "pool.ipod.json"), JSON.stringify(pool));
  console.log(`pool: ${pool.length} tracks`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
