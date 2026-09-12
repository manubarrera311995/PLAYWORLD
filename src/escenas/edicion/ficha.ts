import type { DnaKey, Track } from "../../datos/tipos";

export type MoodStats = {
  n: number;
  median: number;
  p25: number;
  p75: number;
  iqr: number;
};

export type Acto = {
  prefix: string;
  artist: string;
  songs: Track[];
};

export type CaracterKind = "partida" | "intensa" | "contenida" | "tension";

export const MOOD_KEYS: DnaKey[] = [
  "happy",
  "danceability",
  "engagement",
  "nostalgia",
  "oscuridad",
  "energy",
  "relaxed",
  "aggressive",
];

export const ACT_METRIC_KEYS: DnaKey[] = [
  "energy",
  "relaxed",
  "aggressive",
  "nostalgia",
  "oscuridad",
];

export const DELTA_KEYS: DnaKey[] = [
  "relaxed",
  "energy",
  "aggressive",
  "nostalgia",
  "oscuridad",
  "engagement",
  "happy",
  "danceability",
];

export const MAP = {
  width: 900,
  height: 620,
  pad: { left: 74, right: 28, top: 36, bottom: 58 },
} as const;

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function dnaNum(track: Track, key: DnaKey): number | null {
  const v = track.dna[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function values(tracks: Track[], key: DnaKey): number[] {
  const out: number[] = [];
  for (const t of tracks) {
    const n = dnaNum(t, key);
    if (n != null) out.push(n);
  }
  return out;
}

export function median(arr: number[]): number | null {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function quantile(arr: number[], fraction: number): number | null {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (position - lower);
}

export function moodStats(tracks: Track[], key: DnaKey): MoodStats | null {
  const nums = values(tracks, key);
  if (!nums.length) return null;
  const p25 = quantile(nums, 0.25);
  const p75 = quantile(nums, 0.75);
  const med = median(nums);
  if (p25 == null || p75 == null || med == null) return null;
  return { n: nums.length, median: med, p25, p75, iqr: p75 - p25 };
}

export function hash(text: string): number {
  let value = 0;
  for (const character of text) {
    value = (value * 31 + character.charCodeAt(0)) | 0;
  }
  return Math.abs(value);
}

export function actPrefix(id: string): string {
  return String(id || "SIN_ACTO").replace(/\.json$/i, "").split("_")[0] || "SIN_ACTO";
}

export function primaryArtist(songs: Track[]): string {
  const counts = new Map<string, number>();
  for (const song of songs) {
    const artist = String(song.artist || "Acto sin identificar").split(",")[0]?.trim() || "Acto sin identificar";
    counts.set(artist, (counts.get(artist) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Acto sin identificar";
}

export function groupActs(songs: Track[]): Acto[] {
  const groups = new Map<string, Track[]>();
  for (const song of songs) {
    const prefix = actPrefix(song.id);
    const list = groups.get(prefix);
    if (list) list.push(song);
    else groups.set(prefix, [song]);
  }
  return [...groups.entries()].map(([prefix, actSongs]) => ({
    prefix,
    artist: primaryArtist(actSongs),
    songs: actSongs,
  }));
}

export function clusterOf(track: Track): "intenso" | "suave" {
  return (dnaNum(track, "energy") ?? 0) >= 50 ? "intenso" : "suave";
}

export function caracterDe(tracks: Track[]) {
  const energy = moodStats(tracks, "energy");
  const relaxed = moodStats(tracks, "relaxed");
  const happy = moodStats(tracks, "happy");
  const aggressive = moodStats(tracks, "aggressive");
  const oscuridad = moodStats(tracks, "oscuridad");
  const nostalgia = moodStats(tracks, "nostalgia");
  const nActs = groupActs(tracks).length;
  const minor = tracks.filter((s) => s.dna.scale === "Menor").length;
  const tonal = tracks.filter((s) => s.dna.scale === "Menor" || s.dna.scale === "Mayor").length;
  const minorShare = tonal ? Math.round((100 * minor) / tonal) : 0;
  const split = Boolean(energy && relaxed && energy.iqr >= 25 && relaxed.iqr >= 25);
  let kind: CaracterKind = "tension";
  if (split) kind = "partida";
  else if (energy && energy.median >= 55) kind = "intensa";
  else if (energy && energy.median <= 30) kind = "contenida";
  return {
    kind,
    split,
    energy,
    relaxed,
    happy,
    aggressive,
    oscuridad,
    nostalgia,
    minorShare,
    nActs,
  };
}

export function placeSong(song: Track, index: number): { x: number; y: number } | null {
  const rx = dnaNum(song, "relaxed");
  const ey = dnaNum(song, "energy");
  if (rx == null || ey == null) return null;
  const { width, height, pad } = MAP;
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const jx = ((hash(`${song.id}-${index}-x`) % 1000) / 1000 - 0.5) * 2.1;
  const jy = ((hash(`${song.id}-${index}-y`) % 1000) / 1000 - 0.5) * 2.1;
  return {
    x: pad.left + (clamp(rx + jx) / 100) * plotWidth,
    y: height - pad.bottom - (clamp(ey + jy) / 100) * plotHeight,
  };
}

export function fill(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

export function round(n: number | null | undefined): number {
  return Math.round(n ?? 0);
}
