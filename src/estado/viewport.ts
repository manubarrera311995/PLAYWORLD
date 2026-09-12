import { writable } from "svelte/store";

export type ModoViewport = "compacto" | "medio" | "cine";
export type PointerKind = "coarse" | "fine";

export type Viewport = {
  modo: ModoViewport;
  pointer: PointerKind;
  ancho: number;
  alto: number;
  corto: boolean;
};

function medir(): Viewport {
  if (typeof window === "undefined") {
    return { modo: "cine", pointer: "fine", ancho: 1280, alto: 800, corto: false };
  }
  const ancho = window.innerWidth;
  const alto = window.innerHeight;
  const modo: ModoViewport = ancho < 768 ? "compacto" : ancho < 1024 ? "medio" : "cine";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return {
    modo,
    pointer: coarse ? "coarse" : "fine",
    ancho,
    alto,
    corto: alto < 640,
  };
}

export const viewport = writable<Viewport>(medir());

export function initViewport(): () => void {
  const on = () => viewport.set(medir());
  on();
  window.addEventListener("resize", on);
  return () => window.removeEventListener("resize", on);
}
