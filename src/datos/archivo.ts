import type { Edicion, Track } from "./tipos";

const cacheTracks = new Map<number, Track[]>();
let edicionesCache: Edicion[] | null = null;

export async function cargarEdiciones(): Promise<Edicion[]> {
  if (edicionesCache) return edicionesCache;
  const res = await fetch("/data/archivo/ediciones.json");
  if (!res.ok) throw new Error("No se pudieron cargar las ediciones");
  edicionesCache = (await res.json()) as Edicion[];
  return edicionesCache;
}

export async function cargarTracks(year: number): Promise<Track[]> {
  const hit = cacheTracks.get(year);
  if (hit) return hit;
  const res = await fetch(`/data/archivo/tracks.${year}.json`);
  if (!res.ok) return [];
  const tracks = (await res.json()) as Track[];
  cacheTracks.set(year, tracks);
  return tracks;
}

export async function edicionDe(year: number): Promise<Edicion | undefined> {
  const all = await cargarEdiciones();
  return all.find((e) => e.year === year);
}

export function precargarPool(): Promise<Track[]> {
  return import("./pool").then((m) => m.cargarPool());
}
