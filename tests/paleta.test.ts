/**
 * Contratos de `Paleta_Global` (`paleta.ts`, tarea 14.1).
 *
 * A diferencia del resto de las suites del plan, aquí sí hay algo que ejercitar
 * sin navegador: el tween de la paleta cae sobre un objeto plano de parámetros,
 * no sobre el DOM, así que GSAP interpola de verdad bajo `environment: "node"` y
 * `pintarCss` se retira solo al no haber `document`. Lo que se comprueba es el
 * contrato que la tarea añade: que `overwrite: "auto"` deja **un único** tween
 * vivo sobre el objeto de parámetros y que el segundo parte del valor intermedio
 * del primero, sin pasar por un estado base (Req 10.8); y que los valores por
 * defecto reproducen el comportamiento previo —0.7 s con movimiento, 0.2 s en
 * `Modo_Quieto`— quedando dentro de `[0.5, 1.0]` fuera de quieto (Req 9.3, 10.7,
 * 11.4).
 *
 * Dos decisiones sostienen la suite:
 *
 * - **El objeto de parámetros se toma del store.** `paleta` se crea con el
 *   propio objeto interno como valor inicial, así que `get(paleta)` antes de la
 *   primera interpolación devuelve esa misma referencia mutable, que es el
 *   objetivo de todos los tweens del módulo. De ahí sale el `gsap.getTweensOf`
 *   con el que se cuentan.
 * - **El tiempo se conduce con la API de GSAP.** La timeline global queda en
 *   pausa y cada tween se sitúa con `progress()`, de modo que no hay esperas
 *   reales ni depende del ticker: los valores observados son exactos.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { get } from "svelte/store";
import { paletaDefault } from "../src/datos/color";
import type { Paleta } from "../src/datos/tipos";
import { ensureGsap } from "../src/motion/gsap";
import { reduce } from "../src/motion/reducedMotion";
import { EASE_PALETA_DEFAULT, aplicarPaleta, paleta } from "../src/sketches/paleta";

const gsap = ensureGsap();

/**
 * La referencia viva del objeto de parámetros del módulo, capturada antes de la
 * primera interpolación: en cuanto un `onUpdate` corre, el store pasa a guardar
 * copias y esta referencia es la única vía de llegar al objetivo de los tweens.
 */
const parametros: Paleta = get(paleta);

function tweensDeLaPaleta(): ReturnType<typeof gsap.getTweensOf> {
  return gsap.getTweensOf(parametros);
}

function unicoTween(): ReturnType<typeof gsap.getTweensOf>[number] {
  const vivos = tweensDeLaPaleta();
  expect(vivos).toHaveLength(1);
  return vivos[0];
}

function ultimoTween(): ReturnType<typeof gsap.getTweensOf>[number] {
  const vivos = tweensDeLaPaleta();
  expect(vivos.length).toBeGreaterThan(0);
  return vivos[vivos.length - 1];
}

function objetivo(cambios: Partial<Paleta>): Paleta {
  return { ...paletaDefault, ...cambios };
}

beforeAll(() => {
  // El tiempo lo conduce la suite, no el ticker.
  gsap.globalTimeline.pause();
});

afterAll(() => {
  gsap.globalTimeline.resume();
});

afterEach(() => {
  gsap.killTweensOf(parametros);
  Object.assign(parametros, paletaDefault);
  reduce.set(false);
});

describe("aplicarPaleta · una sola interpolación viva", () => {
  it("la referencia del store es el objetivo de los tweens del módulo", () => {
    expect(tweensDeLaPaleta()).toHaveLength(0);

    aplicarPaleta(objetivo({ granoDensidad: 0.95 }), { duracion: 1, ease: "none" });

    const tween = unicoTween();
    tween.progress(1);
    expect(parametros.granoDensidad).toBeCloseTo(0.95, 6);
  });

  it("dos llamadas consecutivas dejan un único tween vivo sobre los parámetros", () => {
    aplicarPaleta(objetivo({ granoDensidad: 0.95 }), { duracion: 1, ease: "none" });
    const primero = unicoTween();
    primero.progress(0.5);

    aplicarPaleta(objetivo({ granoDensidad: 0.15 }), { duracion: 1, ease: "none" });
    const segundo = ultimoTween();
    expect(segundo).not.toBe(primero);
    // `overwrite: "auto"` resuelve en el primer render del tween nuevo.
    segundo.progress(0.5);

    const vivos = tweensDeLaPaleta();
    expect(vivos).toHaveLength(1);
    expect(vivos[0]).toBe(segundo);
    expect(segundo.vars.overwrite).toBe("auto");
  });

  it("la segunda interpolación parte del valor intermedio de la primera", () => {
    const base = parametros.granoDensidad;
    aplicarPaleta(objetivo({ granoDensidad: 0.95 }), { duracion: 1, ease: "none" });
    unicoTween().progress(0.5);

    const intermedio = parametros.granoDensidad;
    // Con ease lineal, la mitad del tramo es la media aritmética exacta.
    expect(intermedio).toBeCloseTo((base + 0.95) / 2, 6);
    expect(intermedio).not.toBeCloseTo(base, 3);

    aplicarPaleta(objetivo({ granoDensidad: 0.15 }), { duracion: 1, ease: "none" });
    ultimoTween().progress(0.5);

    // Si hubiese pasado por el estado base, la mitad del segundo tramo sería
    // `(base + 0.15) / 2`; parte del intermedio, así que es otra cifra.
    expect(parametros.granoDensidad).toBeCloseTo((intermedio + 0.15) / 2, 6);
    expect(parametros.granoDensidad).not.toBeCloseTo((base + 0.15) / 2, 3);
  });

  it("la interpolación previa no vuelve a escribir sobre los parámetros", () => {
    aplicarPaleta(objetivo({ granoDensidad: 0.95 }), { duracion: 1, ease: "none" });
    const primero = unicoTween();
    primero.progress(0.5);

    aplicarPaleta(objetivo({ granoDensidad: 0.15 }), { duracion: 1, ease: "none" });
    const segundo = ultimoTween();
    segundo.progress(1);
    expect(parametros.granoDensidad).toBeCloseTo(0.15, 6);

    // Cancelada por el overwrite: pedirle su estado final no mueve el destino.
    primero.progress(1);
    expect(parametros.granoDensidad).toBeCloseTo(0.15, 6);
  });
});

describe("aplicarPaleta · duraciones por defecto", () => {
  it("fuera de quieto dura 0.7 s, dentro de [0.5, 1.0]", () => {
    aplicarPaleta(objetivo({ granoDensidad: 0.6 }));

    const duracion = unicoTween().duration();
    expect(duracion).toBe(0.7);
    expect(duracion).toBeGreaterThanOrEqual(0.5);
    expect(duracion).toBeLessThanOrEqual(1);
  });

  it("en quieto baja a 0.2 s", () => {
    reduce.set(true);
    aplicarPaleta(objetivo({ granoDensidad: 0.6 }));

    const duracion = unicoTween().duration();
    expect(duracion).toBe(0.2);
    expect(duracion).toBeLessThanOrEqual(0.2);
  });

  it("el ease por defecto es el histórico de GSAP", () => {
    expect(EASE_PALETA_DEFAULT).toBe("power1.out");

    aplicarPaleta(objetivo({ granoDensidad: 0.6 }));
    expect(unicoTween().vars.ease).toBe(EASE_PALETA_DEFAULT);
  });

  it("las opciones explícitas ganan a los valores por defecto, también en quieto", () => {
    aplicarPaleta(objetivo({ granoDensidad: 0.6 }), { duracion: 0.9, ease: "sine.inOut" });
    const conMovimiento = unicoTween();
    expect(conMovimiento.duration()).toBe(0.9);
    expect(conMovimiento.vars.ease).toBe("sine.inOut");

    gsap.killTweensOf(parametros);
    reduce.set(true);
    aplicarPaleta(objetivo({ granoDensidad: 0.6 }), { duracion: 9, ease: "sine.inOut" });
    expect(unicoTween().duration()).toBe(9);
  });
});
