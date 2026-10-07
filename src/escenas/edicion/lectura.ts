import type { DnaKey, Track } from "../../datos/tipos";
import { SHARE_EPS, THIN_UNDER, repartoDe, type Reparto } from "./actos";
import { dnaNum, groupActs, median, moodStats, values } from "./ficha";

/**
 * Rasgos en escala 0–100. El tempo queda fuera: se mide en bpm, no en esta escala.
 */
export const RASGO_KEYS = [
  "energy",
  "relaxed",
  "happy",
  "sad",
  "aggressive",
  "nostalgia",
  "oscuridad",
  "danceability",
  "engagement",
  "approachability",
  "spectralFlatness",
] as const satisfies readonly DnaKey[];

export type RasgoKey = (typeof RASGO_KEYS)[number];

export type RasgoFila = {
  key: RasgoKey;
  median: number;
};

export type Cubeta = { desde: number; hasta: number; n: number };

export type Corte = { bajo: number; alto: number };

export type CancionFila = {
  id: string;
  title: string;
  v: number;
  scale: string;
  note: string;
  tempo: number | null;
  genre: string;
};

export type FilaArtista = {
  prefix: string;
  artist: string;
  n: number;
  center: number;
  cerca: boolean;
  thin: boolean;
  songs: CancionFila[];
};

export type LecturaActos = {
  filas: FilaArtista[];
  year: number | null;
  reparto: Reparto | null;
};

export type FormaLectura = {
  cubetas: Cubeta[];
  corte: Corte;
  total: number;
  median: number;
  p25: number;
  p75: number;
  lowArtist: string;
  highArtist: string;
};

export type TempoLectura = { median: number; p25: number; p75: number };

export type NotaConteo = { note: string; n: number };

const TRAMOS = [
  [0, 19],
  [20, 39],
  [40, 59],
  [60, 79],
  [80, 100],
] as const;

/**
 * Cinco tramos fijos. El borde de cada tramo cae en el siguiente
 * y 100 se queda en el último, así cada canción entra una sola vez.
 */
export function cubetasDe(nums: readonly number[]): Cubeta[] {
  const cubetas = TRAMOS.map(([desde, hasta]) => ({ desde, hasta, n: 0 }));
  for (const value of nums) {
    const index = value >= 80 ? 4 : value >= 60 ? 3 : value >= 40 ? 2 : value >= 20 ? 1 : 0;
    cubetas[index]!.n += 1;
  }
  return cubetas;
}

/** Por debajo de 50, o de 50 en adelante. El 50 cuenta arriba, igual que el polo intenso. */
export function corteDe(nums: readonly number[], umbral = 50): Corte {
  let bajo = 0;
  let alto = 0;
  for (const value of nums) {
    if (value >= umbral) alto += 1;
    else bajo += 1;
  }
  return { bajo, alto };
}

export function rasgosDe(tracks: Track[]): RasgoFila[] {
  const filas: RasgoFila[] = [];
  for (const key of RASGO_KEYS) {
    const stats = moodStats(tracks, key);
    if (!stats) continue;
    filas.push({ key, median: stats.median });
  }
  return filas;
}

export function tempoDe(tracks: Track[]): TempoLectura | null {
  const stats = moodStats(tracks, "tempo");
  if (!stats) return null;
  return { median: stats.median, p25: stats.p25, p75: stats.p75 };
}

export function tonalidadesDe(tracks: Track[]): NotaConteo[] {
  const counts = new Map<string, number>();
  for (const track of tracks) {
    const note = track.dna.keyNote?.trim();
    if (!note) continue;
    counts.set(note, (counts.get(note) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
    .map(([note, n]) => ({ note, n }));
}

export function filasArtistas(tracks: Track[], key: DnaKey): LecturaActos {
  const year = median(values(tracks, key));
  const filas = groupActs(tracks)
    .flatMap((act) => {
      const songs = act.songs.flatMap((song) => {
        const v = dnaNum(song, key);
        if (v == null) return [];
        const tempo = song.dna.tempo;
        return [
          {
            id: song.id,
            title: song.track || song.id,
            v,
            scale: song.dna.scale,
            note: song.dna.keyNote,
            tempo: typeof tempo === "number" && Number.isFinite(tempo) ? tempo : null,
            genre: song.genre?.trim() ?? "",
          },
        ];
      });
      if (!songs.length) return [];
      const center = median(songs.map((song) => song.v));
      if (center == null) return [];
      songs.sort((a, b) => b.v - a.v || a.title.localeCompare(b.title, "es"));
      return [
        {
          prefix: act.prefix,
          artist: act.artist,
          n: songs.length,
          center,
          cerca: year != null && Math.abs(center - year) <= SHARE_EPS,
          thin: songs.length < THIN_UNDER,
          songs,
        },
      ];
    })
    .sort((a, b) => b.center - a.center || a.artist.localeCompare(b.artist, "es"));

  return {
    filas,
    year,
    reparto: repartoDe(
      filas.map((fila) => fila.center),
      year,
    ),
  };
}

export function formaDe(tracks: Track[], key: DnaKey): FormaLectura | null {
  const stats = moodStats(tracks, key);
  if (!stats) return null;
  const nums = values(tracks, key);
  const cubetas = cubetasDe(nums);
  const { filas } = filasArtistas(tracks, key);
  return {
    cubetas,
    corte: corteDe(nums),
    total: cubetas.reduce((sum, cubeta) => sum + cubeta.n, 0),
    median: stats.median,
    p25: stats.p25,
    p75: stats.p75,
    lowArtist: filas.at(-1)?.artist ?? "",
    highArtist: filas[0]?.artist ?? "",
  };
}
