import type { Rastro } from "./tipos";

const K_PROPIO = "playworld.rastro";
const K_PEND = "playworld.pendientes";

export function loadPropio(): Rastro | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(K_PROPIO);
    return raw ? (JSON.parse(raw) as Rastro) : null;
  } catch {
    return null;
  }
}

export function savePropio(r: Rastro): void {
  localStorage.setItem(K_PROPIO, JSON.stringify(r));
}

export function loadPendientes(): Rastro[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(K_PEND);
    return raw ? (JSON.parse(raw) as Rastro[]) : [];
  } catch {
    return [];
  }
}

export function savePendiente(r: Rastro): void {
  const all = [...loadPendientes().filter((x) => x.id !== r.id), r];
  localStorage.setItem(K_PEND, JSON.stringify(all));
}

export function clearPendiente(id: string): void {
  localStorage.setItem(K_PEND, JSON.stringify(loadPendientes().filter((x) => x.id !== id)));
}
