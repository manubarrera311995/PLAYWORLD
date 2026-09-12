import { writable } from "svelte/store";
import type { AlmaId } from "../datos/tipos";
import { localPort } from "./adaptadores/local";
import { semillaPort } from "./adaptadores/semilla";
import { supabaseDisponible, supabasePort } from "./adaptadores/supabase";
import { clearPendiente, loadPendientes, loadPropio, savePendiente, savePropio } from "./sesion";
import type { Rastro, RastroNuevo } from "./tipos";

export type RastrosEstado = {
  items: Rastro[];
  propio: Rastro | null;
  sinSenal: boolean;
};

function dedupe(rows: Rastro[]): Rastro[] {
  const map = new Map<string, Rastro>();
  for (const r of rows) map.set(r.id, r);
  return [...map.values()];
}

export const rastros = writable<RastrosEstado>({
  items: [],
  propio: loadPropio(),
  sinSenal: false,
});

const LISTAR_MS = 4000;

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

export async function hidratar(opts?: { almaId?: AlmaId }): Promise<void> {
  const semilla = await semillaPort.listar(opts);
  const local = await localPort.listar();
  const propio = loadPropio();
  rastros.set({ items: dedupe([...semilla, ...local, ...(propio ? [propio] : [])]), propio, sinSenal: false });

  if (!supabaseDisponible()) {
    rastros.update((s) => ({ ...s, sinSenal: true }));
    return;
  }
  try {
    const remotos = await withTimeout(supabasePort.listar({ limite: 500, almaId: opts?.almaId }), LISTAR_MS);
    rastros.update((s) => ({
      ...s,
      items: dedupe([...s.items, ...remotos]),
      sinSenal: false,
    }));
  } catch {
    rastros.update((s) => ({ ...s, sinSenal: true }));
  }
}

export async function guardar(nuevo: RastroNuevo): Promise<Rastro> {
  const alias = nuevo.alias && nuevo.alias.length <= 12 ? nuevo.alias : null;
  const payload = { ...nuevo, alias };
  let rastro: Rastro;
  try {
    if (!supabaseDisponible()) throw new Error("no supabase");
    rastro = await supabasePort.guardar(payload);
  } catch {
    rastro = await localPort.guardar(payload);
    rastros.update((s) => ({ ...s, sinSenal: true }));
  }
  savePropio(rastro);
  rastros.update((s) => ({
    ...s,
    propio: rastro,
    items: dedupe([...s.items, rastro]),
  }));
  return rastro;
}

export async function reintentarPendientes(): Promise<void> {
  if (!supabaseDisponible()) return;
  for (const p of loadPendientes()) {
    try {
      const saved = await supabasePort.guardar({
        alias: p.alias,
        almaId: p.almaId,
        trackIds: p.trackIds,
        yearHint: p.yearHint,
      });
      clearPendiente(p.id);
      savePropio(saved);
      rastros.update((s) => ({
        ...s,
        propio: saved,
        items: dedupe([...s.items.filter((x) => x.id !== p.id), saved]),
      }));
    } catch {
      savePendiente(p);
    }
  }
}
