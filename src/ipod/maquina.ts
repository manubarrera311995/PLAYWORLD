import type { Track } from "../datos/tipos";

export type Pantalla =
  | { kind: "boot" }
  | { kind: "menu" }
  | { kind: "lista"; titulo: string; tracks: Track[] }
  | { kind: "cancion"; track: Track }
  | { kind: "miIpod" };

export type EntradaIpod =
  | { tipo: "paso"; delta: 1 | -1 }
  | { tipo: "select" }
  | { tipo: "back" }
  | { tipo: "saltar"; a: number };

export type EstadoIpod = {
  pila: Pantalla[];
  cursor: number;
  seleccion: Track[];
  capacidad: 5;
  resaltada: Track | null;
  alias: string;
  cerrado: boolean;
};

export const CAPACIDAD = 5;

export const MENU = ["songs", "mine", "close"] as const;
export type MenuId = (typeof MENU)[number];

export function estadoInicial(): EstadoIpod {
  return {
    pila: [{ kind: "boot" }],
    cursor: 0,
    seleccion: [],
    capacidad: CAPACIDAD,
    resaltada: null,
    alias: "",
    cerrado: false,
  };
}

export function visible(e: EstadoIpod): Pantalla {
  return e.pila[e.pila.length - 1] ?? { kind: "boot" };
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

function listaDelAnio(pool: Track[], yearHint: number | null): Pantalla {
  return {
    kind: "lista",
    titulo: yearHint != null ? String(yearHint) : "Canciones",
    tracks: tracksDelAnio(pool, yearHint),
  };
}

export function itemsVisibles(e: EstadoIpod): string[] | Track[] {
  const v = visible(e);
  if (v.kind === "menu") return [...MENU];
  if (v.kind === "lista") return v.tracks;
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

function push(e: EstadoIpod, p: Pantalla): EstadoIpod {
  const pila = [...e.pila, p].slice(-4);
  return { ...e, pila, cursor: 0 };
}

function pop(e: EstadoIpod): EstadoIpod {
  if (e.pila.length <= 1) return e;
  const pila = e.pila.slice(0, -1);
  return { ...e, pila, cursor: 0 };
}

function resaltarDe(e: EstadoIpod): Track | null {
  const v = top(e);
  if (v.kind === "cancion") return v.track;
  if (v.kind === "lista") return v.tracks[e.cursor] ?? null;
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
  if (v.kind === "lista") return v.tracks.length;
  if (v.kind === "miIpod") return e.seleccion.length;
  if (v.kind === "cancion") return 1;
  return 1;
}

function selectMenu(e: EstadoIpod, pool: Track[], yearHint: number | null): EstadoIpod {
  const id = MENU[e.cursor];
  if (id === "songs") return conResalte(push(e, listaDelAnio(pool, yearHint)));
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
  const n = contarItems(e);

  if (entrada.tipo === "paso") {
    if (v.kind === "boot" || v.kind === "cancion") return e;
    return conResalte({ ...e, cursor: wrap(e.cursor + entrada.delta, n) });
  }

  if (entrada.tipo === "saltar") {
    if (v.kind === "boot" || v.kind === "cancion") return e;
    return conResalte({ ...e, cursor: wrap(entrada.a, n) });
  }

  if (entrada.tipo === "back") {
    if (v.kind === "boot" || v.kind === "menu") return e;
    if (v.kind === "lista" && e.pila.length === 1) {
      return conResalte({ ...e, pila: [{ kind: "menu" }], cursor: 0 });
    }
    return conResalte(pop(e));
  }

  if (entrada.tipo === "select") {
    if (v.kind === "boot") {
      return conResalte({ ...e, pila: [listaDelAnio(pool, yearHint)], cursor: 0 });
    }
    if (v.kind === "menu") return selectMenu(e, pool, yearHint);
    if (v.kind === "lista") {
      const track = v.tracks[e.cursor];
      if (!track) return e;
      return conResalte(push(e, { kind: "cancion", track }));
    }
    if (v.kind === "miIpod") {
      const track = e.seleccion[e.cursor];
      if (!track) return e;
      return conResalte(push(e, { kind: "cancion", track }));
    }
    if (v.kind === "cancion") {
      return meterOQuitar(e, v.track);
    }
  }

  return e;
}

export function meterOQuitar(e: EstadoIpod, track: Track): EstadoIpod {
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
  if (id === "mine") return `Mi iPod (${n}/5)`;
  return "Cerrar el iPod";
}

export function menuDisabled(id: MenuId, n: number): boolean {
  return id === "close" && n < CAPACIDAD;
}
