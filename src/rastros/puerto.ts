import type { AlmaId } from "../datos/tipos";
import type { Rastro, RastroNuevo } from "./tipos";

export class NoEscribible extends Error {
  constructor() {
    super("Este puerto no escribe rastros");
    this.name = "NoEscribible";
  }
}

export interface RastrosPort {
  listar(opts?: { limite?: number; almaId?: AlmaId }): Promise<Rastro[]>;
  guardar(nuevo: RastroNuevo): Promise<Rastro>;
  resumen?(): Promise<Record<AlmaId, number>>;
}
