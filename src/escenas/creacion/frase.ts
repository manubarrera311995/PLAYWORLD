import type { AudioDNA, DnaKey, Track } from "../../datos/tipos";
import { dnaNum, median } from "../edicion/ficha";

const SPECS: { key: DnaKey; dir: "max" | "min"; adjetivo: string }[] = [
  { key: "oscuridad", dir: "max", adjetivo: "oscura" },
  { key: "nostalgia", dir: "max", adjetivo: "nostálgica" },
  { key: "energy", dir: "max", adjetivo: "intensa" },
  { key: "energy", dir: "min", adjetivo: "quieta" },
  { key: "tempo", dir: "max", adjetivo: "rápida" },
];

const ANIO: { key: DnaKey; arriba: string; abajo: string }[] = [
  { key: "oscuridad", arriba: "más oscura", abajo: "menos oscura" },
  { key: "nostalgia", arriba: "más nostálgica", abajo: "menos nostálgica" },
  { key: "energy", arriba: "más intensa", abajo: "más quieta" },
];

const PALABRA = ["cero", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"];

type Candidato = { id: string; holgura: number; adjetivo: string };

function palabra(n: number): string {
  return PALABRA[n] ?? String(n);
}

function capital(texto: string): string {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto;
}

function umbral(key: DnaKey): number {
  return key === "tempo" ? 18 : 8;
}

function ganador(tracks: Track[], spec: (typeof SPECS)[number]): Candidato | null {
  const scored = tracks
    .map((t) => ({ id: t.id, v: dnaNum(t, spec.key) }))
    .filter((x): x is { id: string; v: number } => x.v != null);
  if (scored.length < 3) return null;
  const med = median(scored.map((s) => s.v));
  if (med == null) return null;
  const sorted = [...scored].sort((a, b) => (spec.dir === "max" ? b.v - a.v : a.v - b.v));
  const primero = sorted[0];
  const segundo = sorted[1];
  if (!primero || !segundo || primero.v === segundo.v) return null;
  const gap = Math.abs(primero.v - med);
  const piso = umbral(spec.key);
  if (gap < piso) return null;
  return { id: primero.id, holgura: gap / piso, adjetivo: spec.adjetivo };
}

function candidatosDe(tracks: Track[]): Candidato[] {
  const mejor = new Map<string, Candidato>();
  for (const spec of SPECS) {
    const g = ganador(tracks, spec);
    if (!g) continue;
    const prev = mejor.get(g.id);
    if (!prev || g.holgura > prev.holgura) mejor.set(g.id, g);
  }
  return [...mejor.values()];
}

export function rotulosDe(tracks: Track[]): Record<string, string> {
  return Object.fromEntries(candidatosDe(tracks).map((c) => [c.id, `la más ${c.adjetivo}`]));
}

export function giroDe(id: string): number {
  let value = 0;
  for (const ch of id) value = (value * 33 + ch.charCodeAt(0)) | 0;
  return (Math.abs(value) % 11) - 5;
}

function fraseTonal(tracks: Track[]): string | null {
  const escalas = tracks.map((t) => t.dna.scale).filter((s) => s === "Menor" || s === "Mayor");
  const n = escalas.length;
  if (n < 3) return null;
  const menores = escalas.filter((s) => s === "Menor").length;
  const modo = menores * 2 >= n ? "menor" : "mayor";
  const dom = modo === "menor" ? menores : n - menores;
  if (dom < n - 1 || dom / n < 0.75) return null;
  if (dom === n) return `Las ${palabra(n)} en ${modo}`;
  return `${capital(palabra(dom))} de ${palabra(n)} en ${modo}`;
}

function fraseAnio(
  tracks: Track[],
  year: number | null,
  medianaAnio: Partial<AudioDNA> | null,
): string | null {
  if (year == null || !medianaAnio) return null;
  let mejor: { texto: string; delta: number } | null = null;
  for (const c of ANIO) {
    const delAnio = medianaAnio[c.key];
    if (typeof delAnio !== "number") continue;
    const propia = median(
      tracks.map((t) => dnaNum(t, c.key)).filter((n): n is number => n != null),
    );
    if (propia == null) continue;
    const delta = propia - delAnio;
    if (Math.abs(delta) < 8) continue;
    const texto = delta > 0 ? c.arriba : c.abajo;
    if (!mejor || Math.abs(delta) > mejor.delta) mejor = { texto: `${texto} que ${year}`, delta: Math.abs(delta) };
  }
  return mejor ? capital(mejor.texto) : null;
}

function fraseExtremo(tracks: Track[]): string | null {
  const lista = candidatosDe(tracks);
  if (!lista.length) return null;
  const top = lista.reduce((a, b) => (b.holgura > a.holgura ? b : a));
  const track = tracks.find((t) => t.id === top.id);
  if (!track) return null;
  const de = track.artist ? `, de ${track.artist}` : "";
  return `La más ${top.adjetivo} de las tuyas es ${track.track}${de}`;
}

/** Una sola oración. Si el dato no alcanza para una comparación limpia, no inventa la mitad. */
export function fraseDeSeleccion(
  tracks: Track[],
  year: number | null,
  medianaAnio: Partial<AudioDNA> | null,
): string | null {
  if (!tracks.length) return null;
  const tonal = fraseTonal(tracks);
  const anio = fraseAnio(tracks, year, medianaAnio);
  if (tonal && anio) return `${tonal}, y ${anio.charAt(0).toLowerCase()}${anio.slice(1)}.`;
  if (tonal) return `${tonal}.`;
  if (anio) return `${anio}.`;
  const extremo = fraseExtremo(tracks);
  return extremo ? `${extremo}.` : null;
}
