/**
 * Contratos de lo que el fondo vivo y el cielo tienen permitido animar
 * (tarea 12.4: Propiedad 8).
 *
 * Sigue la convención de property-based testing declarada en la cabecera de
 * `tests/fondo.curvas.test.ts` (Opción A del punto de decisión de la tarea 1.1):
 * runner vitest con `environment: "node"`, generadores de `fast-check` fijado en
 * `4.3.0` dentro de `devDependencies`, y `{ numRuns: 200 }` en cada propiedad.
 *
 * Las tablas de motion son estáticas, así que el espacio de entrada de la
 * propiedad son sus propias entradas: cada tabla se aplana en una lista de
 * `EntradaMotion` (nombre + claves animadas) y `fast-check` recorre esa lista
 * junto con los parámetros libres que sí varían (`tope` del scrub, nombre de
 * escena y modo del cielo). Así la propiedad sigue siendo universal sobre todo
 * lo que existe y no se convierte en una lista de aserciones puntuales.
 *
 * Requirements: 1.3, 2.8, 3.3, 5.7, 6.8, 10.3, 10.4, 10.6, 12.5, 13.7
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import fc from "fast-check";

import {
  BUCLE_EQ,
  BUCLE_HALO,
  BUCLE_ONDA,
  ENTRADA_ECOS,
  ENTRADA_FOTO,
  IDLE_FOTO,
  PARALLAX,
  PROPS_LAYOUT,
  PROPS_PERMITIDAS,
  SELECTORES_FONDO,
  Z_GRAIN,
  Z_OVERLAYS,
  keyframesFondo,
  topeOverlay,
} from "../src/escenas/home/fondo.curvas";
import type {
  BucleFondo,
  Keyframe,
  VarianteFondo,
} from "../src/escenas/home/fondo.curvas";
import {
  OBJETIVOS_CIELO,
  RECORRIDO,
  perfilDe,
} from "../src/motion/cielo.perfiles";
import type { ModoCielo, NombreEscena, PerfilCielo } from "../src/motion/cielo.perfiles";

const ITERACIONES = { numRuns: 200 } as const;

/**
 * Lista blanca del enunciado: `transform` y sus componentes, `opacity`,
 * `filter`, atributos de trazado SVG y las tres variables de paleta. Nada más
 * puede aparecer como clave animada en ninguna tabla (Req 1.3, 2.8, 13.7).
 */
const LISTA_BLANCA_ANIMABLE: readonly string[] = [
  // `transform` y sus componentes tal como los nombra GSAP.
  "transform",
  "scale",
  "scaleX",
  "scaleY",
  "x",
  "y",
  "rotation",
  "transformOrigin",
  // Las dos propiedades compuestas admitidas.
  "opacity",
  "filter",
  // Atributos de trazado SVG de la onda.
  "d",
  "points",
  "stroke-dashoffset",
  // Paleta: única vía de color, vía `aplicarPaleta` (Req 10.5).
  "--c1",
  "--c2",
  "--c3",
] as const;

/**
 * Lista negra de objetivos: el grano y su canvas (Req 10.3, 10.4), el cue y los
 * fragmentos que gobierna `Orbita_Home` (Req 3.3, 5.7) y el play, las carátulas
 * y la órbita, que el fondo no toca nunca (Req 6.8).
 */
const PATRONES_PROHIBIDOS: readonly { readonly nombre: string; readonly patron: RegExp }[] = [
  { nombre: ".grano", patron: /\.grano\b/ },
  { nombre: "canvas", patron: /\bcanvas\b/ },
  { nombre: ".home__cue", patron: /\.home__cue\b/ },
  { nombre: ".home__fragmentos", patron: /\.home__fragmentos\b/ },
  { nombre: ".home__play*", patron: /\.home__play/ },
  { nombre: ".collage article", patron: /\.collage\s+article\b/ },
  { nombre: ".home__orbita", patron: /\.home__orbita\b/ },
] as const;

/** Una entrada de tabla de motion aplanada: de dónde viene y qué anima. */
type EntradaMotion = { readonly nombre: string; readonly claves: readonly string[] };

const VARIANTES: readonly VarianteFondo[] = ["amplio", "compacto"] as const;

/**
 * Claves de un bucle del fondo: sus `props` declaradas más `filter` cuando el
 * bucle trae tramo de filtro (la onda con su desenfoque, el halo con su brillo).
 */
function clavesBucle(bucle: BucleFondo): readonly string[] {
  const claves: string[] = [...bucle.props];
  if (bucle.filtro !== undefined) claves.push("filter");
  return claves;
}

/**
 * Clave CSS real de un keyframe del scrub: `opacity` se escribe como tal y
 * `brightness` viaja dentro de `filter` (`cadenaBrillo`), nunca como propiedad
 * propia.
 */
function claveKeyframe(keyframe: Keyframe): string {
  return keyframe.prop === "brightness" ? "filter" : "opacity";
}

/**
 * Claves que un `PerfilCielo` puede escribir sobre `.mundo__bg` / `.mundo__veil`:
 * las cuatro magnitudes de reposo (`opacity`, `scale`, `filter`), lo que añada su
 * bucle y las variables de paleta cuando declara color de reposo.
 */
function clavesPerfilCielo(perfil: PerfilCielo): readonly string[] {
  // veloOpacidad / cieloOpacidad → opacity · veloEscala / cieloEscala → scale
  // cieloBrillo → filter: brightness()
  const claves: string[] = ["opacity", "scale", "filter"];

  const bucle = perfil.bucle;
  if (bucle !== null) {
    if (bucle.tipo === "respiracion") claves.push("opacity");
    else if (bucle.tipo === "deriva") claves.push("x", "y");
    else claves.push("--c1", "--c2", "--c3");
  }

  if (perfil.paletaReposo !== null) claves.push("--c1", "--c2", "--c3");

  return claves;
}

/**
 * Traducción de los campos de valor de las tablas declarativas a la clave CSS
 * que acaban escribiendo. `duracion`, `ease`, `paso`, `corte` y `total` son
 * tiempos, no propiedades, así que no aparecen: el control de campos de más
 * abajo se encarga de que ningún campo nuevo pase inadvertido.
 */
const CLAVES_POR_CAMPO: Readonly<Record<string, readonly string[]>> = {
  escala: ["scale"], // ENTRADA_FOTO
  opacidad: ["opacity"], // ENTRADA_FOTO
  y: ["y", "opacity"], // ENTRADA_ECOS: `y 12 → 0` junto a `opacity 0 → 1` (Req 3.1)
  alcance: ["x", "y"], // PARALLAX: ±12 px en los dos ejes (Req 4.2)
} as const;

/** Campos de tiempo o easing: no son propiedades animadas. */
const CAMPOS_TEMPORALES: readonly string[] = ["duracion", "ease", "paso", "corte", "total"] as const;

/**
 * Claves animadas por una tabla declarativa, leídas de sus propios campos: así
 * la propiedad recorre la tabla y no una copia de sus valores. Un campo sin
 * traducción devuelve su propio nombre, de modo que un campo nuevo sin mapear
 * cae fuera de la lista blanca y la propiedad falla.
 */
function clavesDeTabla(tabla: Readonly<Record<string, unknown>>): readonly string[] {
  const claves: string[] = [];

  for (const campo of Object.keys(tabla)) {
    if (CAMPOS_TEMPORALES.includes(campo)) continue;
    const traducidas = CLAVES_POR_CAMPO[campo];
    claves.push(...(traducidas === undefined ? [campo] : traducidas));
  }

  return claves;
}

/**
 * Todas las entradas de motion del fondo salvo los keyframes del scrub, que
 * dependen del `tope` y se generan aparte: entrada y respiración de la foto en
 * ambas variantes, los tres bucles overlay en ambas variantes, la cascada de
 * ecos y el parallax de puntero.
 */
function entradasFondo(): readonly EntradaMotion[] {
  const entradas: EntradaMotion[] = [];

  for (const variante of VARIANTES) {
    entradas.push({
      nombre: `ENTRADA_FOTO.${variante}`,
      claves: clavesDeTabla(ENTRADA_FOTO[variante]),
    });
    entradas.push({
      nombre: `IDLE_FOTO.${variante}`,
      claves: clavesBucle(IDLE_FOTO[variante]),
    });

    const overlays: readonly { readonly capa: string; readonly bucle: BucleFondo | null }[] = [
      { capa: "onda", bucle: BUCLE_ONDA[variante] },
      { capa: "eq", bucle: BUCLE_EQ[variante] },
      { capa: "halo", bucle: BUCLE_HALO[variante] },
    ];

    for (const overlay of overlays) {
      if (overlay.bucle === null) continue;
      entradas.push({
        nombre: `BUCLE_${overlay.capa.toUpperCase()}.${variante}`,
        claves: clavesBucle(overlay.bucle),
      });
    }
  }

  // La cascada de ecos solo toca `opacity` y `y` (Req 3.1, 3.5).
  entradas.push({ nombre: "ENTRADA_ECOS", claves: clavesDeTabla(ENTRADA_ECOS) });
  // El parallax solo desplaza `.home__fondo` en los dos ejes (Req 4.2).
  entradas.push({ nombre: "PARALLAX", claves: clavesDeTabla(PARALLAX) });

  return entradas;
}

/** Comprueba una clave contra la lista blanca y contra la lista de layout. */
function claveAdmitida(clave: string): boolean {
  return LISTA_BLANCA_ANIMABLE.includes(clave) && !PROPS_LAYOUT.includes(clave);
}

const entradaDeFondo = (): fc.Arbitrary<EntradaMotion> => fc.constantFrom(...entradasFondo());

/** Cualquier tope de opacidad, incluidos los dos reales de `topeOverlay`. */
const topeCualquiera = (): fc.Arbitrary<number> =>
  fc.oneof(
    fc.constantFrom(topeOverlay(true), topeOverlay(false)),
    fc.double({ min: 0, max: 1, noNaN: true }),
  );

const escenaDelRecorrido = (): fc.Arbitrary<NombreEscena> => fc.constantFrom(...RECORRIDO);

const modoCielo = (): fc.Arbitrary<ModoCielo> =>
  fc.record({ quieto: fc.boolean(), compacto: fc.boolean() });

const objetivoAnimable = (): fc.Arbitrary<string> =>
  fc.constantFrom(...SELECTORES_FONDO, ...OBJETIVOS_CIELO);

const patronProhibido = (): fc.Arbitrary<(typeof PATRONES_PROHIBIDOS)[number]> =>
  fc.constantFrom(...PATRONES_PROHIBIDOS);

const capaOverlay = (): fc.Arbitrary<keyof typeof Z_OVERLAYS> =>
  fc.constantFrom("onda", "eq", "halo");

/**
 * Property 8: Solo se animan propiedades permitidas y objetivos permitidos.
 *
 * **Validates: Requirements 1.3, 2.8, 3.3, 5.7, 6.8, 10.3, 10.4, 10.6, 12.5, 13.7**
 */
describe("Propiedad 8 · solo se animan propiedades permitidas y objetivos permitidos", () => {
  it("las tablas del fondo solo declaran claves de la lista blanca, disjuntas de PROPS_LAYOUT", () => {
    fc.assert(
      fc.property(entradaDeFondo(), (entrada: EntradaMotion) => {
        expect(entrada.claves.length).toBeGreaterThan(0);

        for (const clave of entrada.claves) {
          expect(
            LISTA_BLANCA_ANIMABLE.includes(clave),
            `${entrada.nombre} anima "${clave}", fuera de la lista blanca`,
          ).toBe(true);
          expect(
            PROPS_LAYOUT.includes(clave),
            `${entrada.nombre} anima "${clave}", que es propiedad de layout`,
          ).toBe(false);
        }

        return true;
      }),
      ITERACIONES,
    );
  });

  it("los keyframes del scrub solo escriben opacity y filter, para cualquier tope", () => {
    fc.assert(
      fc.property(topeCualquiera(), (tope: number) => {
        const keyframes = keyframesFondo(tope);
        expect(keyframes.length).toBeGreaterThan(0);

        for (const keyframe of keyframes) {
          const clave = claveKeyframe(keyframe);
          expect(claveAdmitida(clave), `el scrub escribe "${clave}"`).toBe(true);
          // `prop` es el canal declarado por el diseño: nunca una propiedad de layout.
          expect(PROPS_LAYOUT.includes(keyframe.prop)).toBe(false);
        }

        return true;
      }),
      ITERACIONES,
    );
  });

  it("todo PerfilCielo, en toda escena y todo modo, se queda en la lista blanca", () => {
    fc.assert(
      fc.property(escenaDelRecorrido(), modoCielo(), (nombre: NombreEscena, modo: ModoCielo) => {
        const perfil = perfilDe(nombre, modo);

        for (const clave of clavesPerfilCielo(perfil)) {
          expect(
            claveAdmitida(clave),
            `el perfil de ${nombre} escribe "${clave}"`,
          ).toBe(true);
        }

        return true;
      }),
      ITERACIONES,
    );
  });

  it("ningún objetivo del fondo ni del cielo cae en la lista negra de selectores", () => {
    fc.assert(
      fc.property(
        objetivoAnimable(),
        patronProhibido(),
        (selector: string, prohibido: (typeof PATRONES_PROHIBIDOS)[number]) => {
          expect(
            prohibido.patron.test(selector),
            `${selector} coincide con ${prohibido.nombre}`,
          ).toBe(false);

          return true;
        },
      ),
      ITERACIONES,
    );
  });

  it("todo z-index de las overlays es estrictamente menor que --z-grain", () => {
    fc.assert(
      fc.property(capaOverlay(), (capa: keyof typeof Z_OVERLAYS) => {
        expect(Z_OVERLAYS[capa]).toBeLessThan(Z_GRAIN);
        return true;
      }),
      ITERACIONES,
    );
  });
});

describe("Propiedad 8 · controles de las dos listas", () => {
  it("PROPS_PERMITIDAS cabe en la lista blanca y no se cruza con PROPS_LAYOUT", () => {
    for (const prop of PROPS_PERMITIDAS) {
      expect(LISTA_BLANCA_ANIMABLE.includes(prop)).toBe(true);
      expect(PROPS_LAYOUT.includes(prop)).toBe(false);
    }
  });

  it("la lista negra sí detecta los selectores que prohíbe", () => {
    const prohibidos: readonly string[] = [
      ".grano",
      ".grano canvas",
      "canvas",
      ".home__cue",
      ".home__fragmentos",
      ".home__play",
      ".home__play-destello",
      ".collage article",
      ".home__orbita",
    ];

    for (const selector of prohibidos) {
      expect(
        PATRONES_PROHIBIDOS.some((p) => p.patron.test(selector)),
        `${selector} debería estar prohibido`,
      ).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------------- *
 * Comprobaciones estáticas de fuente (tarea 12.5) se añaden a continuación.
 * ------------------------------------------------------------------------- */
/** Archivos que esta funcionalidad crea o modifica. Las tareas 14.1, 15.1 y 17.1 añadirán entradas. */
const ARCHIVOS: readonly string[] = [
  "src/escenas/home/fondo.curvas.ts",
  "src/escenas/home/fondo.ts",
  "src/escenas/home/FondoHome.svelte",
  "src/escenas/home/Home.svelte",
  "src/motion/cielo.perfiles.ts",
  "src/motion/cielo.ts",
  "src/motion/fps.ts",
  "src/escenas/director/transiciones.ts",
  "src/escenas/director/Director.svelte",
];

/** Prohibidos por Req 14.1–14.3, 14.7 y 10.3. */
const PROHIBIDOS: readonly string[] = [
  "registerPlugin",
  'from "gsap/',
  "SplitText",
  "MorphSVG",
  "lenis",
  ".grano",
  ": any",
  "@ts-ignore",
  "@ts-expect-error",
];

/** Fuente sin comentarios: una mención en prosa no puede suspender un contrato de código. */
function sinComentarios(fuente: string): string {
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((linea) => !linea.trimStart().startsWith("//"))
    .join("\n");
}

function leer(relativa: string): string {
  return readFileSync(fileURLToPath(new URL(`../${relativa}`, import.meta.url)), "utf8");
}

describe("contratos estáticos de fuente · dependencias y supresiones", () => {
  it("ninguno de los archivos tocados contiene un término prohibido", () => {
    for (const archivo of ARCHIVOS) {
      const codigo = sinComentarios(leer(archivo));
      for (const prohibido of PROHIBIDOS) {
        expect(codigo, `${archivo} contiene "${prohibido}"`).not.toContain(prohibido);
      }
    }
  });
});

/**
 * Términos en inglés que ningún nombre exportado puede llevar: el código de esta
 * funcionalidad se nombra en español (Req 14.6, 14.8).
 */
const TERMINOS_PROHIBIDOS: readonly string[] = [
  "background",
  "layer",
  "photo",
  "sky",
  "loop",
  "wrapper",
  "helper",
  "handler",
  "manager",
  "utils",
  "temp",
  "foo",
];

/** Solo los módulos TypeScript: los `.svelte` no exportan nombres a nivel de módulo. */
const MODULOS_TS: readonly string[] = ARCHIVOS.filter((archivo) => archivo.endsWith(".ts"));

/** Nombres exportados de un módulo: `export const|function|type|class NOMBRE`. */
function nombresExportados(codigo: string): readonly string[] {
  return [...codigo.matchAll(/export\s+(?:const|function|type|class)\s+(\w+)/g)].map((m) => m[1]);
}

describe("contratos estáticos de fuente · convención de nombres", () => {
  it("todo nombre exportado es lowerCamelCase o PascalCase, sin términos en inglés", () => {
    for (const archivo of MODULOS_TS) {
      const nombres = nombresExportados(leer(archivo));
      expect(nombres.length, `${archivo} no exporta nada`).toBeGreaterThan(0);

      for (const nombre of nombres) {
        // `lowerCamelCase` para funciones y valores, `PascalCase` para tipos, y
        // `SCREAMING_SNAKE_CASE` para las constantes de tabla, que es la
        // convención que el propio módulo puro ya usa.
        expect(
          /^[a-z][A-Za-z0-9]*$|^[A-Z][A-Za-z0-9]*$|^[A-Z][A-Z0-9_]*$/.test(nombre),
          `${archivo} exporta "${nombre}" con un caso inesperado`,
        ).toBe(true);

        for (const termino of TERMINOS_PROHIBIDOS) {
          expect(
            nombre.toLowerCase().includes(termino),
            `${archivo} exporta "${nombre}", que usa el término inglés "${termino}"`,
          ).toBe(false);
        }
      }
    }
  });
});
