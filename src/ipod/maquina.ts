import type { Track } from "../datos/tipos";
import { resolverAlias } from "./alias";

export type Pantalla =
  | { kind: "boot" }
  | { kind: "menu" }
  | { kind: "lista"; titulo: string; tracks: Track[]; q: string }
  | { kind: "artistas"; nombres: string[]; q: string }
  | { kind: "cancion"; track: Track }
  | { kind: "miIpod" };

export type EntradaIpod =
  | { tipo: "paso"; delta: 1 | -1 }
  | { tipo: "select"; alias?: string }
  | { tipo: "play" }
  | { tipo: "back" }
  | { tipo: "saltar"; a: number }
  | { tipo: "filtrar"; q: string };

export type EstadoIpod = {
  pila: Pantalla[];
  cursor: number;
  cursores: number[];
  seleccion: Track[];
  capacidad: 5;
  resaltada: Track | null;
  alias: string;
  cerrado: boolean;
  /** Selección ya guardada: se puede mirar, no se puede cambiar. */
  sellado: boolean;
};

export const CAPACIDAD = 5;

export const MENU = ["songs", "artists", "mine", "close"] as const;
export type MenuId = (typeof MENU)[number];

export function estadoInicial(): EstadoIpod {
  return {
    pila: [{ kind: "boot" }],
    cursor: 0,
    cursores: [0],
    seleccion: [],
    capacidad: CAPACIDAD,
    resaltada: null,
    alias: "",
    cerrado: false,
    sellado: false,
  };
}

/** Reabre un iPod ya cerrado: el nombre y las canciones, sin el formulario. */
export function estadoSellado(alias: string, tracks: Track[]): EstadoIpod {
  const seleccion = tracks.slice(0, CAPACIDAD);
  return {
    pila: [{ kind: "menu" }, { kind: "miIpod" }],
    cursor: 0,
    cursores: [MENU.indexOf("mine"), 0],
    seleccion,
    capacidad: CAPACIDAD,
    resaltada: seleccion[0] ?? null,
    alias,
    cerrado: false,
    sellado: true,
  };
}

export function visible(e: EstadoIpod): Pantalla {
  return e.pila[e.pila.length - 1] ?? { kind: "boot" };
}

export function tituloDe(p: Pantalla): string {
  if (p.kind === "boot") return "PLAYWORLD";
  if (p.kind === "menu") return "iPod";
  if (p.kind === "lista") return p.titulo;
  if (p.kind === "artistas") return "Artistas";
  if (p.kind === "miIpod") return "Mi iPod";
  return p.track.track;
}

/** Nombre de la pantalla anterior. Null en el arranque y en el menú. */
export function atrasDe(e: EstadoIpod): string | null {
  const v = visible(e);
  if (v.kind === "boot" || v.kind === "menu") return null;
  if (e.pila.length >= 2) return tituloDe(e.pila[e.pila.length - 2]);
  return "iPod";
}

export function tracksDelAnio(pool: Track[], yearHint: number | null): Track[] {
  if (yearHint == null) return [];
  return pool
    .filter((t) => t.year === yearHint)
    .sort((a, b) => {
      const artist = a.artist.localeCompare(b.artist, "es", { sensitivity: "base" });
      if (artist !== 0) return artist;
      return a.track.localeCompare(b.track, "es", { sensitivity: "base" });
    });
}

/** Agrupa el año ya ordenado: un nombre por artista, en ese mismo orden. */
export function artistasDelAnio(pool: Track[], yearHint: number | null): string[] {
  const nombres: string[] = [];
  for (const t of tracksDelAnio(pool, yearHint)) {
    if (nombres.includes(t.artist)) continue;
    nombres.push(t.artist);
  }
  return nombres;
}

function plano(s: string): string {
  return s.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function tracksVisibles(p: { tracks: Track[]; q: string }): Track[] {
  const n = plano(p.q.trim());
  if (!n) return p.tracks;
  return p.tracks.filter((t) => plano(t.track).includes(n) || plano(t.artist).includes(n));
}

export function artistasVisibles(p: { nombres: string[]; q: string }): string[] {
  const n = plano(p.q.trim());
  if (!n) return p.nombres;
  return p.nombres.filter((nombre) => plano(nombre).includes(n));
}

function listaDelAnio(pool: Track[], yearHint: number | null): Pantalla {
  return {
    kind: "lista",
    titulo: yearHint != null ? String(yearHint) : "Canciones",
    tracks: tracksDelAnio(pool, yearHint),
    q: "",
  };
}

function pantallaArtistas(pool: Track[], yearHint: number | null): Pantalla {
  return { kind: "artistas", nombres: artistasDelAnio(pool, yearHint), q: "" };
}

export function itemsVisibles(e: EstadoIpod): string[] | Track[] {
  const v = visible(e);
  if (v.kind === "menu") return [...MENU];
  if (v.kind === "lista") return tracksVisibles(v);
  if (v.kind === "artistas") return artistasVisibles(v);
  if (v.kind === "miIpod") return e.seleccion;
  if (v.kind === "cancion") return [v.track];
  return [];
}

function wrap(i: number, n: number): number {
  if (n <= 0) return 0;
  return ((i % n) + n) % n;
}

function top(e: EstadoIpod): Pantalla {
  return e.pila[e.pila.length - 1];
}

function conCursor(e: EstadoIpod, cursor: number): EstadoIpod {
  const cursores = e.cursores.length > 0 ? [...e.cursores.slice(0, -1), cursor] : [cursor];
  return { ...e, cursor, cursores };
}

function push(e: EstadoIpod, p: Pantalla): EstadoIpod {
  const dejado = conCursor(e, e.cursor);
  const pila = [...dejado.pila, p].slice(-4);
  const cursores = [...dejado.cursores, 0].slice(-4);
  return { ...dejado, pila, cursores, cursor: 0 };
}

function fijarCursor(e: EstadoIpod): EstadoIpod {
  const n = contarItems(e);
  const cursor = n <= 0 ? 0 : Math.min(e.cursor, n - 1);
  return conCursor(e, cursor);
}

function pop(e: EstadoIpod): EstadoIpod {
  if (e.pila.length <= 1) return e;
  const pila = e.pila.slice(0, -1);
  const cursores = e.cursores.slice(0, pila.length);
  const cursor = cursores[cursores.length - 1] ?? 0;
  return fijarCursor({ ...e, pila, cursores, cursor });
}

function irA(e: EstadoIpod, p: Pantalla): EstadoIpod {
  return { ...e, pila: [p], cursores: [0], cursor: 0 };
}

function resaltarDe(e: EstadoIpod): Track | null {
  const v = top(e);
  if (v.kind === "cancion") return v.track;
  if (v.kind === "lista") return tracksVisibles(v)[e.cursor] ?? null;
  if (v.kind === "miIpod") return e.seleccion[e.cursor] ?? null;
  return null;
}

function conResalte(e: EstadoIpod): EstadoIpod {
  return { ...e, resaltada: resaltarDe(e) };
}

export function contarItems(e: EstadoIpod): number {
  const v = top(e);
  if (v.kind === "boot") return 1;
  if (v.kind === "menu") return MENU.length;
  if (v.kind === "lista") return tracksVisibles(v).length;
  if (v.kind === "artistas") return artistasVisibles(v).length;
  if (v.kind === "miIpod") return e.seleccion.length;
  if (v.kind === "cancion") return 1;
  return 1;
}

function selectMenu(e: EstadoIpod, pool: Track[], yearHint: number | null): EstadoIpod {
  const id = MENU[e.cursor];
  if (id === "songs" || id === "artists") {
    if (e.sellado) return e;
    const pantalla = id === "songs" ? listaDelAnio(pool, yearHint) : pantallaArtistas(pool, yearHint);
    return conResalte(push(e, pantalla));
  }
  if (id === "mine") return conResalte(push(e, { kind: "miIpod" }));
  if (id === "close") {
    if (e.seleccion.length < e.capacidad) return e;
    return { ...e, cerrado: true };
  }
  return e;
}

export function aplicar(
  e: EstadoIpod,
  entrada: EntradaIpod,
  ctx: { pool: Track[]; yearHint: number | null },
): EstadoIpod {
  if (e.cerrado) return e;
  const { pool, yearHint } = ctx;
  const v = top(e);

  if (entrada.tipo === "filtrar") return conFiltro(e, entrada.q);

  const n = contarItems(e);

  if (entrada.tipo === "paso") {
    if (v.kind === "boot" || v.kind === "cancion") return e;
    return conResalte(conCursor(e, wrap(e.cursor + entrada.delta, n)));
  }

  if (entrada.tipo === "saltar") {
    if (v.kind === "boot" || v.kind === "cancion") return e;
    return conResalte(conCursor(e, wrap(entrada.a, n)));
  }

  if (entrada.tipo === "back") {
    if (v.kind === "boot" || v.kind === "menu") return e;
    if (v.kind === "lista" && e.pila.length === 1) {
      return conResalte(irA(e, { kind: "menu" }));
    }
    return conResalte(pop(e));
  }

  if (entrada.tipo === "play") {
    if (v.kind === "cancion") return e;
    return aplicar(e, { tipo: "select" }, ctx);
  }

  if (entrada.tipo === "select") {
    if (v.kind === "boot") {
      const alias = resolverAlias(entrada.alias ?? e.alias);
      return conResalte(irA({ ...e, alias }, { kind: "menu" }));
    }
    if (v.kind === "menu") return selectMenu(e, pool, yearHint);
    if (v.kind === "lista") {
      const track = tracksVisibles(v)[e.cursor];
      if (!track) return e;
      return conResalte(push(e, { kind: "cancion", track }));
    }
    if (v.kind === "artistas") {
      const nombre = artistasVisibles(v)[e.cursor];
      if (!nombre) return e;
      const tracks = tracksDelAnio(pool, yearHint).filter((t) => t.artist === nombre);
      return conResalte(push(e, { kind: "lista", titulo: nombre, tracks, q: "" }));
    }
    if (v.kind === "miIpod") {
      const track = e.seleccion[e.cursor];
      if (!track) return e;
      return conResalte(push(e, { kind: "cancion", track }));
    }
    if (v.kind === "cancion") return meterYSeguir(e, v.track);
  }

  return e;
}

function conFiltro(e: EstadoIpod, q: string): EstadoIpod {
  const v = top(e);
  if (v.kind !== "lista" && v.kind !== "artistas") return e;
  const actual = v.kind === "lista" ? tracksVisibles(v)[e.cursor] : artistasVisibles(v)[e.cursor];
  const pantalla = { ...v, q };
  const next = { ...e, pila: [...e.pila.slice(0, -1), pantalla] };
  return conResalte(conCursor(next, indiceTrasFiltro(pantalla, actual)));
}

function indiceTrasFiltro(p: Pantalla, actual: Track | string | undefined): number {
  if (p.kind === "lista") {
    const lista = tracksVisibles(p);
    if (!lista.length || !actual || typeof actual === "string") return 0;
    const i = lista.findIndex((t) => t.id === actual.id);
    return i >= 0 ? i : 0;
  }
  if (p.kind === "artistas") {
    const lista = artistasVisibles(p);
    if (!lista.length || typeof actual !== "string") return 0;
    const i = lista.indexOf(actual);
    return i >= 0 ? i : 0;
  }
  return 0;
}

function meterYSeguir(e: EstadoIpod, track: Track): EstadoIpod {
  if (e.sellado) return e;
  const has = e.seleccion.some((t) => t.id === track.id);
  if (has || e.seleccion.length >= e.capacidad) return e;
  const metida = { ...e, seleccion: [...e.seleccion, track] };
  return conResalte(pop(metida));
}

export function meterOQuitar(e: EstadoIpod, track: Track): EstadoIpod {
  if (e.sellado) return e;
  const has = e.seleccion.some((t) => t.id === track.id);
  if (has) {
    return { ...e, seleccion: e.seleccion.filter((t) => t.id !== track.id) };
  }
  if (e.seleccion.length >= e.capacidad) return e;
  return { ...e, seleccion: [...e.seleccion, track] };
}

export function enSeleccion(e: EstadoIpod, id: string): boolean {
  return e.seleccion.some((t) => t.id === id);
}

export function menuLabel(id: MenuId, n: number, year: number | null): string {
  if (id === "songs") return year != null ? `Canciones de ${year}` : "Canciones";
  if (id === "artists") return "Artistas";
  if (id === "mine") return `Mi iPod (${n}/5)`;
  return "Cerrar el iPod";
}

export function menuDisabled(id: MenuId, n: number, sellado = false): boolean {
  if ((id === "songs" || id === "artists") && sellado) return true;
  return id === "close" && n < CAPACIDAD;
}
