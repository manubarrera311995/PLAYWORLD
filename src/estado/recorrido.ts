import { writable } from "svelte/store";
import type { AlmaId, Seleccion } from "../datos/tipos";
import type { Rastro } from "../rastros/tipos";

export type Recorrido = {
  yearHint: number | null;
  edicionAbierta: number | null;
  seleccion: Seleccion | null;
  alma: { principal: AlmaId; eco: AlmaId; puntajes: Record<AlmaId, number> } | null;
  rastroPropio: Rastro | null;
};

const KEY = "playworld.recorrido";

const vacio = (): Recorrido => ({
  yearHint: null,
  edicionAbierta: null,
  seleccion: null,
  alma: null,
  rastroPropio: null,
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
