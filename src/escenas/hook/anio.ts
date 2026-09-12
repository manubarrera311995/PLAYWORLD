export type Pesos = Record<string, Record<string, number>>;
export type Revelado = { year: number; linea: string };

export function fill(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

export function resolverAnio(
  opciones: string[],
  pesos: Pesos,
  desempate: number[],
): number {
  const score = new Map<number, number>();
  for (const id of opciones) {
    const w = pesos[id];
    if (!w) continue;
    for (const [year, n] of Object.entries(w)) {
      const y = Number(year);
      score.set(y, (score.get(y) ?? 0) + n);
    }
  }
  let best = desempate[0] ?? 2011;
  let bestN = Number.NEGATIVE_INFINITY;
  for (const y of desempate) {
    const n = score.get(y) ?? 0;
    if (n > bestN) {
      bestN = n;
      best = y;
    }
  }
  return best;
}

export function resolverPuerta(
  opciones: string[],
  pesos: Pesos,
  desempate: number[],
  revelados: Record<string, Revelado>,
): Revelado {
  const year = resolverAnio(opciones, pesos, desempate);
  const rev = revelados[String(year)];
  return { year, linea: rev?.linea ?? "" };
}
