import homeCopy from "../home/home.copy.json";

export type Pesos = Record<string, Record<string, number>>;
export type Revelado = { year: number; linea: string };
export type CaratulaAnio = { year: number; art: string; label: string };

const ART_FALLBACK = "/assets/home/caratulas";
const ECOS_SUELO = [2012, 2014, 2016, 2018, 2020, 2023] as const;

/** Misma carátula que la órbita del home, para que el revelado cierre el círculo. */
export function caratulaDe(year: number): CaratulaAnio {
  const card = homeCopy.cards.find((c) => c.year === year);
  return {
    year,
    art: card?.art ?? `${ART_FALLBACK}/${year}.jpg`,
    label: card?.label ?? "",
  };
}

/** Recortes del archivo que se derraman alrededor de la pregunta, no de la puerta. */
export function ecosDelSuelo(): CaratulaAnio[] {
  return ECOS_SUELO.map((year) => caratulaDe(year));
}

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
