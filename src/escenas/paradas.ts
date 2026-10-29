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
  return null;
}

export function vistaParadas(
  escena: RutaParsed["name"],
  anio: number | null,
  tieneAlma: boolean,
  enPregunta = false,
): VistaParadas {
  const idActual = escena === "home" && enPregunta ? "primera" : ESCENA_PARADA[escena];
  const actual = PARADAS.findIndex((p) => p.id === idActual);
  const items = PARADAS.map((p, i): ItemParada => {
    const estado: EstadoParada = i < actual ? "pasada" : i === actual ? "actual" : "futura";
    return {
      id: p.id,
      nombre: p.nombre,
      estado,
      href: estado === "pasada" ? hrefDe(p.id, anio, tieneAlma) : null,
    };
  });
  const tramos = Math.max(PARADAS.length - 1, 1);
  return { items, avance: actual / tramos };
}
