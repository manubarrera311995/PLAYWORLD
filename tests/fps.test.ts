/**
 * Property 9 de `fondo-vivo-recorrido`: la decisión de degradar por fps es estable.
 *
 * Sigue la convención de PBT fijada en `tests/fondo.curvas.test.ts` (Opción A de
 * la tarea 1.1): `fast-check` 4.3.0 desde `devDependencies`, generadores vía
 * `import fc from "fast-check"` y `{ numRuns: 200 }` por propiedad.
 *
 * **Validates: Requirements 5.9, 13.11**
 */

import { describe, expect, it } from "vitest";
import fc from "fast-check";

import {
  UMBRALES_FPS,
  contarLargos,
  fpsMedio,
  siguienteEstado,
  ventanaCompleta,
  type EstadoFps,
  type UmbralesFps,
} from "../src/motion/fps";
import { P_PAUSA, debenPausarBucles } from "../src/escenas/home/fondo.curvas";

const ITERACIONES = { numRuns: 200 } as const;

/** Deltas plausibles de fotograma: de 120 fps (8 ms) a 16 fps (60 ms). */
const deltaMedible = fc.double({ min: 8, max: 60, noNaN: true });

/** Entradas que el módulo debe descartar: no finitas, cero o negativas. */
const deltaDescartable = fc.constantFrom(
  0,
  -0,
  -1,
  -33.3,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
);

const delta = fc.oneof(
  { weight: 9, arbitrary: deltaMedible },
  { weight: 1, arbitrary: deltaDescartable },
);

/** Ventanas de longitud variable: unas completan los 5 s y otras no. */
const ventana = fc.array(delta, { minLength: 0, maxLength: 400 });

const estadoPrevio = fc.constantFrom<EstadoFps>("normal", "degradado");

/**
 * Ventana de deltas constantes cuya media cae dentro de la banda de histéresis
 * `[55, 58)`, con basura no medible intercalada que no debe alterar la media.
 */
function ventanaEnBanda(fps: number, ruido: readonly number[]): number[] {
  const paso = 1000 / fps;
  const cuenta = Math.ceil(UMBRALES_FPS.ventanaMs / paso) + 5;
  const deltas: number[] = Array.from({ length: cuenta }, () => paso);
  ruido.forEach((valor, indice) => {
    deltas.splice((indice * 7) % (deltas.length + 1), 0, valor);
  });
  return deltas;
}

describe("Property 9: La decisión de degradar por fps es estable", () => {
  it("pasa a degradado si y solo si la ventana está completa y la media es menor que 55", () => {
    fc.assert(
      fc.property(ventana, estadoPrevio, (deltas: number[], estado: EstadoFps) => {
        const siguiente = siguienteEstado(deltas, estado, UMBRALES_FPS);
        const debeDegradar =
          ventanaCompleta(deltas, UMBRALES_FPS.ventanaMs) &&
          fpsMedio(deltas) < UMBRALES_FPS.degradar;

        expect(siguiente === "degradado" && estado === "normal").toBe(
          debeDegradar && estado === "normal",
        );
        if (debeDegradar) expect(siguiente).toBe("degradado");
      }),
      ITERACIONES,
    );
  });

  it("pasa a normal si y solo si la ventana está completa y la media alcanza 58", () => {
    fc.assert(
      fc.property(ventana, estadoPrevio, (deltas: number[], estado: EstadoFps) => {
        const siguiente = siguienteEstado(deltas, estado, UMBRALES_FPS);
        const debeRecuperar =
          ventanaCompleta(deltas, UMBRALES_FPS.ventanaMs) &&
          fpsMedio(deltas) >= UMBRALES_FPS.recuperar;

        expect(siguiente === "normal" && estado === "degradado").toBe(
          debeRecuperar && estado === "degradado",
        );
        if (debeRecuperar) expect(siguiente).toBe("normal");
      }),
      ITERACIONES,
    );
  });

  it("conserva el estado en todo el resto de los casos", () => {
    fc.assert(
      fc.property(ventana, estadoPrevio, (deltas: number[], estado: EstadoFps) => {
        const completa = ventanaCompleta(deltas, UMBRALES_FPS.ventanaMs);
        const media = fpsMedio(deltas);
        const hayTransicion =
          completa && (media < UMBRALES_FPS.degradar || media >= UMBRALES_FPS.recuperar);

        if (!hayTransicion) {
          expect(siguienteEstado(deltas, estado, UMBRALES_FPS)).toBe(estado);
        }
      }),
      ITERACIONES,
    );
  });

  it("ninguna secuencia con media en [55, 58) oscila entre estados", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 55.01, max: 57.99, noNaN: true }),
        fc.array(deltaDescartable, { maxLength: 6 }),
        fc.integer({ min: 1, max: 25 }),
        estadoPrevio,
        (fps: number, ruido: number[], repeticiones: number, inicial: EstadoFps) => {
          const deltas = ventanaEnBanda(fps, ruido);

          expect(ventanaCompleta(deltas, UMBRALES_FPS.ventanaMs)).toBe(true);
          const media = fpsMedio(deltas);
          expect(media).toBeGreaterThanOrEqual(UMBRALES_FPS.degradar);
          expect(media).toBeLessThan(UMBRALES_FPS.recuperar);

          let estado = inicial;
          for (let i = 0; i < repeticiones; i += 1) {
            estado = siguienteEstado(deltas, estado, UMBRALES_FPS);
          }
          expect(estado).toBe(inicial);
        },
      ),
      ITERACIONES,
    );
  });

  it("debenPausarBucles(p) es verdadero si y solo si p >= 0.10", () => {
    fc.assert(
      fc.property(fc.double({ min: -2, max: 3, noNaN: true }), (p: number) => {
        expect(debenPausarBucles(p)).toBe(p >= P_PAUSA);
      }),
      ITERACIONES,
    );

    expect(P_PAUSA).toBe(0.1);
  });
});

describe("Property 9 · casos exactos en las fronteras de la histéresis", () => {
  /** 11 deltas que suman 200 ms: media exactamente 55 fps, sin error de coma flotante. */
  const mediaExacta55: number[] = [18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 20];
  /** 29 deltas que suman 500 ms: media exactamente 58 fps. */
  const mediaExacta58: number[] = [...Array.from({ length: 28 }, () => 17), 24];

  const umbrales200: UmbralesFps = { ...UMBRALES_FPS, ventanaMs: 200 };
  const umbrales500: UmbralesFps = { ...UMBRALES_FPS, ventanaMs: 500 };

  it("una media de 55 exactos no degrada: el umbral es estricto", () => {
    expect(fpsMedio(mediaExacta55)).toBe(55);
    expect(ventanaCompleta(mediaExacta55, umbrales200.ventanaMs)).toBe(true);
    expect(siguienteEstado(mediaExacta55, "normal", umbrales200)).toBe("normal");
    expect(siguienteEstado(mediaExacta55, "degradado", umbrales200)).toBe("degradado");
  });

  it("una media de 58 exactos recupera: el umbral es inclusivo", () => {
    expect(fpsMedio(mediaExacta58)).toBe(58);
    expect(siguienteEstado(mediaExacta58, "degradado", umbrales500)).toBe("normal");
    expect(siguienteEstado(mediaExacta58, "normal", umbrales500)).toBe("normal");
  });

  it("con la ventana incompleta no se decide nada, ni siquiera con 20 fps", () => {
    const lenta: number[] = [50, 50, 50];

    expect(fpsMedio(lenta)).toBe(20);
    expect(ventanaCompleta(lenta, UMBRALES_FPS.ventanaMs)).toBe(false);
    expect(siguienteEstado(lenta, "normal", UMBRALES_FPS)).toBe("normal");
    expect(siguienteEstado(lenta, "degradado", UMBRALES_FPS)).toBe("degradado");
  });

  it("los fotogramas largos se cuentan por encima de 50 ms, sin contar los no medibles", () => {
    expect(contarLargos([16, 50, 50.1, 120, Number.NaN, -80])).toBe(2);
  });
});
