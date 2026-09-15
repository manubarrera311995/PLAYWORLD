/**
 * Motion de entrada del hook. Attachments de Svelte: cada bloque se anima al
 * montarse y el contexto GSAP se revierte al desmontarse.
 */
import { get } from "svelte/store";

import { ensureGsap } from "../../motion/gsap";
import { reduce } from "../../motion/reducedMotion";

type Limpieza = () => void;
type Origen = { x: number; y: number };

const LIMPIEZA_VACIA: Limpieza = () => undefined;

let ultimoOrigen: Origen | null = null;

function nodosDe(root: ParentNode, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector));
}

/** Punto desde el que el recorte vuela a la bolsa. */
export function marcarOrigen(nodo: HTMLElement): void {
  const caja = nodo.getBoundingClientRect();
  ultimoOrigen = { x: caja.left + caja.width / 2, y: caja.top + caja.height / 2 };
}

/** Ecos del archivo alrededor de la pregunta. */
export function entrarSuelo(root: HTMLElement): Limpieza {
  if (get(reduce)) return LIMPIEZA_VACIA;
  const gsap = ensureGsap();
  const ecos = nodosDe(root, ".hook__eco");
  if (!ecos.length) return LIMPIEZA_VACIA;
  const ctx = gsap.context(() => {
    gsap.from(ecos, {
      y: 16,
      scale: 0.92,
      autoAlpha: 0,
      duration: 0.7,
      stagger: 0.06,
      ease: "power2.out",
      clearProps: "transform",
    });
  }, root);
  return () => ctx.revert();
}

/** Pregunta + recortes al cambiar de paso. */
export function entrarPaso(root: HTMLElement): Limpieza {
  if (get(reduce)) return LIMPIEZA_VACIA;
  const gsap = ensureGsap();
  const kicker = nodosDe(root, ".hook__kicker");
  const pregunta = nodosDe(root, ".tipo-pregunta");
  const recortes = nodosDe(root, ".hook__recorte");
  const ctx = gsap.context(() => {
    const tl = gsap.timeline();
    if (kicker.length) {
      tl.fromTo(
        kicker,
        { y: 8, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.32, ease: "power2.out", clearProps: "transform,opacity,visibility" },
        0,
      );
    }
    if (pregunta.length) {
      tl.fromTo(
        pregunta,
        { y: 18, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.48, ease: "power2.out", clearProps: "transform,opacity,visibility" },
        0.04,
      );
    }
    if (recortes.length) {
      tl.fromTo(
        recortes,
        { y: 28, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          overwrite: "auto",
          clearProps: "transform,opacity,visibility",
        },
        0.12,
      );
    }
  }, root);
  return () => ctx.revert();
}

/** Polaroid que cae en la bolsa al responder. */
export function entrarResto(nodo: HTMLElement): Limpieza {
  if (get(reduce)) return LIMPIEZA_VACIA;
  const gsap = ensureGsap();
  const destino = nodo.getBoundingClientRect();
  const cx = destino.left + destino.width / 2;
  const cy = destino.top + destino.height / 2;
  const origen = ultimoOrigen;
  ultimoOrigen = null;
  const x = origen ? origen.x - cx : 0;
  const y = origen ? origen.y - cy : 24;
  const ctx = gsap.context(() => {
    gsap.from(nodo, {
      x,
      y,
      rotation: origen ? 14 : 8,
      scale: origen ? 0.78 : 0.88,
      autoAlpha: 0,
      duration: 0.58,
      ease: "back.out(1.2)",
      clearProps: "transform",
    });
  }, nodo);
  return () => ctx.revert();
}

/** Golpe del año: la carátula se posa y el número entra detrás. */
export function entrarRevelado(root: HTMLElement): Limpieza {
  if (get(reduce)) return LIMPIEZA_VACIA;
  const gsap = ensureGsap();
  const caratula = nodosDe(root, ".hook__caratula");
  const anio = nodosDe(root, ".hook__anio");
  const resto = nodosDe(root, ".hook__golpe > :not(.hook__anio)");
  const ctx = gsap.context(() => {
    const tl = gsap.timeline();
    if (caratula.length) {
      tl.from(
        caratula,
        { y: 32, rotation: -16, scale: 0.82, autoAlpha: 0, duration: 0.7, ease: "back.out(1.4)" },
        0,
      );
    }
    if (anio.length) {
      tl.from(anio, { y: 18, autoAlpha: 0, duration: 0.5, ease: "power2.out" }, 0.12);
    }
    if (resto.length) {
      tl.from(resto, { y: 10, autoAlpha: 0, duration: 0.38, stagger: 0.06, ease: "power2.out" }, 0.22);
    }
  }, root);
  return () => ctx.revert();
}
