export const ALIAS_MAX = 12;

/** Nombres cortos para quien no escribe. Ninguno está en la semilla. */
export const NOMBRES = [
  "Sol",
  "Mar",
  "Vera",
  "Leo",
  "Nora",
  "Teo",
  "Luz",
  "Pau",
  "Rita",
  "Otto",
  "Nilo",
  "Ciro",
  "Iris",
  "Gael",
  "Lila",
  "Dante",
  "Clara",
  "Bruno",
  "Inés",
  "Roque",
  "Fede",
  "Simón",
  "Oliva",
  "Renzo",
  "Maia",
  "Cata",
  "Joaquín",
  "Violeta",
  "Benja",
  "Lupe",
] as const;

export function limpiarAlias(escrito: string): string {
  return escrito.replace(/\s+/g, " ").trim().slice(0, ALIAS_MAX);
}

export function aliasAlAzar(sacar: () => number = Math.random): string {
  const i = Math.min(NOMBRES.length - 1, Math.floor(sacar() * NOMBRES.length));
  return NOMBRES[i] ?? NOMBRES[0];
}

export function resolverAlias(escrito: string, sacar: () => number = Math.random): string {
  return limpiarAlias(escrito) || aliasAlAzar(sacar);
}
