import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src", "rastros", "semilla.json");
const MOCK = path.resolve(ROOT, "..", "playworld-home", "data", "colectiva.json");

async function main(): Promise<void> {
  if (!existsSync(MOCK)) {
    console.log("semilla: se conserva src/rastros/semilla.json");
    return;
  }
  const mock = JSON.parse(await readFile(MOCK, "utf8")) as {
    players: { id: string; name: string; almaId: string; picked: { id: string }[] }[];
  };
  const rows = mock.players.map((p, i) => ({
    id: `semilla-${p.id}`,
    alias: p.name.slice(0, 12),
    almaId: p.almaId,
    trackIds: p.picked.map((x) => x.id),
    yearHint: 2013,
    createdAt: new Date(Date.UTC(2026, 0, 1, 12, i)).toISOString(),
    origen: "semilla",
  }));
  const extra = JSON.parse(await readFile(SRC, "utf8")) as typeof rows;
  const merged = [...rows];
  for (const e of extra) {
    if (!merged.some((r) => r.id === e.id)) merged.push(e);
  }
  await writeFile(SRC, JSON.stringify(merged.slice(0, 12), null, 2));
  console.log(`semilla: ${Math.min(12, merged.length)} rastros`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
