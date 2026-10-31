import type { RutaParsed } from "./director/router";

export const PARADAS = [
  { id: "home", nombre: "Home" },
  { id: "primera", nombre: "Mi primera vez" },
  { id: "fila", nombre: "La fila" },
  { id: "anio", nombre: "El año" },
  { id: "cartel", nombre: "El cartel" },
  { id: "ipod", nombre: "Tu iPod" },
  { id: "alma", nombre: "Tu alma" },
  { id: "mapa", nombre: "Cartografía" },
] as const;

export type IdParada = (typeof PARADAS)[number]["id"];

const ESCENA_PARADA: Record<RutaParsed["name"], IdParada> = {
  home: "home",
  hook: "fila",
  archivo: "anio",
  edicion: "cartel",
  ipod: "ipod",
  creacion: "alma",
  colectiva: "mapa",
};

export type EstadoParada = "pasada" | "actual" | "futura";

export type ItemParada = {
  id: IdParada;
  nombre: string;
  estado: EstadoParada;
  href: string | null;
};

export type VistaParadas = {
  items: ItemParada[];
  avance: number;
};

export function anioDeParadas(
  ruta: RutaParsed,
  rec: { yearHint: number | null; edicionAbierta: number | null },
): number | null {
  if (ruta.name === "edicion") return ruta.year;
  if (ruta.name === "archivo" && ruta.year != null) return ruta.year;
  return rec.edicionAbierta ?? rec.yearHint;
}

function hrefDe(id: IdParada, anio: number | null, tieneAlma: boolean): string | null {
  if (id === "home") return "/";
  if (id === "primera") return "/#pregunta";
  if (id === "fila") return "/hook";
  if (id === "anio") return anio != null ? `/archivo?y=${anio}` : "/archivo";
  if (id === "cartel") return anio != null ? `/edicion/${anio}` : null;
  if (id === "ipod") return "/ipod";
  if (id === "alma") return tieneAlma ? "/creacion" : null;
  if (id === "mapa") return "/colectiva";
  return null;
}

/**
 * El título del home se va entre ~3% y ~15% del scroll. «Mi primera vez»
 * entra justo después. El cruce de la barra cubre esa cesión, no un corte.
 */
export const CRUCE_HOME = { desde: 0.05, hasta: 0.19 } as const;

/** 0 en el título, 1 cuando «Mi primera vez» ya ocupó la barra. */
export function cruceSuave(
  progress: number,
  desde = CRUCE_HOME.desde,
  hasta = CRUCE_HOME.hasta,
): number {
  const span = hasta - desde;
  if (span <= 0) return progress >= hasta ? 1 : 0;
  const x = Math.min(1, Math.max(0, (progress - desde) / span));
  return x * x * (3 - 2 * x);
}

/**
 * «Home» se apaga y «Mi primera vez» entra después.
 * Cada fundido ocupa casi la mitad del cruce. Solo se rozan cuando
 * las dos ya están casi apagadas, así no se leen como un nombre roto
 * ni desaparecen de golpe.
 */
export function velosCruce(cruce: number): { sale: number; entra: number } {
  const suave = (t: number) => {
    const x = Math.min(1, Math.max(0, t));
    return x * x * (3 - 2 * x);
  };
  return {
    sale: 1 - suave((cruce - 0.08) / 0.46),
    entra: suave((cruce - 0.46) / 0.46),
  };
}

/** En el home la barra sigue el cruce. En el resto de escenas, el paso discreto. */
export function avanceDibujado(
  escena: RutaParsed["name"],
  avance: number,
  cruce: number,
): number {
  if (escena !== "home") return avance;
  const tramos = Math.max(PARADAS.length - 1, 1);
  return Math.min(1, Math.max(0, cruce)) / tramos;
}

export function vistaParadas(
  escena: RutaParsed["name"],
  anio: number | null,
  tieneAlma: boolean,
  enPregunta = false,
  flujoCompleto = false,
): VistaParadas {
  const idActual = escena === "home" && enPregunta ? "primera" : ESCENA_PARADA[escena];
  const actual = PARADAS.findIndex((p) => p.id === idActual);
  const items = PARADAS.map((p, i): ItemParada => {
    const estado: EstadoParada = i < actual ? "pasada" : i === actual ? "actual" : "futura";
    // «Mi primera vez» es un tramo del home, no una escena posterior.
    // Desde el título se puede saltar ahí sin abrir el resto del recorrido.
    const visitable =
      estado === "pasada" ||
      (estado === "futura" && (flujoCompleto || p.id === "primera"));
    return {
      id: p.id,
      nombre: p.nombre,
      estado,
      href: visitable ? hrefDe(p.id, anio, tieneAlma) : null,
    };
  });
  const tramos = Math.max(PARADAS.length - 1, 1);
  return { items, avance: actual / tramos };
}
