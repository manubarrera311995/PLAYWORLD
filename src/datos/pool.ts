import type { Track } from "./tipos";

let cache: Track[] | null = null;

export async function cargarPool(): Promise<Track[]> {
  if (cache) return cache;
  const res = await fetch("/data/archivo/pool.ipod.json");
  if (!res.ok) return [];
  cache = (await res.json()) as Track[];
  return cache;
}

export async function cargarPercentiles(): Promise<Record<string, number[]>> {
  const res = await fetch("/data/archivo/percentiles.json");
  if (!res.ok) return {};
  return (await res.json()) as Record<string, number[]>;
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
