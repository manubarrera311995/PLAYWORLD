import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PARENT = path.resolve(ROOT, "..");
const OUT = path.join(ROOT, "public", "data", "archivo");
const PIPELINE_OUTPUT = path.join(PARENT, "PROYECTOFINAL", "data", "output");

type Raw = Record<string, unknown>;

const METRICAS = [
  "happy",
  "sad",
  "relaxed",
  "aggressive",
  "nostalgia",
  "oscuridad",
  "energy",
  "danceability",
  "tempo",
  "spectralFlatness",
  "approachability",
  "engagement",
] as const;

function unwrap(json: unknown): Raw {
  if (Array.isArray(json)) return ((json[0] ?? {}) as Raw);
  return json as Raw;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function yearFromFolder(name: string): number | null {
  const m = name.match(/DATA_(\d{4})/);
  return m ? Number(m[1]) : null;
}

async function findRawDirs(): Promise<{ year: number; dir: string }[]> {
  if (!existsSync(PIPELINE_OUTPUT)) return [];
  const entries = await readdir(PIPELINE_OUTPUT, { withFileTypes: true });
  const found: { year: number; dir: string }[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const y = yearFromFolder(e.name);
    if (!y) continue;
    found.push({ year: y, dir: path.join(PIPELINE_OUTPUT, e.name) });
  }
  return found.sort((a, b) => a.year - b.year);
}

type TrackOut = {
  id: string;
  year: number;
  artist: string;
  track: string;
  art: string | null;
  spotifyId?: string;
  genre?: string;
  pais?: string;
  dna: Record<string, unknown>;
  dnaPct: Record<string, number>;
  dnaCompleto: boolean;
};

function paisDe(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function fromRaw(file: string, json: Raw, year: number): TrackOut {
  const id = path.basename(file, ".json");
  const nostalgia = num(json.nostalgia);
  const oscuridad = num(json.oscuridad);
  const dnaCompleto = nostalgia != null && oscuridad != null;
  const scale = json.scale === "Mayor" ? "Mayor" : "Menor";
  return {
    id,
    year,
    artist: String(json.spotifyArtist ?? json.artist ?? ""),
    track: String(json.spotifyTrackName ?? json.track ?? json.filename ?? id),
    art: typeof json.spotifyAlbumArt === "string" ? json.spotifyAlbumArt : (json.art as string | null) ?? null,
    spotifyId: typeof json.spotifyId === "string" ? json.spotifyId : undefined,
    genre: typeof json.genre === "string" ? json.genre : undefined,
    pais: paisDe(json.pais),
    dna: {
      happy: num(json.happy) ?? 50,
      sad: num(json.sad) ?? 50,
      relaxed: num(json.relaxed) ?? 50,
      aggressive: num(json.aggressive) ?? 50,
      nostalgia: nostalgia ?? 70,
      oscuridad: oscuridad ?? 70,
      energy: num(json.energy) ?? 50,
      danceability: num(json.danceability) ?? 40,
      tempo: num(json.tempo) ?? 120,
      spectralFlatness: num(json.spectralFlatness) ?? 20,
      approachability: num(json.approachability) ?? undefined,
      engagement: num(json.engagement) ?? undefined,
      scale,
      keyNote: String(json.keyNote ?? "C"),
    },
    dnaPct: {},
    dnaCompleto,
  };
}

function fromEdicionSong(s: Raw, year: number): TrackOut {
  const rawId = String(s.id ?? "").replace(/\.json$/, "");
  const nostalgia = num(s.nostalgia);
  const oscuridad = num(s.oscuridad);
  return {
    id: rawId,
    year,
    artist: String(s.artist ?? ""),
    track: String(s.track ?? rawId),
    art: typeof s.art === "string" ? s.art : null,
    dna: {
      happy: num(s.happy) ?? 50,
      sad: num(s.sad) ?? 50,
      relaxed: num(s.relaxed) ?? 50,
      aggressive: num(s.aggressive) ?? 50,
      nostalgia: nostalgia ?? 70,
      oscuridad: oscuridad ?? 70,
      energy: num(s.energy) ?? 50,
      danceability: num(s.danceability) ?? 40,
      tempo: num(s.tempo) ?? 120,
      spectralFlatness: num(s.spectralFlatness) ?? num(s.high) ?? 20,
      scale: s.scale === "Mayor" ? "Mayor" : "Menor",
      keyNote: String(s.keyNote ?? "C"),
    },
    dnaPct: {},
    dnaCompleto: nostalgia != null && oscuridad != null,
  };
}

async function loadFromEdicionJson(year: number): Promise<TrackOut[]> {
  const p = path.join(PARENT, "playworld-home", "data", "edicion", `${year}.json`);
  if (!existsSync(p)) return [];
  const json = JSON.parse(await readFile(p, "utf8")) as { songs?: Raw[] };
  return (json.songs ?? []).map((s) => fromEdicionSong(s, year));
}

async function loadIpodFallback(): Promise<TrackOut[]> {
  const p = path.join(PARENT, "playworld-home", "data", "ipod.json");
  if (!existsSync(p)) return [];
  const json = JSON.parse(await readFile(p, "utf8")) as { songs?: Raw[] };
  return (json.songs ?? []).map((s) => fromEdicionSong({ ...s, id: s.id }, Number(s.year) || 2013));
}

function percentiles(tracks: TrackOut[]): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const k of METRICAS) {
    const vals = tracks
      .map((t) => t.dna[k])
      .filter((v): v is number => typeof v === "number")
      .sort((a, b) => a - b);
    out[k] = vals;
  }
  return out;
}

function pct(sorted: number[], v: number): number {
  if (!sorted.length) return 50;
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= v) lo = mid + 1;
    else hi = mid;
  }
  return sorted.length === 1 ? 50 : (lo / sorted.length) * 100;
}

async function actualizarConteos(byYear: Map<number, TrackOut[]>): Promise<void> {
  const edicionesPath = path.join(OUT, "ediciones.json");
  if (!existsSync(edicionesPath)) {
    console.warn("ediciones.json no existe; no se regenera collage, tesis ni caption");
    return;
  }
  const raw = await readFile(edicionesPath, "utf8");
  const previas = JSON.parse(raw) as { year: number; conteo: number }[];
  if (!Array.isArray(previas)) return;

  let changed = false;
  for (const ed of previas) {
    const tracks = byYear.get(ed.year);
    if (!tracks || ed.conteo === tracks.length) continue;
    console.log(`conteo ${ed.year}: ${ed.conteo} → ${tracks.length}`);
    ed.conteo = tracks.length;
    changed = true;
  }
  if (!changed) return;

  const body = JSON.stringify(previas, null, 2);
  await writeFile(edicionesPath, raw.endsWith("\n") ? `${body}\n` : body);
}

async function main(): Promise<void> {
  await mkdir(OUT, { recursive: true });
  const byYear = new Map<number, TrackOut[]>();

  for (const { year, dir } of await findRawDirs()) {
    const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
    const tracks: TrackOut[] = [];
    for (const f of files) {
      try {
        const json = unwrap(JSON.parse(await readFile(path.join(dir, f), "utf8")));
        tracks.push(fromRaw(f, json, year));
      } catch {
        /* skip */
      }
    }
    if (tracks.length) byYear.set(year, tracks);
  }

  for (const year of [2011, 2013, 2026]) {
    const extra = await loadFromEdicionJson(year);
    if (!extra.length) continue;
    const list = byYear.get(year) ?? [];
    const byId = new Map(list.map((t) => [t.id, t]));
    for (const t of extra) {
      const prev = byId.get(t.id);
      if (!prev) byId.set(t.id, t);
      else {
        byId.set(t.id, {
          ...prev,
          artist: prev.artist || t.artist,
          track: prev.track === prev.id ? t.track : prev.track,
          art: prev.art ?? t.art,
          dnaCompleto: prev.dnaCompleto || t.dnaCompleto,
          dna: prev.dnaCompleto ? prev.dna : t.dna,
        });
      }
    }
    byYear.set(year, [...byId.values()]);
  }

  const ipodTracks = await loadIpodFallback();
  for (const t of ipodTracks) {
    const list = byYear.get(t.year) ?? [];
    if (!list.some((x) => x.id === t.id)) list.push(t);
    byYear.set(t.year, list);
  }

  const all = [...byYear.values()].flat();
  const perc = percentiles(all);
  for (const t of all) {
    for (const k of METRICAS) {
      const v = t.dna[k];
      if (typeof v === "number") t.dnaPct[k] = Math.round(pct(perc[k] ?? [], v));
    }
  }

  for (const [year, tracks] of byYear) {
    await writeFile(path.join(OUT, `tracks.${year}.json`), JSON.stringify(tracks));
  }

  await actualizarConteos(byYear);
  await writeFile(path.join(OUT, "percentiles.json"), JSON.stringify(perc));
  console.log(`archivo: ${all.length} tracks, años ${[...byYear.keys()].sort().join(",")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
