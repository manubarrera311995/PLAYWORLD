import type { Edicion, Track } from "./tipos";
import { enOleada, leerJson } from "./http";
import { hidratarPercentiles, hidratarPool } from "./pool";

const cacheTracks = new Map<number, Track[]>();
let edicionesCache: Edicion[] | null = null;
let precarga: Promise<void> | null = null;

export async function cargarEdiciones(): Promise<Edicion[]> {
  if (edicionesCache) return edicionesCache;
  const data = await leerJson<Edicion[]>("/data/archivo/ediciones.json");
  if (!Array.isArray(data)) throw new Error("No se pudieron cargar las ediciones");
  edicionesCache = data;
  return edicionesCache;
}

export async function cargarTracks(year: number): Promise<Track[]> {
  const hit = cacheTracks.get(year);
  if (hit) return hit;
  const tracks = await leerJson<Track[]>(`/data/archivo/tracks.${year}.json`);
  const list = Array.isArray(tracks) ? tracks : [];
  cacheTracks.set(year, list);
  return list;
}

export async function edicionDe(year: number): Promise<Edicion | undefined> {
  const all = await cargarEdiciones();
  return all.find((e) => e.year === year);
}

export function precargarPool(): Promise<Track[]> {
  return import("./pool").then((m) => m.cargarPool());
}

export async function precargarArchivo(onProgress?: (frac: number) => void): Promise<void> {
  if (!precarga) precarga = correrPrecarga(onProgress);
  else if (onProgress) onProgress(1);
  await precarga;
}

async function correrPrecarga(onProgress?: (frac: number) => void): Promise<void> {
  const pesos = new Map<string, { loaded: number; total: number }>();

  const reportar = () => {
    let loaded = 0;
    let total = 0;
    for (const item of pesos.values()) {
      loaded += item.loaded;
      total += item.total;
    }
    onProgress?.(total > 0 ? Math.min(1, loaded / total) : 0);
  };

  const bajar = async <T>(url: string): Promise<T | null> => {
    pesos.set(url, { loaded: 0, total: 1 });
    reportar();
    const data = await leerJson<T>(url, (loaded, total) => {
      pesos.set(url, { loaded, total: Math.max(total, loaded, 1) });
      reportar();
    });
    const prev = pesos.get(url);
    if (prev) {
      const done = Math.max(prev.total, prev.loaded, 1);
      pesos.set(url, { loaded: done, total: done });
      reportar();
    }
    return data;
  };

  const eds = await bajar<Edicion[]>("/data/archivo/ediciones.json");
  if (Array.isArray(eds)) edicionesCache = eds;

  const years = (edicionesCache ?? []).filter((e) => e.hasDNA).map((e) => e.year);
  const jobs: { url: string; apply: (data: unknown) => void }[] = [
    {
      url: "/data/archivo/pool.ipod.json",
      apply: (data) => {
        if (Array.isArray(data)) hidratarPool(data as Track[]);
      },
    },
    {
      url: "/data/archivo/percentiles.json",
      apply: (data) => {
        if (data && typeof data === "object") hidratarPercentiles(data as Record<string, number[]>);
      },
    },
    ...years.map((year) => ({
      url: `/data/archivo/tracks.${year}.json`,
      apply: (data: unknown) => {
        cacheTracks.set(year, Array.isArray(data) ? (data as Track[]) : []);
      },
    })),
  ];

  await enOleada(jobs, 4, async (job) => {
    const data = await bajar<unknown>(job.url);
    job.apply(data);
  });

  onProgress?.(1);
}
