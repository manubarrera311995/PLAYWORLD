import { writable, get } from "svelte/store";
import type { Track } from "../datos/tipos";
import {
  aplicar,
  estadoInicial,
  type EntradaIpod,
  type EstadoIpod,
} from "./maquina";

export type IpodCtx = { pool: Track[]; anios: number[]; yearHint: number | null };

const ctx: IpodCtx = { pool: [], anios: [], yearHint: null };

export const ipod = writable<EstadoIpod>(estadoInicial());

export function setIpodCtx(next: Partial<IpodCtx>): void {
  Object.assign(ctx, next);
}

export function dispatchIpod(entrada: EntradaIpod): EstadoIpod {
  const next = aplicar(get(ipod), entrada, ctx);
  ipod.set(next);
  return next;
}

export function resetIpod(): void {
  ipod.set(estadoInicial());
}

export function getIpodCtx(): IpodCtx {
  return ctx;
}
