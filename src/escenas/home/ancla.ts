import { writable } from "svelte/store";

/** El home ya pasó el título y está en «La pregunta». */
export const enPregunta = writable(false);

let pedido = false;

/** La próxima vez que monte el home, el scroll cae en la pregunta. */
export function pedirPregunta(): void {
  pedido = true;
}

export function consumirPregunta(): boolean {
  const va = pedido;
  pedido = false;
  return va;
}
