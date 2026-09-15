/**
 * Convención de property-based testing de `fondo-vivo-recorrido`.
 *
 * PUNTO DE DECISIÓN (tarea 1.1) resuelto con la **Opción A** del plan, la que
 * propone el diseño en D7: `fast-check` fijado en `4.3.0` dentro de
 * `devDependencies` de `PLAYWORLD/package.json`. El bloque `dependencies` queda
 * con diff cero y la librería nunca se importa desde `PLAYWORLD/src/**`, así que
 * no entra en el grafo de `vite build` ni suma peso al bundle (Req 14.11).
 *
 * Convención única para las 14 propiedades de esta funcionalidad:
 *   - runner: vitest (`npm run test`, `environment: "node"`).
 *   - generadores: `import fc from "fast-check"`.
 *   - cada propiedad se ejecuta con `{ numRuns: 200 }` (Req 15.6, 15.10).
 */

import { describe, expect, it, vi } from "vitest";
import fc from "fast-check";

import {
  BUCLE_EQ,
  BUCLE_HALO,
  BUCLE_ONDA,
  DESFASES_OVERLAY,
  DESFASE_TOTAL_MAX,
  EASINGS_SUAVES,
  ENTRADA_ECOS,
  ENTRADA_FOTO,
  FRONTERAS_SCRUB,
  IDLE_FOTO,
  MAX_PASOS_ECOS,
  OVERLAY_EN_MESETA,
  PARALLAX,
  PASO_MINIMO_ECOS,
  P_PAUSA,
  RANGO_CICLO_OVERLAY,
  RANGO_DIFERENCIA_DESFASE,
  RANGO_TRAMO_FOTO,
  REPETICION_BUCLE,
  SELECTOR_ECO,
  SELECTOR_KICKER,
  VENTANA_ECOS,
  calendarioEcos,
  cantidadEcos,
  capacidadesSuficientes,
  cicloBucle,
  cicloEnRango,
  debenPausarBucles,
  desplazamientoParallax,
  diferenciasDesfase,
  esQuieto,
  esQuietoPorDefecto,
  interpolarKeyframe,
  keyframesFondo,
  objetivosEcos,
  parallaxActivo,
  pasoEcos,
  planFondo,
  salidaParallax,
  topeOverlay,
  valoresFondoEn,
  varianteFondo,
} from "../src/escenas/home/fondo.curvas";
import type {
  BucleFondo,
  Caja,
  Desplazamiento,
  Keyframe,
  ModoFondo,
  PuntoPuntero,
  ValoresFondo,
} from "../src/escenas/home/fondo.curvas";

const ITERACIONES = { numRuns: 200 } as const;

describe("base de property-based testing", () => {
  it("fast-check está disponible y corre 200 iteraciones por propiedad", () => {
    expect(ITERACIONES.numRuns).toBe(200);

    let corridas = 0;
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1, noNaN: true }), (p: number) => {
        corridas += 1;
        return p >= 0 && p <= 1;
      }),
      ITERACIONES,
    );

    expect(corridas).toBe(200);
  });
});

describe("aritmética del scrub · valores exactos de la tabla del diseño", () => {
  it("topeOverlay es 0.30 con soporte de mezcla y 0.18 sin él", () => {
    expect(topeOverlay(true)).toBe(0.3);
    expect(topeOverlay(false)).toBe(0.18);
  });

  it("keyframesFondo declara los nueve tramos con las cuatro fronteras", () => {
    const keyframes = keyframesFondo(topeOverlay(true));

    expect(keyframes).toHaveLength(9);
    for (const frontera of FRONTERAS_SCRUB) {
      expect(keyframes.some((k) => k.inicio === frontera || k.fin === frontera)).toBe(true);
    }
  });

  it("la foto se atenúa por brillo en el tramo A sin tocar su opacidad", () => {
    const tope = topeOverlay(true);

    expect(valoresFondoEn(0, tope).fotoBrillo).toBe(1);
    expect(valoresFondoEn(0.05, tope).fotoBrillo).toBeCloseTo(0.93, 10);
    expect(valoresFondoEn(0.1, tope).fotoBrillo).toBe(0.86);
    expect(valoresFondoEn(1, tope).fotoBrillo).toBe(0.86);
    expect(valoresFondoEn(0.05, tope).fotoOpacidad).toBe(1);
  });

  it("las overlays bajan del tope a la meseta y de ahí al valor final", () => {
    const tope = topeOverlay(true);

    expect(valoresFondoEn(0, tope).overlayOpacidad).toBe(0.3);
    expect(valoresFondoEn(0.1, tope).overlayOpacidad).toBe(0.3);
    expect(valoresFondoEn(0.4, tope).overlayOpacidad).toBeCloseTo(0.2, 10);
    expect(valoresFondoEn(0.7, tope).overlayOpacidad).toBeCloseTo(0.1, 10);
    expect(valoresFondoEn(0.85, tope).overlayOpacidad).toBeCloseTo(0.04, 10);
    expect(valoresFondoEn(1, tope).overlayOpacidad).toBe(0.04);
  });

  it("la foto se apaga entre 0.85 y 0.95 y queda constante hasta el final", () => {
    const tope = topeOverlay(false);

    expect(valoresFondoEn(0.85, tope).fotoOpacidad).toBe(1);
    expect(valoresFondoEn(0.9, tope).fotoOpacidad).toBeCloseTo(0.54, 10);
    expect(valoresFondoEn(0.95, tope).fotoOpacidad).toBeCloseTo(0.08, 10);
    expect(valoresFondoEn(1, tope).fotoOpacidad).toBe(0.08);
  });

  it("valoresFondoEn está definida fuera de [0, 1] acotando a la frontera", () => {
    const tope = topeOverlay(true);

    expect(valoresFondoEn(-3, tope)).toEqual(valoresFondoEn(0, tope));
    expect(valoresFondoEn(4.5, tope)).toEqual(valoresFondoEn(1, tope));
  });

  it("debenPausarBucles corta exactamente en P_PAUSA", () => {
    expect(debenPausarBucles(0.0999)).toBe(false);
    expect(debenPausarBucles(P_PAUSA)).toBe(true);
    expect(debenPausarBucles(1)).toBe(true);
  });
});
/* ------------------------------------------------------------------------- *
 * Property 1: El scrub es una función pura de su progreso
 *
 * Para todo `p ∈ [0,1]`, todo tope válido y toda secuencia de evaluaciones
 * previas (incluidas secuencias que suben y bajan), `valoresFondoEn(p, tope)`
 * devuelve exactamente los mismos tres valores que la evaluación aislada del
 * mismo `p`, sin ninguna dependencia del progreso anterior.
 *
 * **Validates: Requirements 5.6, 15.10**
 * ------------------------------------------------------------------------- */

/** Topes válidos: los dos de la tabla y cualquier techo intermedio admisible. */
const topeValido: fc.Arbitrary<number> = fc.oneof(
  fc.constant(topeOverlay(true)),
  fc.constant(topeOverlay(false)),
  fc.double({ min: 0.05, max: 0.35, noNaN: true }),
);

/**
 * Progresos del scrub: mezcla de valores arbitrarios en `[0, 1]` con las cuatro
 * fronteras de tramo y los dos extremos, donde vive el riesgo de discontinuidad.
 */
const progreso: fc.Arbitrary<number> = fc.oneof(
  { weight: 3, arbitrary: fc.double({ min: 0, max: 1, noNaN: true }) },
  { weight: 1, arbitrary: fc.constantFrom(0, ...FRONTERAS_SCRUB, 1) },
);

/**
 * Recorrido que sube hasta el final y vuelve a bajar, tal como hace el scroll
 * real cuando el visitante avanza y retrocede sobre el home (Req 5.6).
 */
const recorridoSubeYBaja: fc.Arbitrary<readonly number[]> = fc
  .array(progreso, { minLength: 1, maxLength: 24 })
  .map((valores) => {
    const sube = [...valores].sort((a, b) => a - b);
    const baja = [...sube].reverse().slice(1);
    return [...sube, ...baja];
  });

describe("Property 1: el scrub es una función pura de su progreso", () => {
  it("cada evaluación de un recorrido que sube y baja coincide con la aislada", async () => {
    await fc.assert(
      fc.asyncProperty(recorridoSubeYBaja, topeValido, async (recorrido, tope) => {
        // Evaluación contaminada: el recorrido completo, en su orden real.
        const enRecorrido = recorrido.map((p) => valoresFondoEn(p, tope));

        // Evaluación aislada: módulo recién cargado, sin ninguna evaluación
        // previa, y recorrido en orden inverso para que ni el estado del módulo
        // ni el camino recorrido puedan coincidir por casualidad.
        vi.resetModules();
        const aislado = await import("../src/escenas/home/fondo.curvas");
        const indices = recorrido.map((_, i) => i).reverse();
        const enAislado: ValoresFondo[] = [];
        for (const i of indices) enAislado[i] = aislado.valoresFondoEn(recorrido[i], tope);

        expect(enRecorrido).toEqual(enAislado);
      }),
      ITERACIONES,
    );
  });

  it("el orden de las evaluaciones no altera ningún valor", () => {
    fc.assert(
      fc.property(recorridoSubeYBaja, topeValido, (recorrido, tope) => {
        const avanzando = recorrido.map((p) => valoresFondoEn(p, tope));

        const retrocediendo = [...recorrido].reverse().map((p) => valoresFondoEn(p, tope));
        retrocediendo.reverse();

        expect(retrocediendo).toEqual(avanzando);
      }),
      ITERACIONES,
    );
  });

  it("mutar un resultado no contamina las evaluaciones siguientes", () => {
    fc.assert(
      fc.property(progreso, progreso, topeValido, (anterior, p, tope) => {
        const esperado = valoresFondoEn(p, tope);

        const previo = valoresFondoEn(anterior, tope);
        previo.fotoOpacidad = Number.NaN;
        previo.fotoBrillo = Number.NaN;
        previo.overlayOpacidad = Number.NaN;

        expect(valoresFondoEn(p, tope)).toEqual(esperado);
      }),
      ITERACIONES,
    );
  });
});
/* ------------------------------------------------------------------------- *
 * Property 2: Monotonía por tramos del scrub
 *
 * Para todo par `p1 < p2` en `[0,1]`: `fotoBrillo(p1) ≥ fotoBrillo(p2)`,
 * `overlayOpacidad(p1) ≥ overlayOpacidad(p2)` y
 * `fotoOpacidad(p1) ≥ fotoOpacidad(p2)`; y `fotoOpacidad` permanece
 * exactamente en 1 para todo `p ≤ 0.85`, de modo que el tramo `[0, 0.10]`
 * atenúa la foto con una sola propiedad.
 *
 * **Validates: Requirements 5.3, 5.4, 5.5**
 * ------------------------------------------------------------------------- */

/**
 * Holgura de comparación. La interpolación lineal en doble precisión deja ruido
 * del orden de 1e-17 en las fronteras de tramo (p. ej. `0.3 + (0.1 - 0.3) * 1`
 * da 0.09999999999999998 mientras el tramo siguiente arranca en 0.1 exacto).
 * Req 5.6 admite hasta 0.01 por propiedad, así que 1e-9 sigue siendo nueve
 * órdenes de magnitud más estricto que el enunciado.
 */
const HOLGURA = 1e-9;

/**
 * Topes con los que la monotonía de las overlays está definida. `topeValido`
 * también genera techos intermedios por debajo de la meseta de 0.10, y un techo
 * por debajo de la meseta es contradictorio con su propio significado: obligaría
 * a la curva a **subir** de `tope` a 0.10 en el tramo `[0.10, 0.70]`. Los topes
 * que el código real produce son solo los dos de la tabla (0.30 y 0.18), ambos
 * por encima de la meseta.
 */
const topeAdmisible: fc.Arbitrary<number> = topeValido.filter((t) => t >= OVERLAY_EN_MESETA);

/** Par ordenado `p1 ≤ p2` construido con el mismo generador de progresos. */
const parCreciente: fc.Arbitrary<readonly [number, number]> = fc
  .tuple(progreso, progreso)
  .map(([a, b]) => (a <= b ? ([a, b] as const) : ([b, a] as const)));

/** Progresos del tramo en el que la `opacity` de la foto debe seguir en 1 exacto. */
const progresoAntesDelApagado: fc.Arbitrary<number> = progreso.map((p) => p * 0.85);

describe("Property 2: monotonía por tramos del scrub", () => {
  it("ninguna de las tres curvas crece al avanzar el progreso", () => {
    fc.assert(
      fc.property(parCreciente, topeAdmisible, ([p1, p2], tope) => {
        const antes = valoresFondoEn(p1, tope);
        const despues = valoresFondoEn(p2, tope);

        expect(despues.fotoBrillo).toBeLessThanOrEqual(antes.fotoBrillo + HOLGURA);
        expect(despues.overlayOpacidad).toBeLessThanOrEqual(antes.overlayOpacidad + HOLGURA);
        expect(despues.fotoOpacidad).toBeLessThanOrEqual(antes.fotoOpacidad + HOLGURA);
      }),
      ITERACIONES,
    );
  });

  it("un recorrido creciente completo produce tres series no crecientes", () => {
    const recorridoCreciente: fc.Arbitrary<readonly number[]> = fc
      .array(progreso, { minLength: 2, maxLength: 32 })
      .map((valores) => [...valores].sort((a, b) => a - b));

    fc.assert(
      fc.property(recorridoCreciente, topeAdmisible, (recorrido, tope) => {
        const serie = recorrido.map((p) => valoresFondoEn(p, tope));

        for (let i = 1; i < serie.length; i += 1) {
          expect(serie[i].fotoBrillo).toBeLessThanOrEqual(serie[i - 1].fotoBrillo + HOLGURA);
          expect(serie[i].overlayOpacidad).toBeLessThanOrEqual(
            serie[i - 1].overlayOpacidad + HOLGURA,
          );
          expect(serie[i].fotoOpacidad).toBeLessThanOrEqual(serie[i - 1].fotoOpacidad + HOLGURA);
        }
      }),
      ITERACIONES,
    );
  });

  it("fotoOpacidad vale exactamente 1 para todo p ≤ 0.85", () => {
    fc.assert(
      fc.property(progresoAntesDelApagado, topeValido, (p, tope) => {
        expect(valoresFondoEn(p, tope).fotoOpacidad).toBe(1);
      }),
      ITERACIONES,
    );
  });

  it("la monotonía del brillo y de la opacidad de la foto no depende del tope", () => {
    fc.assert(
      fc.property(parCreciente, topeValido, ([p1, p2], tope) => {
        const antes = valoresFondoEn(p1, tope);
        const despues = valoresFondoEn(p2, tope);

        expect(despues.fotoBrillo).toBeLessThanOrEqual(antes.fotoBrillo + HOLGURA);
        expect(despues.fotoOpacidad).toBeLessThanOrEqual(antes.fotoOpacidad + HOLGURA);
      }),
      ITERACIONES,
    );
  });
});
/* ------------------------------------------------------------------------- *
 * Property 3: Acotación del scrub en todo el recorrido
 *
 * Para todo `p ∈ [0,1]` y todo `soporteMezcla ∈ {true, false}`:
 * `fotoBrillo(p) ∈ [0.85, 1.00]` con `fotoBrillo(0.10) ∈ [0.80, 0.90]`;
 * `overlayOpacidad(p) ≤ topeOverlay(soporteMezcla)`, con techo 0.35 con soporte
 * de mezcla y 0.20 sin él; `overlayOpacidad(0.70) ≤ 0.12`;
 * `overlayOpacidad(p) ≤ 0.05` para todo `p ≥ 0.85`;
 * `fotoOpacidad(p) ≤ 0.10` para todo `p ≥ 0.95`; y en `p ≥ 0.95` ninguna de las
 * dos capas supera 0.10 sobre `Cielo_Global`.
 *
 * **Validates: Requirements 2.7, 2.12, 5.3, 5.4, 5.5**
 * ------------------------------------------------------------------------- */

/** Cotas del enunciado, en el mismo orden en el que las declara el diseño. */
const COTAS = {
  brilloMin: 0.85,
  brilloMax: 1,
  brilloEnPausaMin: 0.8,
  brilloEnPausaMax: 0.9,
  techoConMezcla: 0.35,
  techoSinMezcla: 0.2,
  overlayEnMeseta: 0.12,
  overlayDesde085: 0.05,
  fotoDesde095: 0.1,
  capaSobreCielo: 0.1,
} as const;

/**
 * Soporte de `mix-blend-mode` tal como lo detecta el módulo de motion: el único
 * grado de libertad real del tope, porque `topeOverlay` solo devuelve 0.30 o 0.18.
 */
const soporteMezcla: fc.Arbitrary<boolean> = fc.boolean();

/** Progresos del tramo en el que las overlays ya están casi apagadas (`p ≥ 0.85`). */
const progresoDesdeApagado: fc.Arbitrary<number> = progreso.map((p) => 0.85 + p * 0.15);

/** Progresos de la meseta final, donde ninguna capa puede superar 0.10 (`p ≥ 0.95`). */
const progresoEnMesetaFinal: fc.Arbitrary<number> = progreso.map((p) => 0.95 + p * 0.05);

describe("Property 3: acotación del scrub en todo el recorrido", () => {
  it("acota foto y overlays en todo el recorrido del scrub", () => {
    fc.assert(
      fc.property(progreso, soporteMezcla, (p, soporte) => {
        const tope = topeOverlay(soporte);
        const valores = valoresFondoEn(p, tope);

        expect(valores.fotoBrillo).toBeGreaterThanOrEqual(COTAS.brilloMin - HOLGURA);
        expect(valores.fotoBrillo).toBeLessThanOrEqual(COTAS.brilloMax + HOLGURA);

        expect(valores.overlayOpacidad).toBeLessThanOrEqual(tope + HOLGURA);
        expect(valores.overlayOpacidad).toBeLessThanOrEqual(
          (soporte ? COTAS.techoConMezcla : COTAS.techoSinMezcla) + HOLGURA,
        );
        expect(valores.overlayOpacidad).toBeGreaterThanOrEqual(0);

        expect(valores.fotoOpacidad).toBeGreaterThanOrEqual(0);
        expect(valores.fotoOpacidad).toBeLessThanOrEqual(1 + HOLGURA);
      }),
      ITERACIONES,
    );
  });

  it("el brillo alcanzado en la frontera de pausa cae en [0.80, 0.90]", () => {
    fc.assert(
      fc.property(soporteMezcla, (soporte) => {
        const brillo = valoresFondoEn(P_PAUSA, topeOverlay(soporte)).fotoBrillo;

        expect(brillo).toBeGreaterThanOrEqual(COTAS.brilloEnPausaMin - HOLGURA);
        expect(brillo).toBeLessThanOrEqual(COTAS.brilloEnPausaMax + HOLGURA);
      }),
      ITERACIONES,
    );
  });

  it("las overlays no superan 0.12 en la meseta de 0.70 ni 0.05 desde 0.85", () => {
    fc.assert(
      fc.property(progresoDesdeApagado, soporteMezcla, (p, soporte) => {
        const tope = topeOverlay(soporte);

        expect(valoresFondoEn(0.7, tope).overlayOpacidad).toBeLessThanOrEqual(
          COTAS.overlayEnMeseta + HOLGURA,
        );
        expect(valoresFondoEn(p, tope).overlayOpacidad).toBeLessThanOrEqual(
          COTAS.overlayDesde085 + HOLGURA,
        );
      }),
      ITERACIONES,
    );
  });

  it("ninguna capa supera 0.10 desde p = 0.95 hasta el final", () => {
    fc.assert(
      fc.property(progresoEnMesetaFinal, soporteMezcla, (p, soporte) => {
        const valores = valoresFondoEn(p, topeOverlay(soporte));

        expect(valores.fotoOpacidad).toBeLessThanOrEqual(COTAS.fotoDesde095 + HOLGURA);
        expect(valores.fotoOpacidad).toBeLessThanOrEqual(COTAS.capaSobreCielo + HOLGURA);
        expect(valores.overlayOpacidad).toBeLessThanOrEqual(COTAS.capaSobreCielo + HOLGURA);
      }),
      ITERACIONES,
    );
  });
});
/* ------------------------------------------------------------------------- *
 * Property 4: La timeline del scrub y la curva pura son la misma función
 *
 * Para todo keyframe declarado en `keyframesFondo(tope)`, el valor que la
 * interpolación lineal de ese keyframe produce en su `inicio` y en su `fin`
 * coincide con `valoresFondoEn` evaluado en esos mismos progresos, y la curva es
 * continua en cada frontera de tramo (0.10, 0.70, 0.85, 0.95) con
 * discontinuidad 0.
 *
 * La timeline real se reconstruye aquí como lo hace un ScrollTrigger con
 * `scrub`: los tweens del mismo canal se encadenan con `ease: "none"`, cada uno
 * escribe su valor acotado a su propio tramo y gana la última escritura. Si esa
 * reconstrucción y `valoresFondoEn` coinciden en todo `p`, la timeline ligada al
 * scroll y la curva pura son literalmente la misma función (Req 5.6, 5.8).
 *
 * **Validates: Requirements 5.6, 5.8**
 * ------------------------------------------------------------------------- */

/** Los tres canales que anima el scrub, con su lectura en `ValoresFondo`. */
type CanalScrub = {
  objetivo: Keyframe["objetivo"];
  prop: Keyframe["prop"];
  nombre: string;
  lee: (valores: ValoresFondo) => number;
};

const CANALES_SCRUB: readonly CanalScrub[] = [
  { objetivo: "foto", prop: "opacity", nombre: "fotoOpacidad", lee: (v) => v.fotoOpacidad },
  { objetivo: "foto", prop: "brightness", nombre: "fotoBrillo", lee: (v) => v.fotoBrillo },
  { objetivo: "overlay", prop: "opacity", nombre: "overlayOpacidad", lee: (v) => v.overlayOpacidad },
] as const;

/**
 * Cota superior de la pendiente de cualquier tramo: la más empinada es la de la
 * `opacity` de la foto, `(1 - 0.08) / 0.10 = 9.2`. Sirve para acotar el salto
 * admisible al acercarse a una frontera por la izquierda o por la derecha: si la
 * curva es continua, ese salto tiende a 0 con el paso.
 */
const PENDIENTE_MAX = 10;

/** Los keyframes de un canal, en el orden en el que la timeline los encadena. */
function keyframesDelCanal(
  keyframes: readonly Keyframe[],
  canal: CanalScrub,
): readonly Keyframe[] {
  return keyframes.filter((k) => k.objetivo === canal.objetivo && k.prop === canal.prop);
}

/**
 * Reconstrucción independiente de la timeline del scrub para un canal: todo
 * tween cuyo `inicio` ya pasó escribe su valor (acotado a su tramo) y la última
 * escritura es la que queda pintada.
 */
function valorEnTimeline(
  keyframes: readonly Keyframe[],
  canal: CanalScrub,
  p: number,
): number | null {
  const delCanal = keyframesDelCanal(keyframes, canal);
  if (delCanal.length === 0) return null;

  let valor = delCanal[0].desde;
  for (const keyframe of delCanal) {
    if (keyframe.inicio <= p) valor = interpolarKeyframe(keyframe, p);
  }

  return valor;
}

/** Índice de keyframe dentro de la tabla de nueve tramos. */
const indiceKeyframe: fc.Arbitrary<number> = fc.nat({ max: 8 });

/** Paso con el que se sondea una frontera por la izquierda y por la derecha. */
const pasoFrontera: fc.Arbitrary<number> = fc.double({ min: 1e-9, max: 1e-3, noNaN: true });

describe("Property 4: la timeline del scrub y la curva pura son la misma función", () => {
  it("cada keyframe evaluado en su inicio y en su fin coincide con valoresFondoEn", () => {
    fc.assert(
      fc.property(indiceKeyframe, topeValido, (indice, tope) => {
        const keyframes = keyframesFondo(tope);
        const keyframe = keyframes[indice % keyframes.length];
        const canal = CANALES_SCRUB.find(
          (c) => c.objetivo === keyframe.objetivo && c.prop === keyframe.prop,
        );

        expect(canal).toBeDefined();
        if (canal === undefined) return;

        for (const p of [keyframe.inicio, keyframe.fin]) {
          const enKeyframe = interpolarKeyframe(keyframe, p);
          const enCurva = canal.lee(valoresFondoEn(p, tope));

          expect(Math.abs(enKeyframe - enCurva)).toBeLessThanOrEqual(HOLGURA);
        }
      }),
      ITERACIONES,
    );
  });

  it("la timeline reconstruida y valoresFondoEn devuelven el mismo valor en todo p", () => {
    fc.assert(
      fc.property(progreso, topeValido, (p, tope) => {
        const keyframes = keyframesFondo(tope);
        const valores = valoresFondoEn(p, tope);

        for (const canal of CANALES_SCRUB) {
          const enTimeline = valorEnTimeline(keyframes, canal, p);

          expect(enTimeline).not.toBeNull();
          if (enTimeline === null) continue;

          expect(Math.abs(enTimeline - canal.lee(valores))).toBeLessThanOrEqual(HOLGURA);
        }
      }),
      ITERACIONES,
    );
  });

  it("los tramos de cada canal cubren [0, 1] sin huecos ni solapes de valor", () => {
    fc.assert(
      fc.property(topeValido, (tope) => {
        const keyframes = keyframesFondo(tope);

        for (const canal of CANALES_SCRUB) {
          const delCanal = keyframesDelCanal(keyframes, canal);

          expect(delCanal.length).toBeGreaterThan(0);
          expect(delCanal[0].inicio).toBe(0);
          expect(delCanal[delCanal.length - 1].fin).toBe(1);

          for (let i = 1; i < delCanal.length; i += 1) {
            // El tramo siguiente arranca donde termina el anterior…
            expect(delCanal[i].inicio).toBe(delCanal[i - 1].fin);
            // …y con el mismo valor: discontinuidad 0 en la unión (Req 5.8).
            const salida = interpolarKeyframe(delCanal[i - 1], delCanal[i - 1].fin);
            const entrada = interpolarKeyframe(delCanal[i], delCanal[i].inicio);
            expect(Math.abs(salida - entrada)).toBeLessThanOrEqual(HOLGURA);
          }
        }
      }),
      ITERACIONES,
    );
  });

  it("la discontinuidad es 0 en las cuatro fronteras de tramo", () => {
    fc.assert(
      fc.property(pasoFrontera, topeValido, (paso, tope) => {
        for (const frontera of FRONTERAS_SCRUB) {
          const enFrontera = valoresFondoEn(frontera, tope);
          const antes = valoresFondoEn(Math.max(0, frontera - paso), tope);
          const despues = valoresFondoEn(Math.min(1, frontera + paso), tope);
          const salto = PENDIENTE_MAX * paso + HOLGURA;

          for (const canal of CANALES_SCRUB) {
            expect(Math.abs(canal.lee(antes) - canal.lee(enFrontera))).toBeLessThanOrEqual(salto);
            expect(Math.abs(canal.lee(despues) - canal.lee(enFrontera))).toBeLessThanOrEqual(salto);
          }
        }
      }),
      ITERACIONES,
    );
  });
});

describe("plan por modo · valores exactos de la matriz del diseño", () => {
  const modo = (parcial: Partial<ModoFondo> = {}): ModoFondo => ({
    quieto: false,
    compacto: false,
    punteroFino: true,
    soporteMezcla: true,
    ...parcial,
  });

  it("en quieto el plan deja todo a null / [] / false y conserva el tope", () => {
    const plan = planFondo(modo({ quieto: true }));

    expect(plan.entrada).toBeNull();
    expect(plan.bucleFoto).toBeNull();
    expect(plan.buclesOverlay).toEqual([]);
    expect(plan.ecos).toBeNull();
    expect(plan.parallax).toBe(false);
    expect(plan.scrub).toBe(false);
    expect(plan.willChange).toBe(false);
    expect(plan.topeOverlay).toBe(topeOverlay(true));
  });

  it("en amplio con movimiento monta la entrada, un bucle de foto y tres overlays", () => {
    const plan = planFondo(modo());

    expect(plan.entrada).toEqual(ENTRADA_FOTO.amplio);
    expect(plan.bucleFoto).toEqual(IDLE_FOTO.amplio);
    expect(plan.buclesOverlay.map((bucle) => bucle.objetivo)).toEqual(["onda", "eq", "halo"]);
    expect(plan.ecos?.pasos[0].selector).toBe(SELECTOR_KICKER);
    expect(plan.parallax).toBe(true);
    expect(plan.scrub).toBe(true);
    expect(plan.willChange).toBe(true);
  });

  it("en compacto anima solo onda y halo, con la tabla compacta y sin parallax", () => {
    const plan = planFondo(modo({ compacto: true }));

    expect(plan.entrada).toEqual(ENTRADA_FOTO.compacto);
    expect(plan.bucleFoto).toEqual(IDLE_FOTO.compacto);
    expect(plan.buclesOverlay).toEqual([BUCLE_ONDA.compacto, BUCLE_HALO.compacto]);
    expect(plan.parallax).toBe(false);
  });

  it("sin soporte de mezcla el plan baja el tope de las overlays", () => {
    expect(planFondo(modo({ soporteMezcla: false })).topeOverlay).toBe(topeOverlay(false));
  });

  it("parallaxActivo pide puntero fino, viewport amplio y movimiento", () => {
    expect(parallaxActivo(modo())).toBe(true);
    expect(parallaxActivo(modo({ punteroFino: false }))).toBe(false);
    expect(parallaxActivo(modo({ compacto: true }))).toBe(false);
    expect(parallaxActivo(modo({ quieto: true }))).toBe(false);
  });

  it("esQuieto es el OR de sus tres fuentes y esQuietoPorDefecto cubre la falta de matchMedia", () => {
    expect(esQuieto({ condicion: false, clase: false, store: false })).toBe(false);
    expect(esQuieto({ condicion: true, clase: false, store: false })).toBe(true);
    expect(esQuieto({ condicion: false, clase: true, store: false })).toBe(true);
    expect(esQuieto({ condicion: false, clase: false, store: true })).toBe(true);
    expect(esQuietoPorDefecto({ matchMedia: false })).toBe(true);
    expect(esQuietoPorDefecto({ matchMedia: true })).toBe(false);
  });

  it("capacidadesSuficientes exige ScrollTrigger y Flip a la vez", () => {
    expect(capacidadesSuficientes({ scrollTrigger: true, flip: true })).toBe(true);
    expect(capacidadesSuficientes({ scrollTrigger: true, flip: false })).toBe(false);
    expect(capacidadesSuficientes({ scrollTrigger: false, flip: true })).toBe(false);
    expect(capacidadesSuficientes({ scrollTrigger: false, flip: false })).toBe(false);
  });
});

describe("calendario de los ecos · valores exactos de la tabla", () => {
  const modo = (parcial: Partial<ModoFondo> = {}): ModoFondo => ({
    quieto: false,
    compacto: false,
    punteroFino: true,
    soporteMezcla: true,
    ...parcial,
  });

  it("con los cinco elementos de home.copy.json escalona kicker + 4 ecos cada 0.09 s", () => {
    const calendario = calendarioEcos(5, modo());

    expect(calendario?.pasos.map((paso) => paso.selector)).toEqual([
      SELECTOR_KICKER,
      SELECTOR_ECO,
      SELECTOR_ECO,
      SELECTOR_ECO,
      SELECTOR_ECO,
    ]);
    expect(calendario?.paso).toBe(ENTRADA_ECOS.paso);
    expect(calendario?.pasos[0].inicio).toBe(0);
    expect(calendario?.pasos[4].inicio).toBeCloseTo(0.36, 10);
    expect(calendario?.ease).toBe(ENTRADA_ECOS.ease);
    expect(calendario?.yDesde).toBe(ENTRADA_ECOS.y);
    expect(calendario?.corte).toBe(ENTRADA_ECOS.corte);
    expect(calendario?.corte).toBeLessThanOrEqual(0.2);
  });

  it("sin elementos en el DOM no hay calendario", () => {
    expect(calendarioEcos(0, modo())).toBeNull();
    expect(calendarioEcos(0, modo({ compacto: true }))).toBeNull();
  });

  it("en compacto la cascada se reduce al kicker", () => {
    const calendario = calendarioEcos(5, modo({ compacto: true }));

    expect(calendario?.pasos).toEqual([
      { selector: SELECTOR_KICKER, inicio: 0, duracion: ENTRADA_ECOS.duracion },
    ]);
  });

  it("a partir de 6 elementos el paso se comprime para no pasar de 1.0 s", () => {
    expect(pasoEcos(5)).toBe(ENTRADA_ECOS.paso);
    expect(pasoEcos(6)).toBeCloseTo(VENTANA_ECOS / 5, 10);

    const calendario = calendarioEcos(9, modo());
    const inicios = calendario?.pasos.map((paso) => paso.inicio) ?? [];

    expect(inicios).toHaveLength(9);
    expect(Math.max(...inicios) + ENTRADA_ECOS.duracion).toBeLessThanOrEqual(ENTRADA_ECOS.total);
  });

  it("recuentos absurdos se acotan a MAX_PASOS_ECOS sin romper el techo", () => {
    const calendario = calendarioEcos(5000, modo());
    const inicios = calendario?.pasos.map((paso) => paso.inicio) ?? [];

    expect(inicios).toHaveLength(MAX_PASOS_ECOS);
    expect(Math.max(...inicios) + ENTRADA_ECOS.duracion).toBeLessThanOrEqual(ENTRADA_ECOS.total);
  });

  it("objetivosEcos nunca incluye .home__fragmentos", () => {
    expect(objetivosEcos(modo())).toEqual([SELECTOR_KICKER, SELECTOR_ECO]);
    expect(objetivosEcos(modo({ compacto: true }))).toEqual([SELECTOR_KICKER]);

    for (const compacto of [false, true]) {
      expect(objetivosEcos(modo({ compacto }))).not.toContain(".home__fragmentos");
    }
  });
});
/* ------------------------------------------------------------------------- *
 * Property 11: El plan de motion es función del modo y respeta el estado quieto
 *
 * Para toda combinación de `ModoFondo` (las 16 del producto de sus cuatro
 * booleanos): si `quieto` es verdadero, `planFondo` devuelve `entrada === null`,
 * `bucleFoto === null`, `buclesOverlay === []`, `ecos === null`,
 * `parallax === false`, `scrub === false` y `willChange === false`; si `quieto`
 * es falso, hay exactamente un bucle sobre la foto, los bucles overlay son 3 en
 * amplio y 2 (onda y halo) en compacto, todos con `repeat: -1`, ciclo dentro de
 * sus rangos declarados y ease en `EASINGS_SUAVES`, y toda diferencia por
 * pareja de desfases está en `[0.4, 1.5]` con retardo total ≤ 3 s. Además
 * `esQuieto(a, b, c) === (a || b || c)` para toda terna de booleanos y
 * `esQuietoPorDefecto` es verdadero cuando no hay `matchMedia`.
 *
 * UNIDAD DE MEDIDA DEL CICLO. El enunciado mide los dos objetivos en unidades
 * distintas y la implementación respeta esa asimetría:
 *   - Req 1.2 fija la respiración de la foto **por tramo** (un trayecto):
 *     `tramo ∈ [12, 20]` s. Con `yoyo` el ciclo completo es 32 s en amplio y
 *     28 s en compacto, muy por encima de 20 s, así que medir la foto por ciclo
 *     sería medir otra cosa.
 *   - Req 2.5 fija los bucles overlay **por ciclo completo**:
 *     `cicloBucle ∈ [1.2, 12]` s, donde `cicloBucle = yoyo ? 2 × tramo : tramo`.
 *     Las barras del ecualizador tienen tramo 0.8 s (Req 2.4) y solo entran en
 *     el rango leídas como ciclo de 1.6 s.
 * La prueba no reimplementa esa regla: la lee de los helpers exportados
 * `cicloBucle` y `cicloEnRango`, y comprueba aparte que esos helpers coinciden
 * con los rangos literales del enunciado (`RANGO_TRAMO_FOTO`,
 * `RANGO_CICLO_OVERLAY`), de modo que un cambio silencioso de la regla rompe
 * esta suite.
 *
 * **Validates: Requirements 1.2, 1.8, 2.4, 2.5, 2.6, 11.1, 11.2, 11.9, 11.11, 12.1, 12.2, 13.5**
 * ------------------------------------------------------------------------- */

/** Las 16 combinaciones de `ModoFondo`: producto de sus cuatro booleanos. */
const MODOS_FONDO: readonly ModoFondo[] = (() => {
  const booleanos: readonly boolean[] = [false, true];
  const modos: ModoFondo[] = [];

  for (const quieto of booleanos) {
    for (const compacto of booleanos) {
      for (const punteroFino of booleanos) {
        for (const soporteMezcla of booleanos) {
          modos.push({ quieto, compacto, punteroFino, soporteMezcla });
        }
      }
    }
  }

  return modos;
})();

/** Modo arbitrario, generado como producto libre de los cuatro booleanos. */
const modoFondo: fc.Arbitrary<ModoFondo> = fc.record({
  quieto: fc.boolean(),
  compacto: fc.boolean(),
  punteroFino: fc.boolean(),
  soporteMezcla: fc.boolean(),
});

/** Modo con movimiento: la rama en la que hay bucles que verificar. */
const modoConMovimiento: fc.Arbitrary<ModoFondo> = modoFondo.map((modo) => ({
  ...modo,
  quieto: false,
}));

/** Modo quieto: la rama en la que el plan debe quedar completamente vacío. */
const modoQuieto: fc.Arbitrary<ModoFondo> = modoFondo.map((modo) => ({ ...modo, quieto: true }));

/** Objetivos overlay esperados por variante de viewport (Req 12.2). */
const OVERLAYS_POR_VARIANTE: Readonly<Record<"amplio" | "compacto", readonly string[]>> = {
  amplio: ["onda", "eq", "halo"],
  compacto: ["onda", "halo"],
} as const;

describe("Property 11: el plan de motion es función del modo y respeta el estado quieto", () => {
  it("las 16 combinaciones de ModoFondo son distintas y cubren el producto entero", () => {
    expect(MODOS_FONDO).toHaveLength(16);
    expect(new Set(MODOS_FONDO.map((modo) => JSON.stringify(modo))).size).toBe(16);
  });

  it("planFondo es función del modo: el mismo modo produce el mismo plan", () => {
    fc.assert(
      fc.property(modoFondo, (modo) => {
        // Función del modo y de nada más: ni del orden de las llamadas ni de un
        // plan anterior, que además se muta a propósito antes de repetir.
        const primero = planFondo(modo);
        const ajeno = planFondo({ ...modo, quieto: !modo.quieto });
        expect(ajeno).toBeDefined();

        const segundo = planFondo(modo);

        expect(segundo).toEqual(primero);
        expect(planFondo({ ...modo })).toEqual(primero);
      }),
      ITERACIONES,
    );
  });

  it("en quieto el plan queda entero a null / [] / false para las 16 combinaciones", () => {
    fc.assert(
      fc.property(modoQuieto, (modo) => {
        const plan = planFondo(modo);

        expect(plan.entrada).toBeNull();
        expect(plan.bucleFoto).toBeNull();
        expect(plan.buclesOverlay).toEqual([]);
        expect(plan.ecos).toBeNull();
        expect(plan.parallax).toBe(false);
        expect(plan.scrub).toBe(false);
        expect(plan.willChange).toBe(false);
        // El techo de las overlays viaja también en quieto: la `opacity` es fija
        // en esa rama, pero sigue siendo el mismo tope (Req 2.7, 2.12).
        expect(plan.topeOverlay).toBe(topeOverlay(modo.soporteMezcla));
      }),
      ITERACIONES,
    );

    for (const modo of MODOS_FONDO.filter((m) => m.quieto)) {
      const plan = planFondo(modo);
      expect(plan.bucleFoto).toBeNull();
      expect(plan.buclesOverlay).toHaveLength(0);
    }
  });

  it("con movimiento hay exactamente un bucle de foto y ningún overlay lo suplanta", () => {
    fc.assert(
      fc.property(modoConMovimiento, (modo) => {
        const plan = planFondo(modo);

        expect(plan.bucleFoto).not.toBeNull();
        expect(plan.bucleFoto).toEqual(IDLE_FOTO[varianteFondo(modo)]);
        expect(plan.bucleFoto?.objetivo).toBe("foto");
        // Un solo bucle sobre `Capa_Foto` en todo instante (Req 13.5).
        expect(plan.buclesOverlay.filter((bucle) => bucle.objetivo === "foto")).toHaveLength(0);

        expect(plan.entrada).toEqual(ENTRADA_FOTO[varianteFondo(modo)]);
        expect(plan.scrub).toBe(true);
        // `will-change: transform` solo mientras el bucle idle vive (Req 1.5).
        expect(plan.willChange).toBe(plan.bucleFoto !== null);
        expect(plan.parallax).toBe(parallaxActivo(modo));
        expect(plan.ecos?.pasos[0].selector).toBe(SELECTOR_KICKER);
      }),
      ITERACIONES,
    );
  });

  it("los bucles overlay son 3 en amplio y 2 (onda y halo) en compacto", () => {
    fc.assert(
      fc.property(modoConMovimiento, (modo) => {
        const variante = varianteFondo(modo);
        const plan = planFondo(modo);

        expect(plan.buclesOverlay.map((bucle) => bucle.objetivo)).toEqual(
          OVERLAYS_POR_VARIANTE[variante],
        );
        expect(plan.buclesOverlay).toHaveLength(modo.compacto ? 2 : 3);
        // La EQ solo existe en amplio: en compacto queda en su estado final por
        // CSS y su ausencia en el plan es lo que lo garantiza (Req 12.2).
        expect(plan.buclesOverlay.some((bucle) => bucle.objetivo === "eq")).toBe(
          BUCLE_EQ[variante] !== null,
        );
        expect(plan.buclesOverlay).toEqual(
          [BUCLE_ONDA[variante], BUCLE_EQ[variante], BUCLE_HALO[variante]].filter(
            (bucle): bucle is BucleFondo => bucle !== null,
          ),
        );
      }),
      ITERACIONES,
    );
  });

  it("todo bucle del plan es infinito, con ease suave y ciclo en su rango declarado", () => {
    fc.assert(
      fc.property(modoConMovimiento, (modo) => {
        const plan = planFondo(modo);
        const bucles: readonly BucleFondo[] = [
          ...(plan.bucleFoto === null ? [] : [plan.bucleFoto]),
          ...plan.buclesOverlay,
        ];

        expect(bucles.length).toBeGreaterThan(0);

        for (const bucle of bucles) {
          // Todo bucle del fondo se declara con `repeat: -1` (Req 1.2, 2.5).
          expect(REPETICION_BUCLE).toBe(-1);
          expect(EASINGS_SUAVES).toContain(bucle.ease);
          // La regla de la unidad de medida vive en el módulo, no aquí.
          expect(cicloEnRango(bucle)).toBe(true);

          if (bucle.objetivo === "foto") {
            // Req 1.2: la foto se mide POR TRAMO.
            expect(bucle.tramo).toBeGreaterThanOrEqual(RANGO_TRAMO_FOTO.min);
            expect(bucle.tramo).toBeLessThanOrEqual(RANGO_TRAMO_FOTO.max);
          } else {
            // Req 2.5: las overlays se miden POR CICLO COMPLETO.
            const ciclo = cicloBucle(bucle);
            expect(ciclo).toBeGreaterThanOrEqual(RANGO_CICLO_OVERLAY.min);
            expect(ciclo).toBeLessThanOrEqual(RANGO_CICLO_OVERLAY.max);
          }

          expect(cicloBucle(bucle)).toBe(bucle.yoyo ? bucle.tramo * 2 : bucle.tramo);
          expect(bucle.tramo).toBeGreaterThan(0);
        }
      }),
      ITERACIONES,
    );
  });

  it("los desfases de los bucles overlay difieren entre 0.4 s y 1.5 s con total ≤ 3 s", () => {
    fc.assert(
      fc.property(modoConMovimiento, (modo) => {
        const overlays = planFondo(modo).buclesOverlay;
        const diferencias = diferenciasDesfase(overlays);

        // Con 2 o 3 overlays hay 1 o 3 parejas: ninguna puede latir al unísono.
        expect(diferencias.length).toBe(modo.compacto ? 1 : 3);

        for (const diferencia of diferencias) {
          expect(diferencia).toBeGreaterThanOrEqual(RANGO_DIFERENCIA_DESFASE.min - HOLGURA);
          expect(diferencia).toBeLessThanOrEqual(RANGO_DIFERENCIA_DESFASE.max + HOLGURA);
        }

        const total = Math.max(...overlays.map((bucle) => bucle.desfase));
        expect(total).toBeLessThanOrEqual(DESFASE_TOTAL_MAX);
        expect(total).toBe(DESFASES_OVERLAY.halo);

        for (const bucle of overlays) {
          expect(bucle.desfase).toBeGreaterThanOrEqual(0);
        }
      }),
      ITERACIONES,
    );
  });

  it("esQuieto es exactamente el OR de sus tres fuentes", () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), fc.boolean(), (condicion, clase, store) => {
        expect(esQuieto({ condicion, clase, store })).toBe(condicion || clase || store);
      }),
      ITERACIONES,
    );
  });

  it("esQuietoPorDefecto es verdadero si y solo si no hay matchMedia", () => {
    fc.assert(
      fc.property(fc.boolean(), (matchMedia) => {
        expect(esQuietoPorDefecto({ matchMedia })).toBe(!matchMedia);
      }),
      ITERACIONES,
    );
  });
});

/* ------------------------------------------------------------------------- *
 * Property 12: El calendario de los ecos respeta el orden, el paso y el techo
 *
 * Para todo `n ≥ 1` y todo `ModoFondo`, `calendarioEcos(n, modo)` devuelve una
 * cascada con `inicio` estrictamente creciente que arranca exactamente en 0, con
 * `.home__kicker` como primer selector, sin ningún selector igual a
 * `.home__fragmentos`, con `max(inicio) + duracion ≤ 1.0` s y con
 * `corte ≤ 0.2` s. El paso es exactamente 0.09 s mientras `n ≤ 5`; en
 * `Modo_Compacto` la lista tiene longitud 1 y contiene solo el kicker.
 *
 * REGLA DE COMPRESIÓN. A partir de 6 elementos el paso nominal no cabe en la
 * ventana (`VENTANA_ECOS = total - duracion = 0.4` s), así que el módulo lo
 * comprime a un reparto uniforme `VENTANA_ECOS / (cantidad - 1)` con suelo
 * `PASO_MINIMO_ECOS = 0.01` s, lo que acota la cascada a `MAX_PASOS_ECOS = 41`
 * elementos escalonados. La prueba no reimplementa el reparto: lo lee de
 * `pasoEcos` y `cantidadEcos` y comprueba que los `inicio` que produce
 * `calendarioEcos` son ese reparto, de modo que un cambio silencioso de la regla
 * rompe esta suite.
 *
 * `.home__fragmentos` es el contenedor y nunca objetivo: su desaparición
 * durante el scroll pertenece a `Orbita_Home` (Req 3.3).
 *
 * **Validates: Requirements 3.2, 3.3, 3.4, 3.7**
 * ------------------------------------------------------------------------- */

/** El contenedor que la cascada no puede tocar nunca (Req 3.3). */
const SELECTOR_FRAGMENTOS = ".home__fragmentos";

/** Recuento con paso nominal: el kicker y los cuatro ecos de `home.copy.json`. */
const recuentoNominal: fc.Arbitrary<number> = fc.integer({ min: 1, max: 5 });

/** Recuento que fuerza la compresión y el tope de `MAX_PASOS_ECOS`. */
const recuentoComprimido: fc.Arbitrary<number> = fc.oneof(
  fc.integer({ min: 6, max: MAX_PASOS_ECOS }),
  fc.integer({ min: MAX_PASOS_ECOS + 1, max: 5000 }),
);

/** Cualquier recuento con al menos un elemento presente en el DOM. */
const recuentoEcos: fc.Arbitrary<number> = fc.oneof(recuentoNominal, recuentoComprimido);

/** Recuentos sin ningún elemento escalonable: vacíos, negativos o ilegibles. */
const recuentoVacio: fc.Arbitrary<number> = fc.oneof(
  fc.integer({ min: -5000, max: 0 }),
  fc.double({ min: 0, max: 0.999, noNaN: true }),
  fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY),
);

describe("Property 12: el calendario de los ecos respeta el orden, el paso y el techo", () => {
  it("los inicios son estrictamente crecientes y el primero es 0 exacto", () => {
    fc.assert(
      fc.property(recuentoEcos, modoFondo, (n, modo) => {
        const calendario = calendarioEcos(n, modo);

        expect(calendario).not.toBeNull();
        const pasos = calendario?.pasos ?? [];
        expect(pasos.length).toBeGreaterThan(0);

        // El estado inicial se aplica antes del primer frame pintado: el kicker
        // no espera (Req 3.1, 3.2).
        expect(pasos[0].inicio).toBe(0);

        for (let i = 1; i < pasos.length; i += 1) {
          expect(pasos[i].inicio).toBeGreaterThan(pasos[i - 1].inicio);
        }
      }),
      ITERACIONES,
    );
  });

  it("el primer selector es siempre .home__kicker y ninguno es .home__fragmentos", () => {
    fc.assert(
      fc.property(recuentoEcos, modoFondo, (n, modo) => {
        const calendario = calendarioEcos(n, modo);
        const pasos = calendario?.pasos ?? [];

        expect(pasos[0].selector).toBe(SELECTOR_KICKER);

        for (const paso of pasos) {
          expect(paso.selector).not.toBe(SELECTOR_FRAGMENTOS);
          // Y además nada fuera de la lista blanca del modo (Req 3.3, 3.4).
          expect(objetivosEcos(modo)).toContain(paso.selector);
        }

        // Solo el primero es el kicker: el resto son ecos de esquina (Req 3.2).
        for (const paso of pasos.slice(1)) {
          expect(paso.selector).toBe(SELECTOR_ECO);
        }

        expect(objetivosEcos(modo)).not.toContain(SELECTOR_FRAGMENTOS);
      }),
      ITERACIONES,
    );
  });

  it("la secuencia entera cabe en 1.0 s: max(inicio) + duracion ≤ total", () => {
    fc.assert(
      fc.property(recuentoEcos, modoFondo, (n, modo) => {
        const calendario = calendarioEcos(n, modo);
        const pasos = calendario?.pasos ?? [];
        const ultimo = Math.max(...pasos.map((paso) => paso.inicio));

        expect(ultimo).toBeLessThanOrEqual(VENTANA_ECOS + HOLGURA);

        for (const paso of pasos) {
          expect(paso.duracion).toBe(ENTRADA_ECOS.duracion);
          expect(paso.inicio + paso.duracion).toBeLessThanOrEqual(ENTRADA_ECOS.total + HOLGURA);
        }

        expect(ultimo + ENTRADA_ECOS.duracion).toBeLessThanOrEqual(ENTRADA_ECOS.total + HOLGURA);
      }),
      ITERACIONES,
    );
  });

  it("el paso es exactamente 0.09 s mientras n ≤ 5", () => {
    fc.assert(
      fc.property(recuentoNominal, modoFondo, (n, modo) => {
        const calendario = calendarioEcos(n, modo);

        expect(calendario?.paso).toBe(ENTRADA_ECOS.paso);
        expect(ENTRADA_ECOS.paso).toBe(0.09);

        // Con el paso nominal los arranques son múltiplos exactos de 0.09 s.
        const pasos = calendario?.pasos ?? [];
        for (let i = 0; i < pasos.length; i += 1) {
          expect(pasos[i].inicio).toBeCloseTo(i * ENTRADA_ECOS.paso, 10);
        }
      }),
      ITERACIONES,
    );
  });

  it("a partir de 6 elementos el paso se comprime al reparto uniforme de la ventana", () => {
    fc.assert(
      fc.property(recuentoComprimido, modoFondo, (n, modo) => {
        const calendario = calendarioEcos(n, modo);
        const cantidad = cantidadEcos(n, modo);
        const pasos = calendario?.pasos ?? [];

        expect(pasos).toHaveLength(cantidad);
        expect(cantidad).toBeLessThanOrEqual(modo.compacto ? 1 : MAX_PASOS_ECOS);
        expect(calendario?.paso).toBe(pasoEcos(cantidad));

        if (modo.compacto) return;

        // Reparto uniforme dentro de la ventana, con suelo `PASO_MINIMO_ECOS`.
        expect(calendario?.paso).toBeCloseTo(VENTANA_ECOS / (cantidad - 1), 10);
        expect(calendario?.paso ?? 0).toBeLessThan(ENTRADA_ECOS.paso);
        expect(calendario?.paso ?? 0).toBeGreaterThanOrEqual(PASO_MINIMO_ECOS - HOLGURA);

        for (let i = 1; i < pasos.length; i += 1) {
          const salto = pasos[i].inicio - pasos[i - 1].inicio;
          expect(salto).toBeLessThanOrEqual((calendario?.paso ?? 0) + HOLGURA);
        }
      }),
      ITERACIONES,
    );
  });

  it("en compacto el calendario tiene longitud 1 y contiene solo el kicker", () => {
    fc.assert(
      fc.property(recuentoEcos, modoFondo, (n, modo) => {
        const calendario = calendarioEcos(n, { ...modo, compacto: true });

        expect(calendario?.pasos).toEqual([
          { selector: SELECTOR_KICKER, inicio: 0, duracion: ENTRADA_ECOS.duracion },
        ]);
        // Sin `stagger` que aplicar, el paso queda en su valor nominal (Req 3.4).
        expect(calendario?.paso).toBe(ENTRADA_ECOS.paso);
      }),
      ITERACIONES,
    );
  });

  it("el corte por scroll anticipado nunca pasa de 0.2 s", () => {
    fc.assert(
      fc.property(recuentoEcos, modoFondo, (n, modo) => {
        const calendario = calendarioEcos(n, modo);

        expect(calendario?.corte).toBe(ENTRADA_ECOS.corte);
        expect(calendario?.corte ?? 1).toBeLessThanOrEqual(0.2);
        expect(calendario?.corte ?? 0).toBeGreaterThan(0);
        expect(calendario?.ease).toBe(ENTRADA_ECOS.ease);
        expect(calendario?.yDesde).toBe(ENTRADA_ECOS.y);
      }),
      ITERACIONES,
    );
  });

  it("sin elementos escalonables no hay calendario y la timeline se omite", () => {
    fc.assert(
      fc.property(recuentoVacio, modoFondo, (n, modo) => {
        expect(cantidadEcos(n, modo)).toBe(0);
        expect(calendarioEcos(n, modo)).toBeNull();
      }),
      ITERACIONES,
    );
  });

  it("calendarioEcos es función de sus argumentos: los mismos dan el mismo calendario", () => {
    fc.assert(
      fc.property(recuentoEcos, modoFondo, (n, modo) => {
        const primero = calendarioEcos(n, modo);
        const ajeno = calendarioEcos(n + 1, { ...modo, compacto: !modo.compacto });
        expect(ajeno).toBeDefined();

        expect(calendarioEcos(n, { ...modo })).toEqual(primero);
      }),
      ITERACIONES,
    );
  });
});
/* ------------------------------------------------------------------------- *
 * Property 10: El parallax está acotado, centrado y es robusto
 *
 * Para todo punto de puntero y toda caja con dimensiones positivas,
 * `desplazamientoParallax` devuelve componentes en `[-12, 12]` px, exactamente
 * `(0, 0)` cuando el punto es el centro de la caja, y valores opuestos para
 * puntos simétricos respecto al centro; para toda secuencia de eventos que
 * intercale entradas no finitas (`NaN`, `Infinity`, faltantes) o cajas
 * degeneradas, el desplazamiento resultante es idéntico al de la secuencia con
 * esos eventos eliminados; y `salidaParallax()` devuelve `(0, 0)`.
 * `parallaxActivo(modo)` es verdadero si y solo si
 * `punteroFino && !compacto && !quieto`.
 *
 * LA ROBUSTEZ SE MIDE COMO INDISTINGUIBILIDAD. Req 4.9 no pide solo «no
 * lanzar»: pide que un evento degenerado se descarte conservando el último
 * desplazamiento válido. Eso es exactamente decir que reproducir la secuencia
 * entera y reproducir la secuencia filtrada dan el mismo desplazamiento final,
 * que es la forma en la que se comprueba aquí. Como `desplazamientoParallax`
 * recibe el `previo` y lo devuelve intacto en los casos degenerados, la
 * propiedad se verifica sin DOM y sin listener.
 *
 * **Validates: Requirements 4.2, 4.4, 4.5, 4.7, 4.9, 12.3**
 * ------------------------------------------------------------------------- */

/** Alcance declarado del parallax: la cota del enunciado en cada eje (Req 4.2). */
const ALCANCE: number = PARALLAX.alcance;

/** Coordenadas de la caja del fondo, en el orden de magnitud de un viewport real. */
const coordenadaCaja: fc.Arbitrary<number> = fc.double({ min: -5000, max: 5000, noNaN: true });

/** Dimensión estrictamente positiva: desde cajas diminutas hasta pantallas grandes. */
const dimensionPositiva: fc.Arbitrary<number> = fc.double({ min: 1e-3, max: 4000, noNaN: true });

/**
 * Coordenadas del puntero: cubren el interior de la caja y también posiciones
 * muy fuera de ella, donde la acotación es lo único que impide que el
 * desplazamiento crezca sin límite (Req 4.2).
 */
const coordenadaPuntero: fc.Arbitrary<number> = fc.double({
  min: -20000,
  max: 20000,
  noNaN: true,
});

/** Caja utilizable: rectángulo finito con ancho y alto estrictamente positivos. */
const cajaValida: fc.Arbitrary<Caja> = fc.record({
  izquierda: coordenadaCaja,
  arriba: coordenadaCaja,
  ancho: dimensionPositiva,
  alto: dimensionPositiva,
});

/** Punto de puntero con las dos coordenadas finitas. */
const puntoFinito: fc.Arbitrary<PuntoPuntero> = fc.record({
  x: coordenadaPuntero,
  y: coordenadaPuntero,
});

/** Centro exacto de una caja, calculado como lo calcula el módulo: `inicio + tamaño / 2`. */
function centroDe(caja: Caja): PuntoPuntero {
  return { x: caja.izquierda + caja.ancho / 2, y: caja.arriba + caja.alto / 2 };
}

/**
 * Caja con un punto sobre ella. El punto se genera dentro del rectángulo la
 * mayor parte de las veces (el caso real), pero también en el centro exacto y
 * fuera del rectángulo, para que ambos extremos del enunciado se visiten.
 */
const cajaConPunto: fc.Arbitrary<readonly [Caja, PuntoPuntero]> = cajaValida.chain((caja) =>
  fc
    .oneof<fc.Arbitrary<PuntoPuntero>[]>(
      {
        weight: 3,
        arbitrary: fc
          .tuple(
            fc.double({ min: 0, max: 1, noNaN: true }),
            fc.double({ min: 0, max: 1, noNaN: true }),
          )
          .map(([u, v]) => ({
            x: caja.izquierda + u * caja.ancho,
            y: caja.arriba + v * caja.alto,
          })),
      },
      { weight: 1, arbitrary: fc.constant(centroDe(caja)) },
      { weight: 1, arbitrary: puntoFinito },
    )
    .map((punto) => [caja, punto] as const),
);

/** Desplazamiento previo admisible: cualquier valor dentro del alcance. */
const desplazamientoPrevio: fc.Arbitrary<Desplazamiento> = fc.record({
  x: fc.double({ min: -ALCANCE, max: ALCANCE, noNaN: true }),
  y: fc.double({ min: -ALCANCE, max: ALCANCE, noNaN: true }),
});

/** Un evento de puntero tal como llega al cálculo: un punto (o su ausencia) y una caja. */
type EventoParallax = { punto: PuntoPuntero | null; caja: Caja };

/** Los tres valores no finitos que puede traer un evento real de puntero. */
const noFinito: fc.Arbitrary<number> = fc.constantFrom(
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
);

/** Punto con al menos una coordenada no finita. */
const puntoNoFinito: fc.Arbitrary<PuntoPuntero> = fc.oneof(
  fc.record({ x: noFinito, y: coordenadaPuntero }),
  fc.record({ x: coordenadaPuntero, y: noFinito }),
  fc.record({ x: noFinito, y: noFinito }),
);

/** Caja degenerada: dimensión no positiva o medida no finita. */
const cajaDegenerada: fc.Arbitrary<Caja> = fc.oneof(
  fc.record({
    izquierda: coordenadaCaja,
    arriba: coordenadaCaja,
    ancho: fc.double({ min: -4000, max: 0, noNaN: true }),
    alto: dimensionPositiva,
  }),
  fc.record({
    izquierda: coordenadaCaja,
    arriba: coordenadaCaja,
    ancho: dimensionPositiva,
    alto: fc.double({ min: -4000, max: 0, noNaN: true }),
  }),
  fc.record({
    izquierda: noFinito,
    arriba: coordenadaCaja,
    ancho: dimensionPositiva,
    alto: dimensionPositiva,
  }),
  fc.record({
    izquierda: coordenadaCaja,
    arriba: coordenadaCaja,
    ancho: noFinito,
    alto: dimensionPositiva,
  }),
);

/** Evento que el cálculo debe atender: punto finito sobre caja utilizable. */
const eventoValido: fc.Arbitrary<EventoParallax> = cajaConPunto.map(([caja, punto]) => ({
  punto,
  caja,
}));

/** Evento que el cálculo debe descartar: punto ausente, no finito o caja degenerada. */
const eventoDegenerado: fc.Arbitrary<EventoParallax> = fc.oneof(
  cajaValida.map((caja) => ({ punto: null, caja })),
  fc.tuple(puntoNoFinito, cajaValida).map(([punto, caja]) => ({ punto, caja })),
  fc.tuple(puntoFinito, cajaDegenerada).map(([punto, caja]) => ({ punto, caja })),
  cajaDegenerada.map((caja) => ({ punto: null, caja })),
);

/** Secuencia de eventos que intercala los atendibles con los descartables. */
const secuenciaEventos: fc.Arbitrary<readonly EventoParallax[]> = fc.array(
  fc.oneof({ weight: 2, arbitrary: eventoValido }, { weight: 1, arbitrary: eventoDegenerado }),
  { minLength: 1, maxLength: 24 },
);

/** Secuencia formada solo por eventos descartables. */
const secuenciaSoloDegenerada: fc.Arbitrary<readonly EventoParallax[]> = fc.array(
  eventoDegenerado,
  { minLength: 1, maxLength: 12 },
);

/**
 * Criterio del enunciado para «evento atendible», escrito de forma independiente
 * de la implementación: punto presente con las dos coordenadas finitas y caja
 * finita con ancho y alto estrictamente positivos (Req 4.2, 4.9).
 */
function eventoUtilizable({ punto, caja }: EventoParallax): boolean {
  if (punto === null) return false;
  if (!Number.isFinite(punto.x) || !Number.isFinite(punto.y)) return false;

  return (
    Number.isFinite(caja.izquierda) &&
    Number.isFinite(caja.arriba) &&
    Number.isFinite(caja.ancho) &&
    Number.isFinite(caja.alto) &&
    caja.ancho > 0 &&
    caja.alto > 0
  );
}

/** Reproduce una secuencia de eventos encadenando el desplazamiento como hace `fondo.ts`. */
function reproducirSecuencia(
  eventos: readonly EventoParallax[],
  inicial: Desplazamiento,
): Desplazamiento {
  let actual = inicial;
  for (const { punto, caja } of eventos) actual = desplazamientoParallax(punto, caja, actual);
  return actual;
}

describe("Property 10: el parallax está acotado, centrado y es robusto", () => {
  it("las dos componentes se quedan dentro de [-12, 12] para todo punto y toda caja", () => {
    fc.assert(
      fc.property(cajaConPunto, desplazamientoPrevio, ([caja, punto], previo) => {
        const desplazamiento = desplazamientoParallax(punto, caja, previo);

        expect(ALCANCE).toBe(12);
        expect(Number.isFinite(desplazamiento.x)).toBe(true);
        expect(Number.isFinite(desplazamiento.y)).toBe(true);
        expect(desplazamiento.x).toBeGreaterThanOrEqual(-ALCANCE);
        expect(desplazamiento.x).toBeLessThanOrEqual(ALCANCE);
        expect(desplazamiento.y).toBeGreaterThanOrEqual(-ALCANCE);
        expect(desplazamiento.y).toBeLessThanOrEqual(ALCANCE);
      }),
      ITERACIONES,
    );
  });

  it("el puntero en el centro de la caja da (0, 0) exacto", () => {
    fc.assert(
      fc.property(cajaValida, desplazamientoPrevio, (caja, previo) => {
        expect(desplazamientoParallax(centroDe(caja), caja, previo)).toEqual({ x: 0, y: 0 });
      }),
      ITERACIONES,
    );
  });

  it("dos puntos simétricos respecto al centro dan desplazamientos opuestos", () => {
    /** Cajas medibles: al menos 1 px de lado, como cualquier fondo real del home. */
    const cajaMedible: fc.Arbitrary<Caja> = fc.record({
      izquierda: coordenadaCaja,
      arriba: coordenadaCaja,
      ancho: fc.double({ min: 1, max: 4000, noNaN: true }),
      alto: fc.double({ min: 1, max: 4000, noNaN: true }),
    });

    /** Separación respecto al centro, dentro y fuera del rectángulo. */
    const separacion: fc.Arbitrary<number> = fc.double({ min: 0, max: 6000, noNaN: true });

    fc.assert(
      fc.property(
        cajaMedible,
        separacion,
        separacion,
        desplazamientoPrevio,
        (caja, dx, dy, previo) => {
          const centro = centroDe(caja);
          const unLado = desplazamientoParallax(
            { x: centro.x + dx, y: centro.y + dy },
            caja,
            previo,
          );
          const elOtro = desplazamientoParallax(
            { x: centro.x - dx, y: centro.y - dy },
            caja,
            previo,
          );

          expect(Math.abs(unLado.x + elOtro.x)).toBeLessThanOrEqual(HOLGURA);
          expect(Math.abs(unLado.y + elOtro.y)).toBeLessThanOrEqual(HOLGURA);
        },
      ),
      ITERACIONES,
    );
  });

  it("una secuencia con eventos degenerados es indistinguible de la secuencia sin ellos", () => {
    fc.assert(
      fc.property(secuenciaEventos, desplazamientoPrevio, (eventos, inicial) => {
        const conDegenerados = reproducirSecuencia(eventos, inicial);
        const sinDegenerados = reproducirSecuencia(eventos.filter(eventoUtilizable), inicial);

        expect(conDegenerados).toEqual(sinDegenerados);
      }),
      ITERACIONES,
    );
  });

  it("una secuencia entera de eventos degenerados conserva el último desplazamiento válido", () => {
    fc.assert(
      fc.property(secuenciaSoloDegenerada, desplazamientoPrevio, (eventos, inicial) => {
        expect(reproducirSecuencia(eventos, inicial)).toEqual(inicial);
      }),
      ITERACIONES,
    );
  });

  it("intercalar eventos degenerados en cualquier posición no altera el resultado", () => {
    fc.assert(
      fc.property(
        fc.array(eventoValido, { minLength: 1, maxLength: 12 }),
        eventoDegenerado,
        fc.nat(),
        desplazamientoPrevio,
        (validos, ruido, posicion, inicial) => {
          const donde = posicion % (validos.length + 1);
          const contaminada = [...validos.slice(0, donde), ruido, ...validos.slice(donde)];

          expect(reproducirSecuencia(contaminada, inicial)).toEqual(
            reproducirSecuencia(validos, inicial),
          );
        },
      ),
      ITERACIONES,
    );
  });

  it("salidaParallax devuelve (0, 0) sin depender de nada de lo anterior", () => {
    fc.assert(
      fc.property(secuenciaEventos, desplazamientoPrevio, (eventos, inicial) => {
        const final = reproducirSecuencia(eventos, inicial);
        expect(final).toBeDefined();

        const salida = salidaParallax();
        salida.x = Number.NaN;
        salida.y = Number.NaN;

        expect(salidaParallax()).toEqual({ x: 0, y: 0 });
        expect(salidaParallax().x).toBe(0);
        expect(salidaParallax().y).toBe(0);
      }),
      ITERACIONES,
    );
  });

  it("parallaxActivo es exactamente la conjunción punteroFino && !compacto && !quieto", () => {
    for (const modo of MODOS_FONDO) {
      expect(parallaxActivo(modo)).toBe(modo.punteroFino && !modo.compacto && !modo.quieto);
    }

    fc.assert(
      fc.property(modoFondo, (modo) => {
        expect(parallaxActivo(modo)).toBe(modo.punteroFino && !modo.compacto && !modo.quieto);
        expect(planFondo(modo).parallax).toBe(parallaxActivo(modo));
      }),
      ITERACIONES,
    );
  });
});
