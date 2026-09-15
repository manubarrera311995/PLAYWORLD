/**
 * Propiedades y ejemplos de `src/escenas/director/transiciones.ts`.
 *
 * Sigue la convención de property-based testing declarada en la cabecera de
 * `tests/fondo.curvas.test.ts` (Opción A del punto de decisión de la tarea 1.1):
 * runner vitest con `environment: "node"`, generadores de `fast-check` fijado en
 * `4.3.0` dentro de `devDependencies`, y `{ numRuns: 200 }` en cada propiedad.
 *
 * `disuelveFondo` y `planDisolucion` son puros —sin DOM y sin GSAP—, así que se
 * verifican directamente. `disolverFondoHome` y `ocultarFondoHome` son glue de
 * DOM y quedan fuera de esta suite.
 */

import { describe, expect, it } from "vitest";
import fc from "fast-check";

import {
  disuelveFondo,
  elegirTransicion,
  ESCALA_DISOLUCION,
  planDisolucion,
  transicionesNombradas,
  type TransicionNombre,
} from "../src/escenas/director/transiciones";
import type { RutaParsed } from "../src/escenas/director/router";
import {
  RECORRIDO,
  type NombreEscena as NombreEscenaCielo,
} from "../src/motion/cielo.perfiles";
import { duracionCrossfade } from "../src/motion/presets";

const ITERACIONES = { numRuns: 200 } as const;

/* ------------------------------------------------------------------------- *
 * Property 13: La disolución dura exactamente lo que el crossfade
 *
 * Para todo booleano de quieto, `planDisolucion(quieto).duracion` coincide con
 * `duracionCrossfade(quieto)` y esa duración está en `[0.2, 0.4]`, con el valor
 * exacto 0.2 en quieto; `planDisolucion(false).escala ∈ [1.04, 1.12]` y
 * `planDisolucion(true).escala === null`, es decir en quieto la disolución solo
 * lleva `opacity`, sin ninguna transformación.
 *
 * **Validates: Requirements 7.1, 7.2, 7.7**
 * ------------------------------------------------------------------------- */

/**
 * Cotas literales del Requirement 7.2, no derivadas de `presets`: si la tabla de
 * duraciones se saliera del rango declarado, la propiedad debe fallar.
 */
const RANGO_DURACION = { min: 0.2, max: 0.4 } as const;

/** Duración exacta del crossfade en `Modo_Quieto` (Req 7.2). */
const DURACION_QUIETO = 0.2;

/** Cotas literales de la escala final de la disolución (Req 7.1). */
const RANGO_ESCALA = { min: 1.04, max: 1.12 } as const;

/** El único parámetro del plan: el estado de `Modo_Quieto`. */
const quieto = (): fc.Arbitrary<boolean> => fc.boolean();

describe("Property 13: la disolución dura exactamente lo que el crossfade", () => {
  it("la duración del plan es la del crossfade y vive en [0.2, 0.4]", () => {
    fc.assert(
      fc.property(quieto(), (esQuieto: boolean) => {
        const plan = planDisolucion(esQuieto);

        // Misma fuente que `crossfade`: ambas animaciones terminan juntas.
        expect(plan.duracion).toBe(duracionCrossfade(esQuieto));

        expect(plan.duracion).toBeGreaterThanOrEqual(RANGO_DURACION.min);
        expect(plan.duracion).toBeLessThanOrEqual(RANGO_DURACION.max);
      }),
      ITERACIONES,
    );
  });

  it("en quieto la duración es exactamente 0.2 s", () => {
    fc.assert(
      fc.property(quieto(), (esQuieto: boolean) => {
        const plan = planDisolucion(esQuieto);

        if (esQuieto) expect(plan.duracion).toBe(DURACION_QUIETO);
      }),
      ITERACIONES,
    );
  });

  it("la escala es null en quieto y está en [1.04, 1.12] con movimiento", () => {
    fc.assert(
      fc.property(quieto(), (esQuieto: boolean) => {
        const plan = planDisolucion(esQuieto);

        if (esQuieto) {
          // Req 7.7: solo `opacity`, ninguna transformación.
          expect(plan.escala).toBeNull();
          return;
        }

        expect(plan.escala).not.toBeNull();
        expect(plan.escala).toBe(ESCALA_DISOLUCION);
        expect(plan.escala as number).toBeGreaterThanOrEqual(RANGO_ESCALA.min);
        expect(plan.escala as number).toBeLessThanOrEqual(RANGO_ESCALA.max);
      }),
      ITERACIONES,
    );
  });

  it("el plan es función pura del modo: dos llamadas dan el mismo resultado", () => {
    fc.assert(
      fc.property(quieto(), (esQuieto: boolean) => {
        expect(planDisolucion(esQuieto)).toEqual(planDisolucion(esQuieto));
      }),
      ITERACIONES,
    );
  });
});

/* ------------------------------------------------------------------------- *
 * Property 14: La disolución y el cambio de cielo solo ocurren cuando deben
 *
 * Dos reglas de decisión, una por requisito:
 *
 * - Req 7.5 · `disuelveFondo(desde, hasta)` es verdadero si y solo si
 *   `desde === "home" && hasta === "hook"`, para todos los pares del
 *   `RECORRIDO` (7 × 7 = 49 pares) más un puñado de casi-nombres (`"Home"`,
 *   `"hook "`, `"hooks"`, …) y cadenas arbitrarias. Se verifica contra el
 *   código real.
 * - Req 8.10 · el Director decide cambiar el cielo si y solo si
 *   `desde.name !== hasta.name`.
 *
 * Sobre la segunda regla: no hay ningún módulo puro que la contenga. El diseño
 * la sitúa dentro de `ir()` de `Director.svelte`, en el cortocircuito
 * `next.name === vivo.name` ⇒ solo actualiza la ruta y no invoca al cielo, de
 * modo que su bucle sigue vivo sin reiniciarse. Aquí se declara como el
 * predicado local `decideCambiarCielo`, con la forma exacta que enuncia el
 * diseño, y se ancla al código real mediante la coherencia con `disuelveFondo`:
 * todo par que disuelve el fondo cambia también de cielo.
 *
 * El cableado de esa decisión dentro del Director no es objeto de esta suite:
 * lo verifica la tarea 15.4 (invocación del cielo desde `ir()`) y lo comprueba
 * en navegador el guion manual de la tarea 19.1.
 *
 * **Validates: Requirements 7.5, 8.10**
 * ------------------------------------------------------------------------- */

/** Par que disuelve la foto del home: el único del recorrido (Req 7.5). */
const PAR_DISOLUCION = { desde: "home", hasta: "hook" } as const;

/**
 * Vecinos tipográficos del par `home → hook`: mayúsculas, espacios, prefijos y
 * plurales. Ninguno debe disolver el fondo, así que la propiedad no se sostiene
 * por un `includes` ni por una comparación laxa.
 */
const CASI_NOMBRES: readonly string[] = [
  "",
  "Home",
  "HOME",
  "home ",
  " home",
  "homes",
  "home/hook",
  "Hook",
  "hook ",
  "hooks",
  "inicio",
];

/** Nombre del recorrido, casi-nombre o cadena cualquiera. */
const nombreLibre = (): fc.Arbitrary<string> =>
  fc.oneof(fc.constantFrom(...RECORRIDO), fc.constantFrom(...CASI_NOMBRES), fc.string());

/** Un nombre cualquiera del recorrido. */
const nombre = (): fc.Arbitrary<NombreEscenaCielo> => fc.constantFrom(...RECORRIDO);

/** Los 49 pares del recorrido; el espacio completo del primer enunciado. */
const PARES_RECORRIDO: readonly { desde: NombreEscenaCielo; hasta: NombreEscenaCielo }[] =
  RECORRIDO.flatMap((desde) => RECORRIDO.map((hasta) => ({ desde, hasta })));

/**
 * Regla de decisión del cielo tal como la enuncia el diseño (Req 8.10): el
 * cielo cambia si y solo si el nombre de escena cambia. Opera sobre nombres, no
 * sobre rutas completas, porque el resto de la ruta no entra en la decisión:
 * `archivo?y=2011 → archivo?y=2013` es la misma escena.
 */
const decideCambiarCielo = (desde: string, hasta: string): boolean => desde !== hasta;

describe("Property 14: la disolución y el cambio de cielo solo ocurren cuando deben", () => {
  it("disuelveFondo es verdadero si y solo si el par es home → hook", () => {
    fc.assert(
      fc.property(nombreLibre(), nombreLibre(), (desde: string, hasta: string) => {
        const esperado = desde === PAR_DISOLUCION.desde && hasta === PAR_DISOLUCION.hasta;

        expect(
          disuelveFondo(desde as NombreEscenaCielo, hasta as NombreEscenaCielo),
        ).toBe(esperado);
      }),
      ITERACIONES,
    );
  });

  it("exactamente un par del recorrido disuelve el fondo", () => {
    const disuelven = PARES_RECORRIDO.filter(({ desde, hasta }) => disuelveFondo(desde, hasta));

    expect(disuelven).toEqual([PAR_DISOLUCION]);
  });

  it("ningún par que comparte escena disuelve el fondo", () => {
    fc.assert(
      fc.property(nombre(), (mismo: NombreEscenaCielo) => {
        expect(disuelveFondo(mismo, mismo)).toBe(false);
      }),
      ITERACIONES,
    );
  });

  it("el cielo cambia si y solo si cambia el nombre de escena", () => {
    fc.assert(
      fc.property(nombreLibre(), nombreLibre(), (desde: string, hasta: string) => {
        expect(decideCambiarCielo(desde, hasta)).toBe(desde !== hasta);
      }),
      ITERACIONES,
    );
  });

  it("los 49 pares del recorrido cambian el cielo salvo los 7 de la diagonal", () => {
    const cambian = PARES_RECORRIDO.filter(({ desde, hasta }) => decideCambiarCielo(desde, hasta));

    expect(PARES_RECORRIDO).toHaveLength(RECORRIDO.length * RECORRIDO.length);
    expect(cambian).toHaveLength(PARES_RECORRIDO.length - RECORRIDO.length);
    expect(cambian.every(({ desde, hasta }) => desde !== hasta)).toBe(true);
  });

  it("dos rutas de la misma escena no cambian el cielo aunque difiera su carga", () => {
    // `archivo?y=2011 → archivo?y=2013`: misma escena, el bucle sigue vivo.
    const desde: RutaParsed = { name: "archivo", path: "/archivo", year: 2011 };
    const hasta: RutaParsed = { name: "archivo", path: "/archivo", year: 2013 };

    expect(decideCambiarCielo(desde.name, hasta.name)).toBe(false);
  });

  it("todo par que disuelve el fondo cambia también de cielo", () => {
    fc.assert(
      fc.property(nombre(), nombre(), (desde: NombreEscenaCielo, hasta: NombreEscenaCielo) => {
        if (!disuelveFondo(desde, hasta)) return;

        expect(decideCambiarCielo(desde, hasta)).toBe(true);
      }),
      ITERACIONES,
    );
  });
});
/* ------------------------------------------------------------------------- *
 * Ejemplos: los puntos de extensión siguen vacíos y crossfade es la única
 *
 * Tres hechos exactos, sin generadores de valores libres (son ejemplos, no
 * propiedades, así que no llevan `numRuns`):
 *
 * - Req 7.6 · `transicionesNombradas` tiene exactamente las seis claves
 *   `bolsa`, `sintonia`, `estatica`, `lcdBoot`, `revelado` y `posarse`, todas
 *   con valor `null` y ninguna implementación.
 * - Req 7.9 · `elegirTransicion()` devuelve `"crossfade"` al resolver la
 *   transición de cualquier par de escenas.
 * - Req 7.5 · `crossfade` es por tanto la única transición aplicada, y el único
 *   par que además disuelve el fondo es `home → hook`.
 *
 * El recorrido de los 49 pares reutiliza `PARES_RECORRIDO` de la Propiedad 14:
 * `elegirTransicion` no recibe argumentos —la decisión no depende del par—, así
 * que el barrido comprueba justamente esa invariancia.
 *
 * **Validates: Requirements 7.5, 7.6, 7.9**
 * ------------------------------------------------------------------------- */

/** Las seis entradas que el alcance deja sin implementar (Req 7.6). */
const CLAVES_NOMBRADAS: readonly Exclude<TransicionNombre, "crossfade">[] = [
  "bolsa",
  "sintonia",
  "estatica",
  "lcdBoot",
  "revelado",
  "posarse",
];

/** El único nombre de transición que el Director selecciona (Req 7.9). */
const TRANSICION_UNICA: TransicionNombre = "crossfade";

describe("Ejemplos: transicionesNombradas sigue vacía y crossfade es la única transición", () => {
  it("tiene exactamente las seis claves declaradas, sin sobrantes ni faltantes", () => {
    expect(Object.keys(transicionesNombradas).sort()).toEqual([...CLAVES_NOMBRADAS].sort());
  });

  it("las seis entradas valen null", () => {
    for (const clave of CLAVES_NOMBRADAS) {
      expect(transicionesNombradas[clave]).toBeNull();
    }
  });

  it("ninguna entrada trae implementación: no hay funciones ni objetos", () => {
    const valores = Object.values(transicionesNombradas);

    expect(valores).toHaveLength(CLAVES_NOMBRADAS.length);
    expect(valores.every((valor) => valor === null)).toBe(true);
    expect(valores.some((valor) => typeof valor === "function")).toBe(false);
  });

  it("crossfade no figura entre las entradas nombradas", () => {
    expect(Object.keys(transicionesNombradas)).not.toContain(TRANSICION_UNICA);
  });

  it("elegirTransicion devuelve crossfade", () => {
    expect(elegirTransicion()).toBe(TRANSICION_UNICA);
  });

  it("elegirTransicion devuelve crossfade para los 49 pares del recorrido", () => {
    const elegidas = new Set(PARES_RECORRIDO.map(() => elegirTransicion()));

    expect(PARES_RECORRIDO).toHaveLength(RECORRIDO.length * RECORRIDO.length);
    expect([...elegidas]).toEqual([TRANSICION_UNICA]);
  });

  it("el par que disuelve el fondo también resuelve a crossfade", () => {
    // Req 7.5: la disolución se suma al crossfade, no lo sustituye.
    expect(disuelveFondo(PAR_DISOLUCION.desde, PAR_DISOLUCION.hasta)).toBe(true);
    expect(elegirTransicion()).toBe(TRANSICION_UNICA);
  });
});
