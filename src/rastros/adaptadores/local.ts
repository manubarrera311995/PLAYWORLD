import type { RastrosPort } from "../puerto";
import type { Rastro, RastroNuevo } from "../tipos";
import { loadPendientes, loadPropio, savePendiente } from "../sesion";

export const localPort: RastrosPort = {
  async listar() {
    const propio = loadPropio();
    const pendientes = loadPendientes();
    return [...(propio ? [propio] : []), ...pendientes];
  },
  async guardar(nuevo: RastroNuevo): Promise<Rastro> {
    const rastro: Rastro = {
      id: `local-${crypto.randomUUID()}`,
      alias: nuevo.alias ?? null,
      almaId: nuevo.almaId,
      trackIds: nuevo.trackIds,
      yearHint: nuevo.yearHint,
      createdAt: new Date().toISOString(),
      origen: "visitante",
    };
    savePendiente(rastro);
    return rastro;
  },
};
