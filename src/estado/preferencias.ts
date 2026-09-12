import { writable } from "svelte/store";

export type ModoControl = "rueda" | "toque";

export type Preferencias = {
  mute: boolean;
  modoControl: ModoControl | null;
  reduce: boolean;
};

const KEY = "playworld.preferencias";

function leer(): Preferencias {
  const base: Preferencias = { mute: false, modoControl: null, reduce: false };
  if (typeof localStorage === "undefined") return base;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...base, ...(JSON.parse(raw) as Preferencias) } : base;
  } catch {
    return base;
  }
}

export const preferencias = writable<Preferencias>(leer());

if (typeof localStorage !== "undefined") {
  preferencias.subscribe((v) => localStorage.setItem(KEY, JSON.stringify(v)));
}
