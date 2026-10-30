import { writable } from "svelte/store";
import type { AlmaId, Seleccion } from "../datos/tipos";
import type { Rastro } from "../rastros/tipos";

export type Recorrido = {
  yearHint: number | null;
  edicionAbierta: number | null;
  seleccion: Seleccion | null;
  alma: { principal: AlmaId; eco: AlmaId; puntajes: Record<AlmaId, number> } | null;
  almasFila: AlmaId[] | null;
  rastroPropio: Rastro | null;
  /** Llegó a la cartografía: el recorrido ya se puede recorrer en cualquier orden. */
  flujoCompleto: boolean;
};

const KEY = "playworld.recorrido";

const vacio = (): Recorrido => ({
  yearHint: null,
  edicionAbierta: null,
  seleccion: null,
  alma: null,
  almasFila: null,
  rastroPropio: null,
  flujoCompleto: false,
});

function leer(): Recorrido {
  if (typeof sessionStorage === "undefined") return vacio();
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return vacio();
    return { ...vacio(), ...(JSON.parse(raw) as Recorrido) };
  } catch {
    return vacio();
  }
}

export const recorrido = writable<Recorrido>(leer());

if (typeof sessionStorage !== "undefined") {
  recorrido.subscribe((v) => {
    sessionStorage.setItem(KEY, JSON.stringify(v));
  });
}

export function parcheRecorrido(p: Partial<Recorrido>): void {
  recorrido.update((r) => ({ ...r, ...p }));
}
