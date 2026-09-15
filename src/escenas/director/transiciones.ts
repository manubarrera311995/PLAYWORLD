import { ensureGsap } from "../../motion/gsap";
import { duracionCrossfade } from "../../motion/presets";
import type { RutaParsed } from "./router";

export type TransicionNombre =
  | "crossfade"
  | "bolsa"
  | "sintonia"
  | "estatica"
  | "lcdBoot"
  | "revelado"
  | "posarse";

/** Puntos de extensión oleada 2: vacíos, el Director usa crossfade. */
export const transicionesNombradas: Record<Exclude<TransicionNombre, "crossfade">, null> = {
  bolsa: null,
  sintonia: null,
  estatica: null,
  lcdBoot: null,
  revelado: null,
  posarse: null,
};

export function elegirTransicion(): TransicionNombre {
  return "crossfade";
}

export async function crossfade(
  saliente: HTMLElement | null,
  entrante: HTMLElement,
  reduce: boolean,
): Promise<void> {
  const gsap = ensureGsap();
  const d = duracionCrossfade(reduce);
  const targets = saliente ? [saliente, entrante] : [entrante];
  gsap.killTweensOf(targets);
  const tl = gsap.timeline();
  if (saliente) {
    tl.to(saliente, { opacity: 0, duration: d, ease: "power2.out", pointerEvents: "none" }, 0);
  }
  gsap.set(entrante, { opacity: 0, pointerEvents: "none" });
  tl.to(entrante, { opacity: 1, duration: d, ease: "power2.out", pointerEvents: "auto" }, 0);
  await tl.then();
}

/*
 * Disolución de la fotografía del home en la transición `home → hook`.
 *
 * `disuelveFondo` y `planDisolucion` son puros (sin DOM y sin GSAP): son la
 * parte verificable por las Propiedades 13 y 14. `disolverFondoHome` y
 * `ocultarFondoHome` son los dos únicos puntos que tocan el DOM, y los invoca
 * el Director dentro de `ir()`.
 *
 * Requirements: 7.1, 7.2, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
 */

export type NombreEscena = RutaParsed["name"];

/**
 * `escala === null` ⇒ la disolución solo lleva `opacity`, sin ninguna
 * transformación: es la rama de `Modo_Quieto` (Req 7.7).
 */
export type PlanDisolucion = { escala: number | null; duracion: number };

/** Escala final de la disolución, dentro del rango admitido [1.04, 1.12] (Req 7.1). */
export const ESCALA_DISOLUCION = 1.08;

/** `.home__fondo` dentro de la capa saliente: el único objetivo de la disolución. */
const SELECTOR_FONDO_HOME = ".home__fondo";

/**
 * La disolución es exclusiva del par `home → hook`; el resto de los pares se
 * quedan con el `crossfade` a secas, sin tocar `scale` ni `opacity` del fondo
 * del home (Req 7.5).
 */
export function disuelveFondo(desde: NombreEscena, hasta: NombreEscena): boolean {
  return desde === "home" && hasta === "hook";
}

/**
 * La duración sale de `duracionCrossfade`, la misma fuente que usa `crossfade`,
 * de modo que ambas animaciones empiezan y terminan juntas (Req 7.1, 7.2).
 */
export function planDisolucion(quieto: boolean): PlanDisolucion {
  return { escala: quieto ? null : ESCALA_DISOLUCION, duracion: duracionCrossfade(quieto) };
}

/** Localiza el fondo del home en la capa saliente; `null` si no hay ninguno (Req 7.8). */
function fondoDelHome(saliente: HTMLElement | null): HTMLElement | null {
  if (saliente === null) return null;
  return saliente.querySelector<HTMLElement>(SELECTOR_FONDO_HOME);
}

/**
 * Dispara la disolución del fondo del home. Sin `.home__fondo` sale sin efecto
 * y el `crossfade` sigue su curso (Req 7.8).
 *
 * `killTweensOf(fondo, "x,y")` retira antes los `quickTo` del parallax para que
 * no compitan con la escala. El tween no lleva `delay`: arranca en el mismo tick
 * que el `crossfade`, con desplazamiento 0 (Req 7.1).
 */
export function disolverFondoHome(saliente: HTMLElement | null, quieto: boolean): void {
  const fondo = fondoDelHome(saliente);
  if (fondo === null) return;
  const gsap = ensureGsap();
  const plan = planDisolucion(quieto);
  gsap.killTweensOf(fondo, "x,y");
  const comun = {
    opacity: 0,
    duration: plan.duracion,
    ease: "power2.out",
    overwrite: "auto" as const,
  };
  gsap.to(fondo, plan.escala === null ? comun : { ...comun, scale: plan.escala });
}

/**
 * Red de seguridad del `finally` de `ir()`: deja la foto en `opacity` 0 antes de
 * retirar la capa saliente, aunque la disolución se haya interrumpido, de modo
 * que no exista fotograma con la foto visible tras ese punto (Req 7.3, 7.4).
 */
export function ocultarFondoHome(saliente: HTMLElement | null): void {
  const fondo = fondoDelHome(saliente);
  if (fondo === null) return;
  const gsap = ensureGsap();
  gsap.killTweensOf(fondo);
  gsap.set(fondo, { opacity: 0 });
}
