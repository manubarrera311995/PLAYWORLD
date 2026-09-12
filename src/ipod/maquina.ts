import type { Track } from "../datos/tipos";

export type MoodId = "noche" | "lagrima" | "fiesta" | "calma" | "furia" | "rareza";

export type Pantalla =
  | { kind: "boot" }
  | { kind: "menu" }
  | { kind: "years" }
  | { kind: "moods" }
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

const MENU = ["year", "mood", "random", "mine", "close"] as const;
export type MenuId = (typeof MENU)[number];

export const MOODS: { id: MoodId; label: string; pred: (t: Track) => boolean }[] = [
  { id: "noche", label: "Noche", pred: (t) => (t.dnaPct.oscuridad ?? t.dna.oscuridad) >= 65 },
  { id: "lagrima", label: "Lágrima", pred: (t) => (t.dnaPct.nostalgia ?? t.dna.nostalgia) >= 75 },
  { id: "fiesta", label: "Fiesta", pred: (t) => (t.dnaPct.danceability ?? t.dna.danceability) >= 45 },
  { id: "calma", label: "Calma", pred: (t) => (t.dnaPct.relaxed ?? t.dna.relaxed) >= 70 },
  { id: "furia", label: "Furia", pred: (t) => (t.dnaPct.aggressive ?? t.dna.aggressive) >= 60 },
  { id: "rareza", label: "Rareza", pred: (t) => (t.dnaPct.spectralFlatness ?? t.dna.spectralFlatness) >= 40 },
];

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

export function itemsVisibles(e: EstadoIpod, _pool: Track[], anios: number[]): string[] | Track[] {
  const v = visible(e);
  if (v.kind === "menu") return [...MENU];
  if (v.kind === "years") return anios.map(String);
  if (v.kind === "moods") return MOODS.map((m) => m.label);
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

export function contarItems(e: EstadoIpod, _pool: Track[], anios: number[]): number {
  const v = top(e);
  if (v.kind === "boot") return 1;
  if (v.kind === "menu") return MENU.length;
  if (v.kind === "years") return anios.length;
  if (v.kind === "moods") return MOODS.length;
  if (v.kind === "lista") return v.tracks.length;
  if (v.kind === "miIpod") return e.seleccion.length;
  if (v.kind === "cancion") return 1;
  return 1;
}

function selectMenu(e: EstadoIpod, pool: Track[], anios: number[], yearHint: number | null): EstadoIpod {
  const id = MENU[e.cursor];
  if (id === "year") {
    const years = anios.length ? anios : [...new Set(pool.map((t) => t.year))].sort((a, b) => a - b);
    const idx = yearHint != null ? Math.max(0, years.indexOf(yearHint)) : 0;
    return conResalte({ ...push(e, { kind: "years" }), cursor: idx });
  }
  if (id === "mood") return conResalte(push(e, { kind: "moods" }));
  if (id === "random") {
    if (!pool.length) return e;
    const track = pool[Math.floor(Math.random() * pool.length)];
    return conResalte(push(e, { kind: "cancion", track }));
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
  ctx: { pool: Track[]; anios: number[]; yearHint: number | null },
): EstadoIpod {
  if (e.cerrado) return e;
  const { pool, anios, yearHint } = ctx;
  const v = top(e);
  const n = contarItems(e, pool, anios);

  if (entrada.tipo === "paso") {
    if (v.kind === "boot" || v.kind === "cancion") return e;
    return conResalte({ ...e, cursor: wrap(e.cursor + entrada.delta, n) });
  }

  if (entrada.tipo === "saltar") {
    if (v.kind === "boot" || v.kind === "cancion") return e;
    return conResalte({ ...e, cursor: wrap(entrada.a, n) });
  }

  if (entrada.tipo === "back") {
    if (v.kind === "boot") return e;
    if (v.kind === "menu") return e;
    return conResalte(pop(e));
  }

  if (entrada.tipo === "select") {
    if (v.kind === "boot") return conResalte({ ...e, pila: [{ kind: "menu" }], cursor: 0 });
    if (v.kind === "menu") return selectMenu(e, pool, anios, yearHint);
    if (v.kind === "years") {
      const year = anios[e.cursor];
      const tracks = pool.filter((t) => t.year === year);
      return conResalte(push(e, { kind: "lista", titulo: String(year), tracks }));
    }
    if (v.kind === "moods") {
      const mood = MOODS[e.cursor];
      const tracks = pool.filter(mood.pred);
      return conResalte(push(e, { kind: "lista", titulo: mood.label, tracks }));
    }
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

export function menuLabel(id: MenuId, n: number): string {
  if (id === "year") return "Por año";
  if (id === "mood") return "Por mood";
  if (id === "random") return "Al azar";
  if (id === "mine") return `Mi iPod (${n}/5)`;
  return "Cerrar el iPod";
}

export function menuDisabled(id: MenuId, n: number): boolean {
  return id === "close" && n < CAPACIDAD;
}
