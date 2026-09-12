import type { AlmaId, DnaKey, Track } from "../datos/tipos";
import { ALMA_IDS, almas, type ContextoSeleccion, type MediaDNA } from "./almas";

export type RankingAlma = {
  principal: AlmaId;
  eco: AlmaId;
  puntajes: Record<AlmaId, number>;
};

const METRICAS: DnaKey[] = [
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
];

function pctDe(track: Track, key: DnaKey): number {
  const p = track.dnaPct[key];
  if (typeof p === "number") return p;
  const raw = track.dna[key];
  return typeof raw === "number" ? raw : 50;
}

export function mediaPct(tracks: Track[]): MediaDNA {
  const acc: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const t of tracks) {
    for (const k of METRICAS) {
      const v = t.dnaPct[k] ?? (typeof t.dna[k] === "number" ? Number(t.dna[k]) : undefined);
      if (typeof v !== "number") continue;
      acc[k] = (acc[k] ?? 0) + v;
      counts[k] = (counts[k] ?? 0) + 1;
    }
  }
  const get = (k: DnaKey) => (counts[k] ? acc[k] / counts[k] : 50);
  return {
    happy: get("happy"),
    sad: get("sad"),
    relaxed: get("relaxed"),
    aggressive: get("aggressive"),
    nostalgia: get("nostalgia"),
    oscuridad: get("oscuridad"),
    energy: get("energy"),
    danceability: get("danceability"),
    tempo: get("tempo"),
    spectralFlatness: get("spectralFlatness"),
    approachability: counts.approachability ? get("approachability") : undefined,
  };
}

function stddev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length;
  return Math.sqrt(v);
}

export function contextoDe(tracks: Track[], aniosDisponibles = 3): ContextoSeleccion {
  const artistas = new Set(tracks.map((t) => t.artist));
  const anios = new Set(tracks.map((t) => t.year));
  const flats = tracks.map((t) => pctDe(t, "spectralFlatness"));
  return {
    artistasUnicos: artistas.size,
    aniosUnicos: anios.size,
    aniosDisponibles,
    sigmaFlatness: stddev(flats),
  };
}

export function rankear(tracks: Track[], _percentiles?: unknown, aniosDisponibles = 3): RankingAlma {
  const m = mediaPct(tracks);
  const ctx = contextoDe(tracks, aniosDisponibles);
  const puntajes = {} as Record<AlmaId, number>;
  for (const id of ALMA_IDS) {
    puntajes[id] = almas[id].puntuar(m, ctx);
  }
  const orden = [...ALMA_IDS].sort((a, b) => puntajes[b] - puntajes[a]);
  return {
    principal: orden[0],
    eco: orden[1],
    puntajes,
  };
}

export function ecosDelArchivo(seleccion: Track[], pool: Track[], almaId: AlmaId, n = 4): Track[] {
  const ids = new Set(seleccion.map((t) => t.id));
  const alma = almas[almaId];
  return pool
    .filter((t) => !ids.has(t.id) && t.dnaCompleto)
    .map((t) => ({ t, s: alma.puntuar(mediaPct([t]), contextoDe([t])) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.t);
}
