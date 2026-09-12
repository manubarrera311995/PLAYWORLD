import type { Track } from "./tipos";
import { leerJson } from "./http";

let cache: Track[] | null = null;
let percCache: Record<string, number[]> | null = null;

export function hidratarPool(tracks: Track[]): void {
  cache = tracks;
}

export function hidratarPercentiles(perc: Record<string, number[]>): void {
  percCache = perc;
}

export async function cargarPool(): Promise<Track[]> {
  if (cache) return cache;
  const data = await leerJson<Track[]>("/data/archivo/pool.ipod.json");
  cache = Array.isArray(data) ? data : [];
  return cache;
}

export async function cargarPercentiles(): Promise<Record<string, number[]>> {
  if (percCache) return percCache;
  const data = await leerJson<Record<string, number[]>>("/data/archivo/percentiles.json");
  percCache = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  return percCache;
}

export function poolPorAnio(pool: Track[], year: number | null): Track[] {
  if (year == null) return pool;
  const first = pool.filter((t) => t.year === year);
  const rest = pool.filter((t) => t.year !== year);
  return [...first, ...rest];
}

export function aniosDelPool(pool: Track[]): number[] {
  return [...new Set(pool.map((t) => t.year))].sort((a, b) => a - b);
}
