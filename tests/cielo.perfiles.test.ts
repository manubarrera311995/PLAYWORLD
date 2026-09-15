/**
 * Propiedades y ejemplos de `src/motion/cielo.perfiles.ts`.
 *
 * Sigue la convención de property-based testing declarada en la cabecera de
 * `tests/fondo.curvas.test.ts` (Opción A del punto de decisión de la tarea 1.1):
 * runner vitest con `environment: "node"`, generadores de `fast-check` fijado en
 * `4.3.0` dentro de `devDependencies`, y `{ numRuns: 200 }` en cada propiedad.
 */

import { describe, expect, it } from "vitest";
import fc from "fast-check";

import {
  BASE_CIELO,
  PERFILES_AMPLIO,
  RANGOS_CIELO,
  RECORRIDO,
  UMBRALES_CONTRASTE,
  contrasteSuficiente,
  derivaPx,
  duracionCielo,
  esEscenaConocida,
  perfilDe,
  valoresCieloEn,
  type ModoCielo,
  type NombreEscena,
} from "../src/motion/cielo.perfiles";
import {
  CONDICIONES_MM,
  ENTRADA_FOTO,
  IDLE_FOTO,
} from "../src/escenas/home/fondo.curvas";

const ITERACIONES = { numRuns: 200 } as const;

/** Tope duro de la deriva: 2 % del ancho y del alto del viewport (Req 9.6). */
const DERIVA_MAX_FRACCION = 0.02;

/** Holgura para que las comparaciones con los topes no fallen por coma flotante. */
const EPSILON = 1e-9;

/** Los siete nombres del recorrido, la entrada legítima de `perfilDe`. */
const escenaDelRecorrido = (): fc.Arbitrary<NombreEscena> =>
  fc.constantFrom(...RECORRIDO);

/** Las cuatro combinaciones de modo: amplio/compacto × movimiento/quieto. */
const modoCielo = (): fc.Arbitrary<ModoCielo> =>
  fc.record({ quieto: fc.boolean(), compacto: fc.boolean() });

/** Instante del ciclo en fracciones: `0` y `1` son el mismo punto. */
const instanteDelCiclo = (): fc.Arbitrary<number> =>
  fc.double({ min: 0, max: 1, noNaN: true });

/** Viewports positivos y realistas, más los extremos degenerados de 1 px. */
const viewportPositivo = (): fc.Arbitrary<{ ancho: number; alto: number }> =>
  fc.record({
    ancho: fc.double({ min: 1, max: 8000, noNaN: true }),
    alto: fc.double({ min: 1, max: 8000, noNaN: true }),
  });

describe("Property 5: el cielo nunca sale de sus rangos de seguridad", () => {
  it("las cuatro magnitudes se mantienen en RANGOS_CIELO en todo instante del ciclo", () => {
    fc.assert(
      fc.property(
        escenaDelRecorrido(),
        modoCielo(),
        instanteDelCiclo(),
        (nombre: NombreEscena, modo: ModoCielo, t: number) => {
          const valores = valoresCieloEn(perfilDe(nombre, modo), t);

          expect(valores.veloOpacidad).toBeGreaterThanOrEqual(
            RANGOS_CIELO.veloOpacidad.min - EPSILON,
          );
          expect(valores.veloOpacidad).toBeLessThanOrEqual(
            RANGOS_CIELO.veloOpacidad.max + EPSILON,
          );

          expect(valores.veloEscala).toBeGreaterThanOrEqual(
            RANGOS_CIELO.veloEscala.min - EPSILON,
          );
          expect(valores.veloEscala).toBeLessThanOrEqual(
            RANGOS_CIELO.veloEscala.max + EPSILON,
          );

          expect(valores.cieloOpacidad).toBeGreaterThanOrEqual(
            RANGOS_CIELO.cieloOpacidad.min - EPSILON,
          );
          expect(valores.cieloOpacidad).toBeLessThanOrEqual(
            RANGOS_CIELO.cieloOpacidad.max + EPSILON,
          );

          expect(valores.cieloBrillo).toBeGreaterThanOrEqual(
            RANGOS_CIELO.cieloBrillo.min - EPSILON,
          );
          expect(valores.cieloBrillo).toBeLessThanOrEqual(
            RANGOS_CIELO.cieloBrillo.max + EPSILON,
          );
        },
      ),
      ITERACIONES,
    );
  });

  it("derivaPx no supera el 2 % del ancho ni del alto para todo viewport positivo", () => {
    fc.assert(
      fc.property(
        escenaDelRecorrido(),
        modoCielo(),
        viewportPositivo(),
        (
          nombre: NombreEscena,
          modo: ModoCielo,
          viewport: { ancho: number; alto: number },
        ) => {
          const { x, y } = derivaPx(perfilDe(nombre, modo), viewport.ancho, viewport.alto);

          expect(Math.abs(x)).toBeLessThanOrEqual(
            viewport.ancho * DERIVA_MAX_FRACCION + EPSILON,
          );
          expect(Math.abs(y)).toBeLessThanOrEqual(
            viewport.alto * DERIVA_MAX_FRACCION + EPSILON,
          );
        },
      ),
      ITERACIONES,
    );
  });
});

/**
 * Índice del primer miembro de un par consecutivo del `RECORRIDO`. Con siete
 * escenas hay exactamente seis pares: `home→hook` … `creacion→colectiva`.
 */
const indiceDeParConsecutivo = (): fc.Arbitrary<number> =>
  fc.integer({ min: 0, max: RECORRIDO.length - 2 });

/**
 * Property 6: escenas consecutivas se distinguen por el fondo.
 *
 * **Validates: Requirements 9.8, 15.2**
 */
describe("Property 6: escenas consecutivas se distinguen por el fondo", () => {
  it("los seis pares consecutivos del RECORRIDO tienen contraste suficiente en ambos modos", () => {
    fc.assert(
      fc.property(
        indiceDeParConsecutivo(),
        modoCielo(),
        (indice: number, modo: ModoCielo) => {
          const nombreA = RECORRIDO[indice] as NombreEscena;
          const nombreB = RECORRIDO[indice + 1] as NombreEscena;
          const a = perfilDe(nombreA, modo);
          const b = perfilDe(nombreB, modo);

          expect(contrasteSuficiente(a, b)).toBe(true);

          // El veredicto se sostiene por al menos uno de los tres umbrales
          // declarados, no por la mera llamada a `contrasteSuficiente`.
          const alcanza = (diferencia: number, umbral: number): boolean =>
            Math.abs(diferencia) >= umbral - EPSILON;

          const umbralAlcanzado =
            alcanza(a.veloOpacidad - b.veloOpacidad, UMBRALES_CONTRASTE.veloOpacidad) ||
            alcanza(a.veloEscala - b.veloEscala, UMBRALES_CONTRASTE.veloEscala) ||
            alcanza(a.cieloBrillo - b.cieloBrillo, UMBRALES_CONTRASTE.cieloBrillo);

          expect(umbralAlcanzado).toBe(true);
        },
      ),
      ITERACIONES,
    );
  });
});

/** Tope de la transición de carácter en modo quieto (Req 11.4, 11.5). */
const DURACION_QUIETO_MAX = 0.2;

/** Los tres tipos de bucle que declara `BucleCielo`; no hay un cuarto. */
const TIPOS_DE_BUCLE: readonly string[] = ["respiracion", "deriva", "sintonia"];

/**
 * Nombres de entrada de `perfilDe`, que recibe `string` y no `NombreEscena`.
 * El generador mezcla a propósito tres familias para no gastar iteraciones en
 * cadenas irrelevantes:
 *
 * 1. los siete nombres legítimos del recorrido,
 * 2. casi-aciertos que un error de normalización dejaría pasar (mayúsculas,
 *    espacios, sufijos, rutas),
 * 3. cadenas arbitrarias, incluida la vacía y las de Unicode.
 */
const nombreArbitrario = (): fc.Arbitrary<string> =>
  fc.oneof(
    { arbitrary: fc.constantFrom<string>(...RECORRIDO), weight: 3 },
    {
      arbitrary: fc.constantFrom<string>(
        "",
        " ",
        "Home",
        "HOOK",
        " archivo",
        "archivo ",
        "edicion/1998",
        "/ipod",
        "creacion?x=1",
        "colectivas",
        "colectiv",
        "toString",
        "constructor",
        "__proto__",
        "hasOwnProperty",
      ),
      weight: 2,
    },
    { arbitrary: fc.string(), weight: 3 },
    { arbitrary: fc.string({ unit: "grapheme" }), weight: 1 },
  );

/**
 * Property 7: `perfilDe` es total, y en quieto no hay bucles.
 *
 * **Validates: Requirements 8.8, 9.11, 11.5, 13.6**
 */
describe("Property 7: perfilDe es total, y en quieto no hay bucles", () => {
  it("toda cadena y todo modo devuelven un perfil válido sin lanzar", () => {
    fc.assert(
      fc.property(nombreArbitrario(), modoCielo(), (nombre: string, modo: ModoCielo) => {
        const perfil = perfilDe(nombre, modo);

        // Totalidad: hay perfil, con las siete claves y las seis numéricas finitas.
        expect(perfil).toBeTypeOf("object");
        expect(Number.isFinite(perfil.veloOpacidad)).toBe(true);
        expect(Number.isFinite(perfil.veloEscala)).toBe(true);
        expect(Number.isFinite(perfil.cieloOpacidad)).toBe(true);
        expect(Number.isFinite(perfil.cieloBrillo)).toBe(true);
        expect(Number.isFinite(perfil.cieloEscala)).toBe(true);
        expect(perfil.bucle === null || typeof perfil.bucle === "object").toBe(true);
      }),
      ITERACIONES,
    );
  });

  it("un nombre fuera del recorrido devuelve exactamente BASE_CIELO sin bucle", () => {
    fc.assert(
      fc.property(nombreArbitrario(), modoCielo(), (nombre: string, modo: ModoCielo) => {
        fc.pre(!esEscenaConocida(nombre));

        const perfil = perfilDe(nombre, modo);

        expect(perfil).toEqual(BASE_CIELO);
        expect(perfil.bucle).toBeNull();
        expect(perfil.paletaReposo).toBeNull();
      }),
      ITERACIONES,
    );
  });

  it("con quieto activo ningún nombre declara bucle y la duración no pasa de 0.2 s", () => {
    fc.assert(
      fc.property(
        nombreArbitrario(),
        fc.boolean(),
        (nombre: string, compacto: boolean) => {
          const modo: ModoCielo = { quieto: true, compacto };

          expect(perfilDe(nombre, modo).bucle).toBeNull();
          expect(duracionCielo(modo)).toBeLessThanOrEqual(DURACION_QUIETO_MAX);
        },
      ),
      ITERACIONES,
    );
  });

  it("como máximo un bucle declarado por escena en cualquier modo", () => {
    fc.assert(
      fc.property(nombreArbitrario(), modoCielo(), (nombre: string, modo: ModoCielo) => {
        const bucle = perfilDe(nombre, modo).bucle;
        if (bucle === null) return;

        // `bucle` es un único objeto, nunca una colección: no hay forma de
        // declarar dos bucles simultáneos para la misma escena (Req 13.6).
        expect(Array.isArray(bucle)).toBe(false);
        expect(TIPOS_DE_BUCLE).toContain(bucle.tipo);
        expect(Number.isFinite(bucle.tipo === "sintonia" ? bucle.tramo : bucle.ciclo)).toBe(
          true,
        );
      }),
      ITERACIONES,
    );
  });
});
/**
 * Ejemplos de las tablas. No son propiedades: fijan los valores literales que
 * la especificación nombra, de modo que un cambio accidental en una tabla se
 * vea como un fallo concreto y no como una cota que sigue cumpliéndose.
 *
 * **Validates: Requirements 9.7, 11.6, 12.7**
 */
describe("Ejemplos: las tablas declaran los valores exactos de la especificación", () => {
  it("BASE_CIELO es el estado base: velo 0.70 sin escala, cielo opaco y sin bucle", () => {
    expect(BASE_CIELO).toEqual({
      veloOpacidad: 0.7,
      veloEscala: 1,
      cieloOpacidad: 1,
      cieloBrillo: 1,
      cieloEscala: 1,
      bucle: null,
      paletaReposo: null,
    });
  });

  it("PERFILES_AMPLIO.home es exactamente BASE_CIELO", () => {
    // La igualdad es referencial a propósito: `home` no redeclara valores, cede
    // la apariencia visible a `Fondo_Home` (Req 9.7).
    expect(PERFILES_AMPLIO.home).toBe(BASE_CIELO);
    expect(perfilDe("home", { quieto: false, compacto: false })).toEqual(BASE_CIELO);
    expect(perfilDe("home", { quieto: false, compacto: true })).toEqual(BASE_CIELO);
  });

  it("ENTRADA_FOTO parte de 1.06 en amplio y de 1.04 en compacto, ambos desde opacidad 0.65", () => {
    expect(ENTRADA_FOTO.amplio).toEqual({
      escala: 1.06,
      opacidad: 0.65,
      duracion: 1.0,
      ease: "power2.out",
    });
    expect(ENTRADA_FOTO.compacto).toEqual({
      escala: 1.04,
      opacidad: 0.65,
      duracion: 1.0,
      ease: "power2.out",
    });

    // Req 12.7: en compacto la escala inicial no pasa de 1.04 y la duración
    // cae dentro de la ventana declarada.
    expect(ENTRADA_FOTO.compacto.escala).toBeLessThanOrEqual(1.04);
    expect(ENTRADA_FOTO.compacto.duracion).toBeGreaterThanOrEqual(0.8);
    expect(ENTRADA_FOTO.compacto.duracion).toBeLessThanOrEqual(1.2);
  });

  it("IDLE_FOTO es un único bucle de `scale` con yoyo: 1↔1.08 / 16 s en amplio y 1↔1.04 / 14 s en compacto", () => {
    expect(IDLE_FOTO.amplio).toEqual({
      objetivo: "foto",
      props: ["scale"],
      desde: 1,
      hasta: 1.08,
      tramo: 16,
      ease: "sine.inOut",
      desfase: 0,
      yoyo: true,
    });
    expect(IDLE_FOTO.compacto).toEqual({
      objetivo: "foto",
      props: ["scale"],
      desde: 1,
      hasta: 1.04,
      tramo: 14,
      ease: "sine.inOut",
      desfase: 0,
      yoyo: true,
    });

    // Req 12.7 · 12.1: en compacto el tramo no baja de 12 s y el recorrido de
    // escala se queda en 1.04.
    expect(IDLE_FOTO.compacto.tramo).toBeGreaterThanOrEqual(12);
    expect(IDLE_FOTO.compacto.hasta).toBeLessThanOrEqual(IDLE_FOTO.amplio.hasta);
  });

  it("CONDICIONES_MM declara exactamente las tres claves de matchMedia, sin extras", () => {
    expect(Object.keys(CONDICIONES_MM)).toEqual(["isReduce", "isMotion", "isCompacto"]);
    expect(CONDICIONES_MM).toEqual({
      isReduce: "(prefers-reduced-motion: reduce)",
      isMotion: "(prefers-reduced-motion: no-preference)",
      isCompacto: "(max-width: 767px)",
    });
  });
});
