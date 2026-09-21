import { clamp, hash, quantile } from "./ficha";

/**
 * Actos en filas: el acto es la categoría (eje Y, una fila cada uno) y la
 * métrica corre en X. Los nombres van planos a la izquierda, sin rotar ni
 * truncar a 14 caracteres, y el lienzo crece hacia abajo con el scroll de la
 * página en vez de abrir un scroll horizontal propio.
 */
export const ROW_H = 26;
export const ROW_H_DENSE = 20;
export const ROW_H_TIGHT = 17;
export const DENSE_FROM = 30;
export const TIGHT_FROM = 60;
export const PAD = { top: 58, bottom: 46, right: 56 } as const;

/** Diferencia mínima, en puntos, para dibujar el segundo centro. */
export const REF_EPS = 3;

/**
 * Un artista está en el clima del año si su mediana cae a esta distancia o
 * menos de la mediana del año. Diez puntos es una décima parte de la escala.
 */
export const SHARE_EPS = 10;

export type CancionActo = { id: string; v: number };
export type ActoEntrada = {
  prefix: string;
  artist: string;
  center: number;
  songs: CancionActo[];
};
export type Marca = { id: string; v: number; x: number; y: number };
export type Fila = {
  prefix: string;
  artist: string;
  n: number;
  center: number;
  y: number;
  cx: number;
  /**
   * Mitad central del acto (p25–p75), no el recorrido completo: con mín–máx
   * casi todas las filas cruzan el lienzo de lado a lado y el gráfico se
   * vuelve una parrilla de rayas que no distingue a nadie.
   */
  lo: number;
  hi: number;
  thin: boolean;
  songs: Marca[];
};
export type GeoActos = {
  width: number;
  height: number;
  left: number;
  plotW: number;
  rowH: number;
  top: number;
  bottom: number;
  maxChars: number;
};

/** Con pocas canciones la mediana del acto es casi el dato crudo. */
export const THIN_UNDER = 3;

export function geometria(n: number, containerW: number): GeoActos {
  const width = Math.max(320, Math.round(containerW));
  const left = Math.round(Math.min(248, Math.max(96, width * 0.24)));
  const plotW = Math.max(140, width - left - PAD.right);
  const count = Math.max(n, 1);
  const rowH = n > TIGHT_FROM ? ROW_H_TIGHT : n > DENSE_FROM ? ROW_H_DENSE : ROW_H;
  return {
    width,
    height: PAD.top + count * rowH + PAD.bottom,
    left,
    plotW,
    rowH,
    top: PAD.top,
    bottom: PAD.top + count * rowH,
    maxChars: Math.max(8, Math.floor((left - 52) / 6)),
  };
}

export function xDe(value: number, geo: GeoActos): number {
  return geo.left + (clamp(value) / 100) * geo.plotW;
}

export function yDe(index: number, geo: GeoActos): number {
  return geo.top + (index + 0.5) * geo.rowH;
}

export function jitterY(id: string, rowH: number): number {
  const t = (hash(id) % 1000) / 1000 - 0.5;
  return t * Math.min(rowH * 0.52, 11);
}

/**
 * Reparto del clima: cuántos artistas tienen su mediana cerca del centro del
 * año. Es la cifra que responde la pregunta del capítulo —si el carácter lo
 * sostiene todo el cartel o unos pocos— y se cuenta con una sola resta, sin
 * resumir dos veces los mismos datos.
 */
export type Reparto = { n: number; total: number };

export function repartoDe(centers: readonly number[], yearCenter: number | null): Reparto | null {
  if (!centers.length || yearCenter == null) return null;
  const n = centers.filter((center) => Math.abs(center - yearCenter) <= SHARE_EPS).length;
  return { n, total: centers.length };
}

export function filasDe(acts: readonly ActoEntrada[], containerW: number): { geo: GeoActos; rows: Fila[] } {
  const geo = geometria(acts.length, containerW);
  const rows = acts.map((act, index) => {
    const y = yDe(index, geo);
    const vs = act.songs.map((song) => song.v);
    return {
      prefix: act.prefix,
      artist: act.artist,
      n: act.songs.length,
      center: act.center,
      y,
      cx: xDe(act.center, geo),
      lo: xDe(quantile(vs, 0.25) ?? act.center, geo),
      hi: xDe(quantile(vs, 0.75) ?? act.center, geo),
      thin: act.songs.length < THIN_UNDER,
      songs: act.songs.map((song) => ({
        id: song.id,
        v: song.v,
        x: xDe(song.v, geo),
        y: y + jitterY(song.id, geo.rowH),
      })),
    };
  });
  return { geo, rows };
}
