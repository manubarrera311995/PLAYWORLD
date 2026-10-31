import { writable } from "svelte/store";

/** El home ya pasó el título y está en «La pregunta». */
export const enPregunta = writable(false);

/**
 * 0 = título del home, 1 = la barra ya dice «Mi primera vez».
 * Sigue el scroll; no salta con `enPregunta`.
 */
export const crucePrimera = writable(0);

let pedido = false;
let saltar: (() => void) | null = null;

/**
 * Lleva el home a «Mi primera vez».
 * Si el home ya está en pantalla, salta y devuelve true.
 * Si no, queda pedido para el próximo montaje y devuelve false.
 */
export function pedirPregunta(): boolean {
  if (saltar) {
    pedido = false;
    saltar();
    return true;
  }
  pedido = true;
  return false;
}

export function consumirPregunta(): boolean {
  const va = pedido;
  pedido = false;
  return va;
}

/** El home vivo registra cómo caer en la pregunta sin volver a montarse. */
export function registrarSalto(fn: () => void): () => void {
  saltar = fn;
  return () => {
    if (saltar === fn) saltar = null;
  };
}
