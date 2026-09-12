import type { RastrosPort } from "../puerto";
import { NoEscribible } from "../puerto";
import type { Rastro } from "../tipos";
import semilla from "../semilla.json";

export const semillaPort: RastrosPort = {
  async listar(opts) {
    let rows = semilla as Rastro[];
    if (opts?.almaId) rows = rows.filter((r) => r.almaId === opts.almaId);
    return rows.slice(0, opts?.limite ?? 500);
  },
  async guardar() {
    throw new NoEscribible();
  },
};
