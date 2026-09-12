import type { AlmaId } from "../../datos/tipos";
import type { RastrosPort } from "../puerto";
import type { Rastro, RastroNuevo } from "../tipos";

const url = () => import.meta.env.VITE_SUPABASE_URL ?? "";
const key = () => import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

function headers(): HeadersInit {
  return {
    apikey: key(),
    Authorization: `Bearer ${key()}`,
    "Content-Type": "application/json",
  };
}

function rowToRastro(row: Record<string, unknown>): Rastro {
  return {
    id: String(row.id),
    alias: (row.alias as string | null) ?? null,
    almaId: row.alma_id as AlmaId,
    trackIds: (row.track_ids as string[]) ?? [],
    yearHint: (row.year_hint as number | null) ?? null,
    createdAt: String(row.created_at),
    origen: (row.origen as Rastro["origen"]) ?? "visitante",
  };
}

export function supabaseDisponible(): boolean {
  return Boolean(url() && key());
}

export const supabasePort: RastrosPort = {
  async listar(opts) {
    const u = new URL(`${url()}/rest/v1/rastros`);
    u.searchParams.set("order", "created_at.desc");
    u.searchParams.set("limit", String(opts?.limite ?? 500));
    if (opts?.almaId) u.searchParams.set("alma_id", `eq.${opts.almaId}`);
    const res = await fetch(u, { headers: headers() });
    if (!res.ok) throw new Error(`listar ${res.status}`);
    const rows = (await res.json()) as Record<string, unknown>[];
    return rows.map(rowToRastro);
  },
  async guardar(nuevo: RastroNuevo) {
    const res = await fetch(`${url()}/rest/v1/rastros`, {
      method: "POST",
      headers: { ...headers(), Prefer: "return=representation" },
      body: JSON.stringify({
        alias: nuevo.alias || null,
        alma_id: nuevo.almaId,
        track_ids: nuevo.trackIds,
        year_hint: nuevo.yearHint,
        origen: "visitante",
      }),
    });
    if (!res.ok) throw new Error(`guardar ${res.status}`);
    const rows = (await res.json()) as Record<string, unknown>[];
    return rowToRastro(rows[0]);
  },
};
