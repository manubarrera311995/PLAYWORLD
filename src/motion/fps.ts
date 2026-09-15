/**
 * Aritmética pura de la ventana deslizante de fps.
 *
 * Este módulo solo contiene funciones de entrada→salida: no toca el DOM, no
 * abre un `requestAnimationFrame` propio y no importa GSAP. El vigilante
 * (`vigilarFps`, sobre `gsap.ticker`) se limita a alimentar estas funciones y
 * vive en una tarea posterior; aquí se declaran sus tipos para que el resto del
 * plan pueda escribirse contra ellos.
 *
 * Requirements: 13.8, 13.11
 */

export type UmbralesFps = {
  degradar: number;
  recuperar: number;
  ventanaMs: number;
  largoMs: number;
};

export type EstadoFps = "normal" | "degradado";

export type DetenerVigilante = () => void;

export type OpcionesVigilante = {
  umbrales?: Partial<UmbralesFps>;
  alDegradar: () => void;
  alRecuperar?: () => void;
};

/**
 * Histéresis 55/58 fps: se degrada por debajo de 55 y solo se recupera por
 * encima de 58, de modo que una media dentro de [55, 58) nunca oscila.
 * `ventanaMs` es la ventana deslizante de 5 s de Req 13.11 y `largoMs` el
 * umbral de fotograma largo de Req 13.8.
 */
export const UMBRALES_FPS: UmbralesFps = {
  degradar: 55,
  recuperar: 58,
  ventanaMs: 5000,
  largoMs: 50,
};

/** Un delta cuenta como fotograma medible si es un número finito positivo. */
function esDeltaValido(delta: number): boolean {
  return Number.isFinite(delta) && delta > 0;
}

/**
 * Frecuencia media de refresco de la ventana: fotogramas medidos partido por el
 * tiempo total que ocuparon. Devuelve 0 cuando no hay ningún delta válido.
 */
export function fpsMedio(deltas: readonly number[]): number {
  let cuenta = 0;
  let total = 0;
  for (const delta of deltas) {
    if (!esDeltaValido(delta)) continue;
    cuenta += 1;
    total += delta;
  }
  if (cuenta === 0 || total <= 0) return 0;
  return (cuenta * 1000) / total;
}

/** Fotogramas de la ventana con duración estrictamente mayor que `largoMs`. */
export function contarLargos(
  deltas: readonly number[],
  largoMs: number = UMBRALES_FPS.largoMs,
): number {
  let largos = 0;
  for (const delta of deltas) {
    if (!esDeltaValido(delta)) continue;
    if (delta > largoMs) largos += 1;
  }
  return largos;
}

/**
 * La ventana está completa cuando los deltas válidos acumulan al menos
 * `ventanaMs`. Antes de eso no hay muestra suficiente para decidir nada.
 */
export function ventanaCompleta(
  deltas: readonly number[],
  ventanaMs: number,
): boolean {
  if (!Number.isFinite(ventanaMs) || ventanaMs <= 0) return false;
  let total = 0;
  for (const delta of deltas) {
    if (!esDeltaValido(delta)) continue;
    total += delta;
    if (total >= ventanaMs) return true;
  }
  return false;
}

/**
 * Decide el estado a partir de la ventana y del estado previo:
 * pasa a `"degradado"` si y solo si la ventana está completa y la media cae por
 * debajo de `umbrales.degradar`; pasa a `"normal"` si y solo si la ventana está
 * completa y la media alcanza `umbrales.recuperar`; en cualquier otro caso
 * —incluida la ventana incompleta— conserva el estado recibido.
 */
export function siguienteEstado(
  deltas: readonly number[],
  estado: EstadoFps,
  umbrales: UmbralesFps,
): EstadoFps {
  if (!ventanaCompleta(deltas, umbrales.ventanaMs)) return estado;
  const media = fpsMedio(deltas);
  if (media < umbrales.degradar) return "degradado";
  if (media >= umbrales.recuperar) return "normal";
  return estado;
}
