import { clamp, hash } from "./ficha";

export const VIEW_H = 640;
export const COL_MIN = 12;
export const PAD = { left: 52, right: 16, top: 18, bottom: 118 } as const;

export type CancionActo = { id: string; v: number };
export type ActoEntrada = {
  prefix: string;
  artist: string;
  center: number;
  songs: CancionActo[];
};
export type Marca = { id: string; v: number; x: number; y: number };
export type Columna = {
  prefix: string;
  artist: string;
  n: number;
  center: number;
  x: number;
  y: number;
  songs: Marca[];
};
export type GeoActos = {
  width: number;
  height: number;
  col: number;
  plotH: number;
  dense: boolean;
};

export function plotH(): number {
  return VIEW_H - PAD.top - PAD.bottom;
}

export function geometria(n: number, containerW: number): GeoActos {
  const inner = Math.max(0, containerW - PAD.left - PAD.right);
  const count = Math.max(n, 1);
  const col = Math.max(COL_MIN, inner / count);
  const width = Math.max(containerW, PAD.left + PAD.right + col * count);
  return {
    width,
    height: VIEW_H,
    col,
    plotH: plotH(),
    dense: col < 30,
  };
}

export function xDe(index: number, col: number): number {
  return PAD.left + (index + 0.5) * col;
}

export function yDe(value: number): number {
  return PAD.top + (1 - clamp(value) / 100) * plotH();
}

export function jitterX(id: string, col: number): number {
  const t = (hash(id) % 1000) / 1000 - 0.5;
  return t * Math.min(col * 0.52, 9);
}

export function columnasDe(acts: readonly ActoEntrada[], containerW: number): { geo: GeoActos; cols: Columna[] } {
  const geo = geometria(acts.length, containerW);
  const cols = acts.map((act, index) => {
    const x = xDe(index, geo.col);
    return {
      prefix: act.prefix,
      artist: act.artist,
      n: act.songs.length,
      center: act.center,
      x,
      y: yDe(act.center),
      songs: act.songs.map((song) => ({
        id: song.id,
        v: song.v,
        x: x + jitterX(song.id, geo.col),
        y: yDe(song.v),
      })),
    };
  });
  return { geo, cols };
}
