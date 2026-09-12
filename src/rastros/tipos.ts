import type { AlmaId } from "../datos/tipos";

export type Rastro = {
  id: string;
  alias: string | null;
  almaId: AlmaId;
  trackIds: string[];
  yearHint: number | null;
  createdAt: string;
  origen: "semilla" | "visitante";
};

export type RastroNuevo = {
  alias?: string | null;
  almaId: AlmaId;
  trackIds: string[];
  yearHint: number | null;
};
