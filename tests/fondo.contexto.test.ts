/**
 * Contratos del contexto GSAP del fondo (`fondo.ts`, tareas 7.2, 7.3, 7.5, 7.6,
 * 7.7, 7.8 y 7.9).
 *
 * La suite corre con `environment: "node"` y sin DOM, y `fondo.ts` es glue de
 * DOM y GSAP puro: no hay nada evaluable sin navegador. Lo que sí es verificable
 * aquí, y es justo lo que la tarea promete, son sus contratos de fuente: que
 * GSAP entra solo por `Registro_GSAP`, que la lógica pura se importa de
 * `fondo.curvas` en lugar de duplicarse, que las tres guardas de entrada están
 * en su sitio y que los selectores que consulta pertenecen a la lista blanca.
 *
 * La tarea 7.3 añade la pareja de timelines de `Capa_Foto`. Sus valores viven en
 * `ENTRADA_FOTO` e `IDLE_FOTO` y ya los cubren las Propiedades 8 y 11 sobre el
 * módulo puro; lo que se comprueba aquí es la traducción a GSAP: dos timelines
 * encadenadas, un único bucle infinito sobre la foto, `overwrite: "auto"` en sus
 * tweens, `will-change` acotado, las guardas que impiden crear cualquiera de las
 * dos y que ni una cifra de la coreografía se haya copiado al módulo del DOM.
 *
 * La tarea 7.5 añade los bucles desfasados de la onda y el halo. Sus valores
 * viven en `BUCLE_ONDA` y `BUCLE_HALO` y llegan por `plan.buclesOverlay`, así que
 * aquí se comprueba lo propio de la traducción: una timeline infinita por capa,
 * el desfase de la tabla como retardo de arranque, `overwrite: "auto"`, las
 * guardas que impiden crearlas y —lo que sostiene el diseño D4— que **ninguna de
 * las dos toca `opacity`**, propiedad reservada a la timeline de scrub.
 *
 * La tarea 7.6 cierra la terna con el bucle de las barras EQ. Su tabla es
 * `BUCLE_EQ` y llega por `plan.buclesOverlay`, así que aquí se comprueba la
 * traducción: **una sola** timeline infinita para las siete barras con `stagger`
 * tomado de `PASO_EQ`, el desfase de la tabla como retardo de arranque, el único
 * bucle de la terna que no pasa por `bucleConFiltro`, `transform-origin` dejado al
 * CSS, y las dos ausencias que lo cancelan sin rama extra: sin barras en el DOM y
 * sin entrada `eq` en el plan (el caso de `Modo_Compacto`, Req 12.2).
 *
 * La tarea 7.7 añade la cascada de `Ecos_Esquina`. Sus instantes salen de
 * `calendarioEcos(n, modo)` —ya cubierto por la Propiedad 12—, así que aquí se
 * comprueba la traducción: el estado inicial escrito antes de crear la timeline,
 * una sola pasada con `stagger` tomado del calendario, el cierre en espera de
 * `calendario.corte` que mata la cascada, la única escucha de scroll que lo
 * dispara y se suelta al terminar, las tres guardas que impiden crear cualquier
 * timeline y que `.home__fragmentos` no aparezca entre los objetivos.
 *
 * La tarea 7.8 añade el parallax de puntero. Su aritmética es `PARALLAX`,
 * `desplazamientoParallax` y `salidaParallax` —ya cubiertas por la Propiedad 10—,
 * así que aquí se comprueba la traducción: exactamente dos `quickTo` sobre `x` e
 * `y` de `.home__fondo` con la duración y el easing de la tabla, el último
 * desplazamiento válido entregado como `previo` en cada evento, las tres escuchas
 * pasivas —movimiento, `pointerleave` y `blur`—, la guarda única de
 * `plan.parallax` que cubre puntero grueso, `Modo_Compacto` y `Modo_Quieto`, el
 * falso por defecto de `Puntero_Fino` sin `matchMedia`, y una limpieza que retira
 * las tres escuchas, cancela los dos ejes y deja el fondo en `(0, 0)`.
 *
 * La tarea 7.9 añade la pausa por visibilidad. Aquí no hay `document` ni GSAP que
 * ejercitar, así que lo verificable es su costura: el colector `contexto.bucles`
 * al que **solo** las cuatro piezas con bucle infinito se registran —la entrada
 * de la foto, la cascada de los ecos y los `quickTo` del parallax quedan fuera—,
 * la única escucha de `visibilitychange` sobre `document`, el `pause()`/`resume()`
 * que conserva el `progress()` sin crear instancias nuevas, la lista de los que
 * estaban corriendo al ocultarse, la guarda del colector vacío que cubre
 * `Modo_Quieto` sin rama propia, la ausencia de toda referencia a `Orbita_Home` y
 * una limpieza que retira la escucha y suelta la lista.
 *
 * La tarea 10.1 cierra la rama de `Modo_Quieto`. Casi toda estaba ya en pie por
 * construcción: `planFondo` devuelve la rama entera a `null` / `[]` / `false` y
 * cada pieza se cancela por la ausencia de su tabla, así que el número de tweens
 * es 0 sin una sola condición de modo repartida por el módulo. Lo que faltaba era
 * el reposo **explícito**: en un cambio en caliente de la media query, GSAP
 * revierte el contexto anterior antes de invocar el nuevo, pero las limpiezas que
 * devolvieron las piezas corren *después* de esa restauración, de modo que lo que
 * escriben sobrevive al revert —el `gsap.set` con el que el parallax vuelve al
 * centro deja un `transform` inline en `.home__fondo`—. Aquí se comprueba ese
 * cierre: un único `gsap.set` con `clearProps` sobre las capas del fondo, la lista
 * de propiedades derivada de `PROPS_PERMITIDAS` más el `will-change`, la guarda de
 * `modo.quieto`, su lugar al frente de la costura y la ausencia de toda cifra;
 * más los contratos del cambio en caliente: `mm.revert()` como única salida, el
 * modo y el plan recalculados dentro del callback y ni un temporizador entre el
 * revert y la aplicación del contexto nuevo.
 *
 * La tarea 10.2 cierra la rama de `Modo_Compacto`, y también estaba en pie por
 * construcción: las variantes `compacto` de las tablas ya traen la entrada desde
 * `scale` 1.04, la respiración `1 ↔ 1.04` con tramo de 14 s, `BUCLE_EQ.compacto`
 * en `null` y `parallaxActivo` en falso, de modo que ninguna pieza necesita una
 * condición de viewport propia: la ausencia de la tabla es toda la rama. Lo que
 * faltaba era **verificarla**, y es lo que se comprueba aquí: las cotas de la
 * tabla compacta (entrada ≤ 1.04, tramo ≥ 12 s, exactamente dos overlays
 * animadas), la EQ en su estado final por debajo del tope de `opacity`, el
 * parallax apagado con cualquier puntero, el umbral de 767 px que dispara el
 * cambio de contexto con una sola instancia de cada bucle al otro lado, y que el
 * módulo no escribe un solo estilo inline de altura sobre `.home` ni `.home__pin`.
 *
 * La tarea 12.1 añade el ScrollTrigger espejo de `home-orbita`. Su contrato es,
 * sobre todo, de omisión: la instancia ajena se **lee** y no se toca. Aquí se
 * comprueba esa mitad —las cinco lecturas permitidas (`scroller`, `trigger` y
 * `vars.start` / `vars.end` / `vars.scrub`), la ausencia de `kill()`,
 * `disable()`, `refresh()` y de toda reasignación de sus callbacks, la única
 * búsqueda por id envuelta para no propagar excepción— y la otra mitad: el
 * espejo con su propio id y su `invalidateOnRefresh`, la timeline vacía y lineal
 * de la que colgará la coreografía, el scroller heredado en vez de uno nuevo, las
 * dos guardas que lo cancelan antes de crear nada y una limpieza que mata solo lo
 * que la pieza creó. El diff nulo de `orbita.ts` lo confirma desde el otro lado.
 *
 * La tarea 12.2 cuelga de esa timeline los nueve tramos del scrub. Sus valores
 * son `keyframesFondo(plan.topeOverlay)` y ya los cubren las Propiedades 2, 3 y 4
 * sobre el módulo puro, así que aquí se comprueba lo propio de la traducción: un
 * `fromTo` por keyframe colgado en su `inicio` con la duración de su tramo —la
 * regla que hace que el largo total sea 1 y que el tiempo de la timeline **sea**
 * el progreso—, el ease lineal heredado de los `defaults`, `immediateRender:
 * false`, la ausencia de `overwrite`, `repeat`, `yoyo` y `delay`, el reparto de
 * los tres canales sin que la foto atenúe con `opacity` y brillo a la vez, y la
 * bolsa de objetivos reducida a las cuatro capas que el fondo posee, de modo que
 * la coreografía de `Orbita_Home` queda fuera de alcance por construcción.
 *
 * La tarea 12.3 cierra la fase con la pausa de los bucles por progreso. La
 * frontera es `debenPausarBucles`, ya cubierta por la Propiedad 9, así que aquí se
 * comprueba la costura: el `onUpdate` del ST **espejo** como único disparador, el
 * `pause()` / `resume()` que conserva el `progress()` sin un solo `set` de la
 * propiedad, el `will-change` retirado mientras están pausados y restaurado al
 * reanudar, el colector compartido como único alcance —ni los ecos, ni el
 * parallax, ni un objeto de `Orbita_Home`— y, sobre todo, la composición con la
 * pausa por visibilidad: las dos mecánicas solo reanudan lo que ellas mismas
 * pausaron, de modo que un cambio de pestaña no deshace una pausa por scroll ni
 * al revés.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 2.1, 2.4, 2.5,
 * 2.6, 2.8, 2.11, 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 3.8, 4.1, 4.2, 4.3, 4.4, 4.5,
 * 4.6, 4.7, 4.8, 4.9, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11,
 * 11.1, 11.2, 11.3, 11.7, 11.8, 11.9, 11.10, 11.11, 12.1, 12.2, 12.3, 12.4, 12.5, 12.7,
 * 13.1, 13.5, 13.9, 13.10, 14.1, 14.3, 14.5, 14.7, 14.10
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  BUCLE_EQ,
  CONDICIONES_MM,
  EASINGS_SUAVES,
  ENTRADA_FOTO,
  FRONTERAS_SCRUB,
  IDLE_FOTO,
  P_PAUSA,
  PROPS_LAYOUT,
  PROPS_PERMITIDAS,
  RANGO_TRAMO_FOTO,
  SELECTORES_FONDO,
  TOPE_OVERLAY_CON_MEZCLA,
  TOPE_OVERLAY_SIN_MEZCLA,
  bucleDe,
  cicloEnRango,
  debenPausarBucles,
  keyframesFondo,
  largoKeyframe,
  parallaxActivo,
  planFondo,
  valoresFondoEn,
} from "../src/escenas/home/fondo.curvas";
import type {
  BucleFondo,
  Keyframe,
  ModoFondo,
  ObjetivoFondo,
  ValoresFondo,
} from "../src/escenas/home/fondo.curvas";

const fuente = readFileSync(
  fileURLToPath(new URL("../src/escenas/home/fondo.ts", import.meta.url)),
  "utf8",
);

/** Selectores literales que `fondo.ts` consulta contra el DOM. */
function selectoresLocales(): readonly string[] {
  const encontrados = [...fuente.matchAll(/const SELECTOR_[A-Z_]+ = (?:"([^"]*)"|'([^']*)')/g)];
  return encontrados.map((m) => m[1] ?? m[2] ?? "");
}

/**
 * Cuerpo de una función declarada en `fondo.ts`, sin sus comentarios de línea y
 * sin su JSDoc: llega hasta la primera llave de cierre en la columna 0.
 */
function cuerpoDe(nombre: string): string {
  const inicio = fuente.indexOf(`function ${nombre}(`);
  expect(inicio).toBeGreaterThanOrEqual(0);

  const resto = fuente.slice(inicio);
  const fin = resto.indexOf("\n}\n");

  return (fin === -1 ? resto : resto.slice(0, fin))
    .split("\n")
    .filter((linea) => !linea.trimStart().startsWith("//"))
    .join("\n");
}

/** Claves de objeto literal presentes en un fragmento de fuente. */
function clavesDe(fragmento: string): readonly string[] {
  return [...fragmento.matchAll(/[{,]\s*([A-Za-z_$][\w$]*)\s*:/g)].map((m) => m[1]);
}

/** Ocurrencias de un literal en la fuente completa. */
function veces(literal: string): number {
  return fuente.split(literal).length - 1;
}

/** Knobs de configuración de GSAP admitidos junto a las propiedades animadas. */
const CONFIG_GSAP: readonly string[] = [
  "duration",
  "delay",
  "ease",
  "repeat",
  "yoyo",
  "overwrite",
  "immediateRender",
  "paused",
  "onStart",
  "stagger",
];

describe("fondo.ts · dependencias y estilo", () => {
  it("obtiene GSAP solo por `ensureGsap`, sin registrar plugins ni importarlos", () => {
    expect(fuente).toContain('from "../../motion/gsap"');
    expect(fuente).toContain("ensureGsap()");
    expect(fuente).not.toContain("registerPlugin");
    expect(fuente).not.toContain('from "gsap');
    expect(fuente).not.toContain("SplitText");
    expect(fuente).not.toContain("MorphSVG");
    expect(fuente).not.toContain("lenis");
  });

  it("no anota `any` ni suprime errores de TypeScript", () => {
    expect(fuente).not.toContain(": any");
    expect(fuente).not.toContain("@ts-ignore");
    expect(fuente).not.toContain("@ts-expect-error");
  });

  it("declara el tipo de retorno de las dos funciones exportadas", () => {
    expect(fuente).toContain("export function montarFondoHome(root: HTMLElement): LimpiezaFondo");
    expect(fuente).toContain("export function resolverNodosFondo(root: HTMLElement): NodosFondo");
  });

  it("toma la lógica pura de `fondo.curvas` en vez de duplicarla", () => {
    for (const nombre of [
      "CONDICIONES_MM",
      "capacidadesSuficientes",
      "esQuieto",
      "esQuietoPorDefecto",
      "planFondo",
    ]) {
      expect(fuente).toContain(nombre);
      expect(fuente).not.toContain(`function ${nombre}(`);
    }
    expect(fuente).toContain('from "./fondo.curvas"');
  });

  it("consulta solo selectores de la lista blanca del fondo", () => {
    const locales = selectoresLocales();
    expect(locales.length).toBeGreaterThanOrEqual(6);
    for (const selector of locales) {
      expect(SELECTORES_FONDO).toContain(selector);
    }
    // Ni el grano p5 ni los objetivos de `Orbita_Home` entran por aquí.
    for (const ajeno of [".grano", "canvas", ".home__cue", ".home__play", ".collage article"]) {
      expect(fuente).not.toContain(ajeno);
    }
  });
});

describe("fondo.ts · contexto y guardas", () => {
  it("abre un único `matchMedia` con `CONDICIONES_MM` acotado a la raíz y revierte al limpiar", () => {
    expect([...fuente.matchAll(/const mm = gsap\.matchMedia\(\);/g)]).toHaveLength(1);
    expect(fuente).toContain("mm.add(");
    expect(fuente).toContain("CONDICIONES_MM,");
    expect(fuente).toContain("return () => mm.revert();");
  });

  it("resuelve el modo con las tres fuentes de `Modo_Quieto`", () => {
    expect(fuente).toContain("condicion: Boolean(context.conditions?.isReduce)");
    expect(fuente).toContain("clase: claseQuieto()");
    expect(fuente).toContain("store: storeQuieto()");
    expect(fuente).toContain('classList.contains("reduce")');
    expect(fuente).toContain("get(reduce)");
    expect(fuente).toContain("planFondo(modo)");
  });

  it("calcula el soporte de mezcla con `CSS.supports`", () => {
    expect(fuente).toContain('CSS.supports("mix-blend-mode", "plus-lighter")');
  });

  it("sale con limpieza vacía cuando no hay `.home__fondo`", () => {
    expect(fuente).toContain("if (nodos.fondo === null) return LIMPIEZA_VACIA;");
  });

  it("avisa y no crea tweens cuando el registro no trae ScrollTrigger y Flip", () => {
    expect(fuente).toContain("if (!capacidadesSuficientes(capacidadesDelRegistro(gsap)))");
    const guarda = fuente.slice(fuente.indexOf("capacidadesDelRegistro(gsap)))"));
    expect(guarda.slice(0, 300)).toContain("console.warn");
    expect(guarda.slice(0, 300)).toContain("LIMPIEZA_VACIA");
  });

  it("asume quieto y deja constancia cuando falta `gsap.matchMedia`", () => {
    expect(fuente).toContain("esQuietoPorDefecto({ matchMedia: hayMatchMedia(gsap) })");
    expect(fuente).toContain('root.dataset.fondoMotion = "no-detectado"');
    expect(fuente).toContain("delete root.dataset.fondoMotion;");
  });

  it("avisa cuando falta la capa fotográfica y nunca lanza al resolver", () => {
    const cuerpo = fuente.slice(
      fuente.indexOf("export function resolverNodosFondo"),
      fuente.indexOf("/** Evalúa una media query"),
    );
    expect(cuerpo).toContain("if (foto === null)");
    expect(cuerpo).toContain("console.warn");
    expect(cuerpo).toContain("try {");
    expect(cuerpo).toContain("} catch {");
    expect(cuerpo).toContain("return NODOS_VACIOS;");
  });
});

describe("fondo.ts · entrada y respiración de la foto", () => {
  const foto = cuerpoDe("montarFoto");

  it("cuelga la pieza de la costura `montarPiezas`", () => {
    const piezas = cuerpoDe("montarPiezas");
    expect(piezas).toContain("montarFoto(contexto)");
    expect(piezas).toContain("if (foto !== null) limpiezas.push(foto);");
  });

  it("monta la entrada con `fromTo` de `scale`/`opacity` desde `plan.entrada`", () => {
    expect(foto).toContain("const entradaFoto = gsap.timeline(");
    expect(foto).toContain("entradaFoto.fromTo(");
    expect(foto).toContain("{ scale: entrada.escala, opacity: entrada.opacidad }");
    expect(foto).toContain("scale: 1,");
    expect(foto).toContain("opacity: 1,");
    expect(foto).toContain("duration: entrada.duracion,");
    expect(foto).toContain("ease: entrada.ease,");
  });

  it("monta el bucle idle con `repeat: -1` y `yoyo` desde `plan.bucleFoto`", () => {
    expect(foto).toContain("const idleFoto = gsap.timeline({ paused: true });");
    expect(foto).toContain("idleFoto.fromTo(");
    expect(foto).toContain("{ scale: bucleFoto.desde }");
    expect(foto).toContain("scale: bucleFoto.hasta,");
    expect(foto).toContain("duration: bucleFoto.tramo,");
    expect(foto).toContain("ease: bucleFoto.ease,");
    expect(foto).toContain("repeat: REPETICION_BUCLE,");
    expect(foto).toContain("yoyo: bucleFoto.yoyo,");
    // El `fromTo` del bucle no puede pintar su valor de partida al crearse: le
    // robaría a la entrada su `scale` inicial (Req 1.1).
    expect(foto).toContain("immediateRender: false,");
  });

  it("encadena el bucle tras la entrada, en el mismo tick", () => {
    expect(foto).toContain('entradaFoto.eventCallback("onComplete"');
    expect(foto).toContain("idleFoto.play(0);");
  });

  it("declara `overwrite: \"auto\"` en los dos tweens de la foto", () => {
    expect([...foto.matchAll(/overwrite: "auto",/g)]).toHaveLength(2);
  });

  it("mantiene un único bucle infinito sobre la foto", () => {
    expect([...foto.matchAll(/REPETICION_BUCLE/g)]).toHaveLength(1);
    expect([...foto.matchAll(/repeat:/g)]).toHaveLength(1);
    expect([...foto.matchAll(/gsap\.timeline\(/g)]).toHaveLength(2);
  });

  it("aplica `will-change: transform` al arrancar y lo retira en la limpieza", () => {
    expect(fuente).toContain('const WILL_CHANGE_FOTO = "transform";');
    expect(fuente).toContain("foto.style.willChange = WILL_CHANGE_FOTO;");
    expect(fuente).toContain("foto.style.removeProperty(PROP_WILL_CHANGE);");
    expect(fuente).toContain('const PROP_WILL_CHANGE = "will-change";');
    expect(foto).toContain("if (plan.willChange) aplicarWillChange(foto);");
    // La retirada vive en la limpieza que devuelve la pieza, junto al `kill`.
    const limpieza = foto.slice(foto.indexOf("return () => {"));
    expect(limpieza).toContain("idleFoto.kill();");
    expect(limpieza).toContain("entradaFoto.kill();");
    expect(limpieza).toContain("retirarWillChange(foto);");
  });

  it("sin `Capa_Foto` y en `Modo_Quieto` no crea ninguna de las dos timelines", () => {
    const guardas = foto.slice(0, foto.indexOf("const entradaFoto"));
    expect(guardas).toContain("if (foto === null) return null;");
    expect(guardas).toContain("if (entrada === null || bucleFoto === null) return null;");
    // Las guardas van antes de cualquier creación de timeline.
    expect(guardas).not.toContain("gsap.timeline(");
  });

  it("anima solo propiedades de la lista blanca, ninguna de layout", () => {
    const claves = clavesDe(foto);
    expect(claves.length).toBeGreaterThanOrEqual(8);

    for (const clave of claves) {
      const permitida =
        (PROPS_PERMITIDAS as readonly string[]).includes(clave) || CONFIG_GSAP.includes(clave);
      expect(permitida, `clave inesperada en montarFoto: ${clave}`).toBe(true);
      expect(PROPS_LAYOUT).not.toContain(clave);
    }
  });

  it("no copia ninguna cifra ni easing de las tablas de motion", () => {
    // Todo lo numérico llega por `plan.entrada` y `plan.bucleFoto`: en el cuerpo
    // de la pieza no queda un solo decimal (Req 12.7).
    expect(foto).not.toMatch(/\d+\.\d+/);
    expect(fuente).not.toContain('"power2.out"');
    expect(fuente).not.toContain('"sine.inOut"');

    // Las tablas no se importan: `planFondo` ya las resolvió para la variante.
    const fin = fuente.indexOf('} from "./fondo.curvas"');
    const importado = fuente.slice(fuente.lastIndexOf("import {", fin), fin);
    expect(importado).toContain("REPETICION_BUCLE");
    expect(importado).not.toContain("ENTRADA_FOTO");
    expect(importado).not.toContain("IDLE_FOTO");
    expect(importado).not.toContain("varianteFondo");
  });
});

describe("fondo.ts · bucles desfasados de la onda y el halo", () => {
  const onda = cuerpoDe("montarOnda");
  const halo = cuerpoDe("montarHalo");

  it("cuelga las dos piezas de la costura `montarPiezas`", () => {
    const piezas = cuerpoDe("montarPiezas");
    expect(piezas).toContain("montarOnda(contexto)");
    expect(piezas).toContain("if (onda !== null) limpiezas.push(onda);");
    expect(piezas).toContain("montarHalo(contexto)");
    expect(piezas).toContain("if (halo !== null) limpiezas.push(halo);");
  });

  it("toma sus tablas de `plan.buclesOverlay`, no de las constantes de motion", () => {
    const fin = fuente.indexOf('} from "./fondo.curvas"');
    const importado = fuente.slice(fuente.lastIndexOf("import {", fin), fin);
    expect(importado).toContain("bucleDe");
    expect(importado).not.toContain("BUCLE_ONDA");
    expect(importado).not.toContain("BUCLE_HALO");
    expect(importado).not.toContain("DESFASES_OVERLAY");

    expect(fuente).toContain("bucleDe(plan.buclesOverlay, objetivo)");
    expect(onda).toContain('bucleConFiltro(plan, "onda")');
    expect(halo).toContain('bucleConFiltro(plan, "halo")');
  });

  it("mueve la onda en porcentaje y la desenfoca con el tramo de `filter`", () => {
    expect(onda).toContain("const bucleOnda = gsap.timeline(");
    expect(onda).toContain("bucleOnda.fromTo(");
    expect(onda).toContain("x: enPorcentaje(bucle.desde),");
    expect(onda).toContain("x: enPorcentaje(bucle.hasta),");
    expect(onda).toContain("filter: cadenaFiltro(bucle.filtro, bucle.filtro.desde),");
    expect(onda).toContain("filter: cadenaFiltro(bucle.filtro, bucle.filtro.hasta),");
    expect(onda).toContain("duration: bucle.tramo,");
    expect(onda).toContain("ease: bucle.ease,");
  });

  it("late el halo en `scale` y en brillo con el mismo tramo de `filter`", () => {
    expect(halo).toContain("const bucleHalo = gsap.timeline(");
    expect(halo).toContain("bucleHalo.fromTo(");
    expect(halo).toContain("scale: bucle.desde,");
    expect(halo).toContain("scale: bucle.hasta,");
    expect(halo).toContain("filter: cadenaFiltro(bucle.filtro, bucle.filtro.desde),");
    expect(halo).toContain("filter: cadenaFiltro(bucle.filtro, bucle.filtro.hasta),");
    expect(halo).toContain("duration: bucle.tramo,");
    expect(halo).toContain("ease: bucle.ease,");
  });

  it("declara `repeat: -1`, el `yoyo` de la tabla y `overwrite: \"auto\"` en ambos", () => {
    for (const cuerpo of [onda, halo]) {
      expect(cuerpo).toContain("repeat: REPETICION_BUCLE,");
      expect(cuerpo).toContain("yoyo: bucle.yoyo,");
      expect([...cuerpo.matchAll(/overwrite: "auto",/g)]).toHaveLength(1);
    }
  });

  it("aplica el desfase de la tabla como retardo de arranque de cada bucle", () => {
    expect([...onda.matchAll(/delay: bucle\.desfase/g)]).toHaveLength(1);
    expect([...halo.matchAll(/delay: bucle\.desfase/g)]).toHaveLength(1);
    // El desfase nunca se escribe a mano: viene de `DESFASES_OVERLAY` por la tabla.
    expect(fuente).not.toContain("desfase:");
  });

  it("no toca `opacity`: esa propiedad pertenece al scrub (diseño D4)", () => {
    for (const cuerpo of [onda, halo]) {
      expect(cuerpo).not.toContain("opacity");
    }
  });

  it("mantiene un único bucle infinito por objetivo", () => {
    // El import más un uso por cada uno de los cuatro bucles infinitos vivos.
    expect(veces("REPETICION_BUCLE")).toBe(5);
    for (const cuerpo of [onda, halo]) {
      expect([...cuerpo.matchAll(/repeat:/g)]).toHaveLength(1);
      expect([...cuerpo.matchAll(/gsap\.timeline\(/g)]).toHaveLength(1);
    }
  });

  it("sin el nodo de la capa o sin su bucle en el plan no crea la timeline", () => {
    const guardaOnda = onda.slice(0, onda.indexOf("const bucleOnda"));
    expect(guardaOnda).toContain("if (onda === null) return null;");
    expect(guardaOnda).toContain("if (bucle === null) return null;");
    expect(guardaOnda).not.toContain("gsap.timeline(");

    const guardaHalo = halo.slice(0, halo.indexOf("const bucleHalo"));
    expect(guardaHalo).toContain("if (halo === null) return null;");
    expect(guardaHalo).toContain("if (bucle === null) return null;");
    expect(guardaHalo).not.toContain("gsap.timeline(");

    // La ausencia del tramo de `filter` cuenta como ausencia de bucle.
    const selector = cuerpoDe("bucleConFiltro");
    expect(selector).toContain("if (bucle === null || bucle.filtro === undefined) return null;");
  });

  it("mata su timeline en la limpieza que devuelve cada pieza", () => {
    expect(onda.slice(onda.indexOf("return () => {"))).toContain("bucleOnda.kill();");
    expect(halo.slice(halo.indexOf("return () => {"))).toContain("bucleHalo.kill();");
  });

  it("anima solo propiedades de la lista blanca, ninguna de layout", () => {
    for (const cuerpo of [onda, halo]) {
      const claves = clavesDe(cuerpo);
      expect(claves.length).toBeGreaterThanOrEqual(8);

      for (const clave of claves) {
        const permitida =
          (PROPS_PERMITIDAS as readonly string[]).includes(clave) || CONFIG_GSAP.includes(clave);
        expect(permitida, `clave inesperada en un bucle overlay: ${clave}`).toBe(true);
        expect(PROPS_LAYOUT).not.toContain(clave);
      }
    }
  });

  it("no copia ninguna cifra, unidad ni easing de las tablas de motion", () => {
    for (const cuerpo of [onda, halo]) {
      expect(cuerpo).not.toMatch(/\d+\.\d+/);
      expect(cuerpo).not.toContain("blur(");
      expect(cuerpo).not.toContain("brightness(");
      expect(cuerpo).not.toContain('"%"');
    }
  });
});

describe("fondo.ts · bucle en cascada de las barras EQ", () => {
  const eq = cuerpoDe("montarEq");

  it("cuelga la pieza de la costura `montarPiezas`", () => {
    const piezas = cuerpoDe("montarPiezas");
    expect(piezas).toContain("montarEq(contexto)");
    expect(piezas).toContain("if (eq !== null) limpiezas.push(eq);");
  });

  it("toma su tabla de `plan.buclesOverlay` con `bucleDe`, sin pasar por el filtro", () => {
    const fin = fuente.indexOf('} from "./fondo.curvas"');
    const importado = fuente.slice(fuente.lastIndexOf("import {", fin), fin);
    expect(importado).toContain("bucleDe");
    expect(importado).toContain("PASO_EQ");
    expect(importado).not.toContain("BUCLE_EQ");
    expect(importado).not.toContain("BARRAS_EQ");

    expect(eq).toContain('bucleDe(plan.buclesOverlay, "eq")');
    // El bucle de las barras es el único de la terna sin tramo de `filter`.
    expect(eq).not.toContain("bucleConFiltro");
    expect(eq).not.toContain("cadenaFiltro");
    expect(eq).not.toContain("filter");
  });

  it("estira las barras en `scaleY` entre los extremos de la tabla", () => {
    expect(eq).toContain("const bucleEq = gsap.timeline(");
    expect(eq).toContain("bucleEq.fromTo(");
    expect(eq).toContain("{ scaleY: bucle.desde }");
    expect(eq).toContain("scaleY: bucle.hasta,");
    expect(eq).toContain("duration: bucle.tramo,");
    expect(eq).toContain("ease: bucle.ease,");
  });

  it("declara `repeat: -1`, el `yoyo` de la tabla y `overwrite: \"auto\"`", () => {
    expect(eq).toContain("repeat: REPETICION_BUCLE,");
    expect(eq).toContain("yoyo: bucle.yoyo,");
    expect([...eq.matchAll(/overwrite: "auto",/g)]).toHaveLength(1);
  });

  it("escalona las siete barras con `PASO_EQ` en una sola timeline", () => {
    expect(eq).toContain("stagger: PASO_EQ,");
    expect([...eq.matchAll(/stagger:/g)]).toHaveLength(1);
    // Una timeline y un `fromTo` para toda la lista de barras, no uno por nodo.
    expect([...eq.matchAll(/gsap\.timeline\(/g)]).toHaveLength(1);
    expect([...eq.matchAll(/\.fromTo\(/g)]).toHaveLength(1);
    expect([...eq.matchAll(/repeat:/g)]).toHaveLength(1);
    expect(eq).toContain("barras,");
    expect(eq).not.toContain("for (");
  });

  it("aplica el desfase de la tabla como retardo de arranque", () => {
    expect([...eq.matchAll(/delay: bucle\.desfase/g)]).toHaveLength(1);
  });

  it("deja `transform-origin` al CSS de las barras", () => {
    expect(eq).not.toContain("transformOrigin");
    expect(fuente).not.toContain("transformOrigin");
    expect(eq).not.toContain("style.");
  });

  it("no toca `opacity`: esa propiedad pertenece al scrub (diseño D4)", () => {
    expect(eq).not.toContain("opacity");
  });

  it("sin barras en el DOM o sin su bucle en el plan no crea la timeline", () => {
    const guarda = eq.slice(0, eq.indexOf("const bucleEq"));
    expect(guarda).toContain("if (barras.length === 0) return null;");
    expect(guarda).toContain("if (bucle === null) return null;");
    // En compacto `plan.buclesOverlay` no trae la entrada `eq`, así que la misma
    // guarda cubre Req 12.2 sin rama propia de viewport.
    expect(guarda).not.toContain("gsap.timeline(");
    expect(eq).not.toContain("modo.compacto");
  });

  it("mata solo su propia timeline en la limpieza que devuelve", () => {
    const limpieza = eq.slice(eq.indexOf("return () => {"));
    expect(limpieza).toContain("bucleEq.kill();");
    expect([...limpieza.matchAll(/\.kill\(\)/g)]).toHaveLength(1);
  });

  it("anima solo propiedades de la lista blanca, ninguna de layout", () => {
    const claves = clavesDe(eq);
    expect(claves.length).toBeGreaterThanOrEqual(8);

    for (const clave of claves) {
      const permitida =
        (PROPS_PERMITIDAS as readonly string[]).includes(clave) || CONFIG_GSAP.includes(clave);
      expect(permitida, `clave inesperada en montarEq: ${clave}`).toBe(true);
      expect(PROPS_LAYOUT).not.toContain(clave);
    }
  });

  it("no copia ninguna cifra, unidad ni easing de la tabla de motion", () => {
    expect(eq).not.toMatch(/\d+\.\d+/);
    expect(eq).not.toContain('"%"');
  });
});

describe("fondo.ts · cascada de entrada de los ecos", () => {
  const ecos = cuerpoDe("montarEcos");

  it("cuelga la pieza de la costura `montarPiezas`", () => {
    const piezas = cuerpoDe("montarPiezas");
    expect(piezas).toContain("montarEcos(contexto)");
    expect(piezas).toContain("if (ecos !== null) limpiezas.push(ecos);");
  });

  it("recalcula el calendario con el recuento real de nodos, sin tocar la tabla", () => {
    const fin = fuente.indexOf('} from "./fondo.curvas"');
    const importado = fuente.slice(fuente.lastIndexOf("import {", fin), fin);
    expect(importado).toContain("calendarioEcos");
    expect(importado).not.toContain("ENTRADA_ECOS");
    expect(importado).not.toContain("objetivosEcos");
    expect(importado).not.toContain("pasoEcos");

    expect(ecos).toContain("calendarioEcos(ecos.length, modo)");
    expect(fuente).not.toContain("function calendarioEcos(");
  });

  it("aplica el estado inicial con `gsap.set` antes de crear la timeline", () => {
    const antes = ecos.slice(0, ecos.indexOf("const entradaEcos"));
    expect(antes).toContain("gsap.set(animados, { opacity: 0, y: calendario.yDesde });");
  });

  it("traduce el calendario a un único `fromTo` con `stagger`", () => {
    expect(ecos).toContain("const entradaEcos = gsap.timeline();");
    expect(ecos).toContain("entradaEcos.fromTo(");
    expect(ecos).toContain("{ opacity: 0, y: calendario.yDesde }");
    expect(ecos).toContain("opacity: 1,");
    expect(ecos).toContain("y: 0,");
    expect(ecos).toContain("duration: duracion,");
    expect(ecos).toContain("ease: calendario.ease,");
    expect(ecos).toContain("stagger: calendario.paso,");
    expect([...ecos.matchAll(/stagger:/g)]).toHaveLength(1);
    expect([...ecos.matchAll(/\.fromTo\(/g)]).toHaveLength(1);
    expect(ecos).toContain("const duracion = calendario.pasos[0].duracion;");
  });

  it("es una sola pasada: sin `repeat`, sin `yoyo` y sin bucle infinito", () => {
    expect(ecos).not.toContain("repeat:");
    expect(ecos).not.toContain("yoyo");
    expect(ecos).not.toContain("REPETICION_BUCLE");
  });

  it("corta la cascada con un cierre en espera de duración `calendario.corte`", () => {
    expect(ecos).toContain("const cierreEcos = gsap.timeline({ paused: true });");
    expect(ecos).toContain("cierreEcos.to(animados, {");
    expect(ecos).toContain("duration: calendario.corte,");

    const cortar = ecos.slice(
      ecos.indexOf("const cortar ="),
      ecos.indexOf("window.addEventListener"),
    );
    expect(cortar).toContain("entradaEcos.kill();");
    expect(cortar).toContain("cierreEcos.play(0);");
  });

  it("dispara el corte con una única escucha de scroll y la suelta al terminar", () => {
    expect(fuente).toContain(
      "const OPCIONES_ESCUCHA_ECOS = { passive: true, capture: true, once: true } as const;",
    );
    expect(ecos).toContain('window.addEventListener("scroll", cortar, OPCIONES_ESCUCHA_ECOS);');
    expect([...ecos.matchAll(/window\.addEventListener\(/g)]).toHaveLength(1);
    expect(ecos).toContain('window.removeEventListener("scroll", cortar, OPCIONES_ESCUCHA_ECOS);');
    expect(ecos).toContain('entradaEcos.eventCallback("onComplete", soltarEscucha);');
  });

  it("sin ecos en el DOM y en `Modo_Quieto` no crea ninguna timeline", () => {
    const guardas = ecos.slice(0, ecos.indexOf("const duracion"));
    expect(guardas).toContain("if (ecos.length === 0) return null;");
    expect(guardas).toContain("if (plan.ecos === null) return null;");
    expect(guardas).toContain("if (calendario === null) return null;");
    expect(guardas).not.toContain("gsap.timeline(");
    expect(guardas).not.toContain("gsap.set(");
    expect(guardas).not.toContain("addEventListener");
  });

  it("en compacto anima solo lo que el calendario declara, sin rama de viewport", () => {
    expect(ecos).toContain("const animados = ecos.slice(0, calendario.pasos.length);");
    expect(ecos).not.toContain("modo.compacto");
  });

  it("deja `.home__fragmentos` fuera de sus objetivos", () => {
    expect(ecos).not.toContain("fragmentos");
    expect(fuente).not.toContain(".home__fragmentos");
  });

  it("suelta la escucha y mata solo sus dos timelines en la limpieza", () => {
    const limpieza = ecos.slice(ecos.lastIndexOf("return () => {"));
    expect(limpieza).toContain("soltarEscucha();");
    expect(limpieza).toContain("cierreEcos.kill();");
    expect(limpieza).toContain("entradaEcos.kill();");
    expect([...limpieza.matchAll(/\.kill\(\)/g)]).toHaveLength(2);
  });

  it("anima solo propiedades de la lista blanca, ninguna de layout", () => {
    const claves = clavesDe(ecos);
    expect(claves.length).toBeGreaterThanOrEqual(8);

    for (const clave of claves) {
      const permitida =
        (PROPS_PERMITIDAS as readonly string[]).includes(clave) || CONFIG_GSAP.includes(clave);
      expect(permitida, `clave inesperada en montarEcos: ${clave}`).toBe(true);
      expect(PROPS_LAYOUT).not.toContain(clave);
    }
  });

  it("no copia ninguna cifra ni easing del calendario", () => {
    expect(ecos).not.toMatch(/\d+\.\d+/);
    expect(ecos).not.toContain('"power2.out"');
    expect(ecos).not.toContain("SELECTOR_KICKER");
    expect(ecos).not.toContain("SELECTOR_ECO");
  });
});

describe("fondo.ts · parallax de puntero", () => {
  const parallax = cuerpoDe("montarParallax");

  it("cuelga la pieza de la costura `montarPiezas`", () => {
    const piezas = cuerpoDe("montarPiezas");
    expect(piezas).toContain("montarParallax(contexto)");
    expect(piezas).toContain("if (parallax !== null) limpiezas.push(parallax);");
  });

  it("toma su aritmética de `fondo.curvas` en vez de duplicarla", () => {
    const fin = fuente.indexOf('} from "./fondo.curvas"');
    const importado = fuente.slice(fuente.lastIndexOf("import {", fin), fin);
    expect(importado).toContain("PARALLAX");
    expect(importado).toContain("desplazamientoParallax");
    expect(importado).toContain("salidaParallax");
    expect(importado).not.toContain("parallaxActivo");

    expect(fuente).not.toContain("function desplazamientoParallax(");
    expect(fuente).not.toContain("function salidaParallax(");
  });

  it("mueve `.home__fondo` con dos `quickTo`, uno por eje", () => {
    expect(parallax).toContain("const fondo = nodos.fondo;");
    expect(parallax).toContain('const parallaxX = gsap.quickTo(fondo, "x", tween);');
    expect(parallax).toContain('const parallaxY = gsap.quickTo(fondo, "y", tween);');
    expect([...parallax.matchAll(/gsap\.quickTo\(/g)]).toHaveLength(2);
    // Un tween por eje y ninguna timeline: el parallax no es coreografía.
    expect(parallax).not.toContain("gsap.timeline(");
    expect(parallax).not.toContain("gsap.to(");
  });

  it("toma la duración y el easing de la tabla `PARALLAX`", () => {
    expect(parallax).toContain(
      "const tween = { duration: PARALLAX.duracion, ease: PARALLAX.ease };",
    );
    expect([...parallax.matchAll(/duration:/g)]).toHaveLength(1);
    expect([...parallax.matchAll(/ease:/g)]).toHaveLength(1);
  });

  it("alimenta el cálculo con el punto del evento, la caja medida y el último válido", () => {
    expect(parallax).toContain("const punto = { x: evento.clientX, y: evento.clientY };");
    expect(parallax).toContain("desplazamientoParallax(punto, cajaDe(fondo), aplicado)");
    expect(parallax).toContain("let aplicado: Desplazamiento = salidaParallax();");
    // Cada evento válido actualiza el previo, así que uno inválido devuelve ese
    // mismo valor y el fondo se queda donde estaba (Req 4.9).
    expect(parallax).toContain("aplicado = destino;");
    expect(parallax).toContain("parallaxX(destino.x);");
    expect(parallax).toContain("parallaxY(destino.y);");

    const caja = cuerpoDe("cajaDe");
    expect(caja).toContain("elemento.getBoundingClientRect()");
    expect(caja).toContain(
      "return { izquierda: rect.left, arriba: rect.top, ancho: rect.width, alto: rect.height };",
    );
  });

  it("registra tres escuchas pasivas: movimiento y las dos salidas al centro", () => {
    expect(fuente).toContain(
      "const OPCIONES_ESCUCHA_PARALLAX = { passive: true, capture: false } as const;",
    );
    expect(parallax).toContain(
      'root.addEventListener("pointermove", mover, OPCIONES_ESCUCHA_PARALLAX);',
    );
    expect(parallax).toContain(
      'root.addEventListener("pointerleave", salir, OPCIONES_ESCUCHA_PARALLAX);',
    );
    expect(parallax).toContain('window.addEventListener("blur", salir, OPCIONES_ESCUCHA_PARALLAX);');
    expect([...parallax.matchAll(/\.addEventListener\(/g)]).toHaveLength(3);
  });

  it("devuelve al centro con `salidaParallax` y el mismo tween corto", () => {
    const salir = parallax.slice(parallax.indexOf("const salir ="), parallax.indexOf("root.add"));
    expect(salir).toContain("aplicar(salidaParallax());");
    // Las dos salidas comparten manejador: `pointerleave` y `blur`.
    expect([...parallax.matchAll(/const salir = /g)]).toHaveLength(1);
  });

  it("no registra nada sin `.home__fondo` ni con `plan.parallax` en falso", () => {
    const guardas = parallax.slice(0, parallax.indexOf("const tween ="));
    expect(guardas).toContain("if (fondo === null) return null;");
    expect(guardas).toContain("if (!plan.parallax) return null;");
    expect(guardas).not.toContain("gsap.quickTo(");
    expect(guardas).not.toContain("addEventListener");
    // `plan.parallax` ya es `parallaxActivo(modo)`: sin rama propia de puntero,
    // de viewport ni de movimiento reducido (Req 4.4, 4.5, 12.3).
    expect(parallax).not.toContain("modo.punteroFino");
    expect(parallax).not.toContain("modo.compacto");
    expect(parallax).not.toContain("modo.quieto");
  });

  it("resuelve `Puntero_Fino` por media query, falso sin `matchMedia`", () => {
    expect(fuente).toContain('coincide("(hover: hover) and (pointer: fine)")');
    expect(fuente).toContain("punteroFino: punteroFino()");

    const consulta = cuerpoDe("coincide");
    expect(consulta).toContain('typeof window.matchMedia !== "function"');
    expect(consulta).toContain("return false;");
    expect(consulta).toContain("} catch {");
  });

  it("retira las tres escuchas, cancela los dos ejes y deja el fondo en `(0, 0)`", () => {
    expect(fuente).toContain('const EJES_PARALLAX = "x,y";');

    const limpieza = parallax.slice(parallax.indexOf("return () => {"));
    expect(limpieza).toContain(
      'root.removeEventListener("pointermove", mover, OPCIONES_ESCUCHA_PARALLAX);',
    );
    expect(limpieza).toContain(
      'root.removeEventListener("pointerleave", salir, OPCIONES_ESCUCHA_PARALLAX);',
    );
    expect(limpieza).toContain(
      'window.removeEventListener("blur", salir, OPCIONES_ESCUCHA_PARALLAX);',
    );
    expect([...limpieza.matchAll(/removeEventListener\(/g)]).toHaveLength(3);
    expect(limpieza).toContain("gsap.killTweensOf(fondo, EJES_PARALLAX);");
    expect(limpieza).toContain("gsap.set(fondo, salidaParallax());");
  });

  it("anima solo propiedades de la lista blanca, ninguna de layout", () => {
    const claves = clavesDe(parallax);
    expect(claves.length).toBeGreaterThanOrEqual(4);

    for (const clave of claves) {
      const permitida =
        (PROPS_PERMITIDAS as readonly string[]).includes(clave) || CONFIG_GSAP.includes(clave);
      expect(permitida, `clave inesperada en montarParallax: ${clave}`).toBe(true);
      expect(PROPS_LAYOUT).not.toContain(clave);
    }
  });

  it("no copia el alcance, la duración ni el easing de la tabla", () => {
    expect(parallax).not.toMatch(/\d/);
    expect(fuente).not.toContain('"power1.out"');
  });
});

describe("fondo.ts · pausa por visibilidad de la pestaña", () => {
  const visibilidad = cuerpoDe("montarVisibilidad");

  it("cuelga la pieza de la costura `montarPiezas`, después de las que crean bucles", () => {
    const piezas = cuerpoDe("montarPiezas");
    expect(piezas).toContain("montarVisibilidad(contexto)");
    expect(piezas).toContain("if (visibilidad !== null) limpiezas.push(visibilidad);");
    // Va última: actúa sobre el colector y necesita que ya esté lleno.
    for (const previa of ["montarFoto", "montarOnda", "montarEq", "montarHalo", "montarParallax"]) {
      expect(piezas.indexOf("montarVisibilidad(")).toBeGreaterThan(piezas.indexOf(`${previa}(`));
    }
  });

  it("declara el colector de bucles en el contexto y lo crea vacío en cada montaje", () => {
    expect(fuente).toContain("bucles: BucleInfinito[];");
    expect(fuente).toContain('type BucleInfinito = ReturnType<InstanciaGsap["timeline"]>;');
    // Ni una importación de los módulos de GSAP para tipar la timeline (Req 14.1).
    expect(fuente).not.toContain("gsap.core.Timeline");
    expect(fuente).toContain("montarPiezas({ gsap, root, nodos, plan, modo, bucles: [] })");
    expect([...fuente.matchAll(/bucles: \[\]/g)]).toHaveLength(1);
  });

  it("registra en el colector exactamente los cuatro bucles infinitos del fondo", () => {
    expect(cuerpoDe("montarFoto")).toContain("bucles.push(idleFoto);");
    expect(cuerpoDe("montarOnda")).toContain("bucles.push(bucleOnda);");
    expect(cuerpoDe("montarEq")).toContain("bucles.push(bucleEq);");
    expect(cuerpoDe("montarHalo")).toContain("bucles.push(bucleHalo);");
    expect(veces("bucles.push(")).toBe(4);
  });

  it("deja fuera del colector lo que no es un bucle infinito", () => {
    // Una pasada: la entrada de la foto y la cascada de los ecos.
    expect(cuerpoDe("montarFoto")).not.toContain("bucles.push(entradaFoto)");
    expect(cuerpoDe("montarEcos")).not.toContain("bucles.push(");
    // El parallax son dos `quickTo`, no una timeline.
    expect(cuerpoDe("montarParallax")).not.toContain("bucles");
  });

  it("registra una única escucha de `visibilitychange` sobre `document`", () => {
    expect(fuente).toContain('const EVENTO_VISIBILIDAD = "visibilitychange";');
    expect(fuente).toContain(
      "const OPCIONES_ESCUCHA_VISIBILIDAD = { passive: true, capture: false } as const;",
    );
    expect(visibilidad).toContain(
      "document.addEventListener(EVENTO_VISIBILIDAD, alCambiarVisibilidad, OPCIONES_ESCUCHA_VISIBILIDAD)",
    );
    expect([...visibilidad.matchAll(/\.addEventListener\(/g)]).toHaveLength(1);
    expect(veces('addEventListener("visibilitychange"')).toBe(0);
    expect(veces("EVENTO_VISIBILIDAD")).toBe(3);
  });

  it("pausa y reanuda sin crear instancias nuevas ni reiniciar el progreso", () => {
    expect(visibilidad).toContain("if (document.hidden) {");
    expect(visibilidad).toContain("for (const bucle of pausados) bucle.pause();");
    expect(visibilidad).toContain("for (const bucle of pausados) bucle.resume();");
    // `pause()`/`resume()` conservan el `progress()`; nada de recrear ni saltar.
    expect(visibilidad).not.toContain("gsap.timeline(");
    expect(visibilidad).not.toContain(".play(");
    expect(visibilidad).not.toContain(".restart(");
    expect(visibilidad).not.toContain(".progress(");
    expect(visibilidad).not.toContain(".seek(");
    expect(visibilidad).not.toContain(".kill(");
    expect(visibilidad).not.toContain("gsap.set(");
  });

  it("recuerda solo los bucles que estaban corriendo al ocultarse la pestaña", () => {
    expect(visibilidad).toContain("let pausados: readonly BucleInfinito[] = [];");
    expect(visibilidad).toContain("pausados = bucles.filter((bucle) => !bucle.paused());");
    // Al volver, la lista se suelta: una segunda vuelta parte de cero.
    expect([...visibilidad.matchAll(/pausados = \[\];/g)]).toHaveLength(2);
  });

  it("sin bucles en el colector no registra la escucha", () => {
    const guarda = visibilidad.slice(0, visibilidad.indexOf("let pausados"));
    expect(guarda).toContain("if (bucles.length === 0) return null;");
    expect(guarda).not.toContain("addEventListener");
    // La guarda del colector vacío ya cubre `Modo_Quieto`: sin rama propia.
    expect(visibilidad).not.toContain("modo.quieto");
    expect(visibilidad).not.toContain("plan.");
  });

  it("no alcanza ni un objeto de `Orbita_Home` ni de las piezas de una pasada", () => {
    expect(visibilidad).not.toContain("ScrollTrigger");
    expect(visibilidad).not.toContain("montarOrbita");
    expect(visibilidad).not.toContain("orbita");
    expect(visibilidad).not.toContain("entradaFoto");
    expect(visibilidad).not.toContain("entradaEcos");
    expect(visibilidad).not.toContain("cierreEcos");
    expect(visibilidad).not.toContain("parallax");
    // Su único objetivo es el colector del propio fondo.
    expect(visibilidad).toContain("const { bucles } = contexto;");
  });

  it("alcanza la pausa en el mismo tick, sin temporizadores ni frames propios", () => {
    expect(visibilidad).not.toContain("setTimeout");
    expect(visibilidad).not.toContain("setInterval");
    expect(visibilidad).not.toContain("requestAnimationFrame");
    expect(visibilidad).not.toContain("gsap.ticker");
    expect(visibilidad).not.toContain("delay");
    // Ni un plazo escrito a mano: la escucha es síncrona y no hay decimales.
    expect(visibilidad).not.toMatch(/\d+\.\d+/);
  });

  it("retira la escucha y suelta la lista en la limpieza que devuelve", () => {
    const limpieza = visibilidad.slice(visibilidad.indexOf("return () => {"));
    expect(limpieza).toContain("document.removeEventListener(");
    expect(limpieza).toContain("EVENTO_VISIBILIDAD,");
    expect(limpieza).toContain("alCambiarVisibilidad,");
    expect(limpieza).toContain("OPCIONES_ESCUCHA_VISIBILIDAD,");
    expect([...limpieza.matchAll(/removeEventListener\(/g)]).toHaveLength(1);
    expect(limpieza).toContain("pausados = [];");
    // Tras `mm.revert()` las timelines ya están muertas: la pieza no las toca.
    expect([...limpieza.matchAll(/\.kill\(\)/g)]).toHaveLength(0);
  });
});
describe("fondo.ts · reposo de la rama de movimiento reducido", () => {
  const quieto = cuerpoDe("fijarEstadoQuieto");
  const capas = cuerpoDe("capasDelFondo");

  it("cuelga el reposo de la costura `montarPiezas`, delante de toda pieza", () => {
    const piezas = cuerpoDe("montarPiezas");
    expect(piezas).toContain("fijarEstadoQuieto(contexto);");

    for (const pieza of [
      "montarFoto",
      "montarOnda",
      "montarEq",
      "montarHalo",
      "montarEcos",
      "montarParallax",
      "montarVisibilidad",
    ]) {
      expect(piezas.indexOf("fijarEstadoQuieto(")).toBeLessThan(piezas.indexOf(`${pieza}(`));
    }

    // No devuelve limpieza: el revert del contexto es toda la que necesita.
    expect(fuente).toContain("function fijarEstadoQuieto(contexto: ContextoFondo): void");
    expect(piezas).not.toContain("limpiezas.push(quieto)");
  });

  it("solo actúa en `Modo_Quieto`, y la guarda va antes de escribir", () => {
    expect(quieto).toContain("if (!modo.quieto) return;");
    expect(quieto.indexOf("if (!modo.quieto)")).toBeLessThan(quieto.indexOf("gsap.set("));
    // La rama con movimiento no pasa por aquí: las timelines son dueñas de esas
    // propiedades y adelantarles una limpieza no aportaría nada.
    expect(quieto).not.toContain("modo.compacto");
    expect(quieto).not.toContain("plan.");
  });

  it("escribe un único `gsap.set` sin transición y sin dejar tween activo", () => {
    expect(quieto).toContain("gsap.set(capas, { clearProps: PROPS_QUIETO });");
    expect([...quieto.matchAll(/gsap\.set\(/g)]).toHaveLength(1);
    for (const creacion of ["gsap.to(", "gsap.fromTo(", "gsap.timeline(", "gsap.quickTo("]) {
      expect(quieto).not.toContain(creacion);
    }
    // Ni duración, ni ease, ni retardo: la única clave escrita es `clearProps`.
    expect(clavesDe(quieto)).toEqual(["clearProps"]);
  });

  it("retira la lista blanca completa y el `will-change`, sin enumerar propiedades", () => {
    expect(fuente).toContain(
      'const PROPS_QUIETO: string = [...PROPS_PERMITIDAS, PROP_WILL_CHANGE].join(",");',
    );

    // La lista se deriva del módulo puro, así que cubre lo que Req 11.1 exige de
    // `Capa_Foto` y lo que los bucles overlay escriben, y nada de layout.
    const limpiadas: readonly string[] = [...PROPS_PERMITIDAS, "will-change"];
    for (const prop of ["opacity", "scale", "x", "y", "rotation", "scaleY", "filter"]) {
      expect(limpiadas).toContain(prop);
    }
    expect(limpiadas).toContain("will-change");
    for (const prop of PROPS_LAYOUT) {
      expect(limpiadas).not.toContain(prop);
    }

    // Y no se copia ningún valor: lo que queda tras la limpieza es el CSS.
    expect(quieto).not.toMatch(/\d+\.\d+/);
    expect(quieto).not.toContain("style.");
  });

  it("alcanza las capas que el fondo posee y omite las ausentes", () => {
    expect(capas).toContain("nodos.fondo, nodos.foto, nodos.onda, nodos.eq, nodos.halo");
    expect(capas).toContain("if (capa !== null) capas.push(capa);");
    expect(capas).toContain("...nodos.barras");
    expect(capas).toContain("...nodos.ecos");
    expect(quieto).toContain("if (capas.length === 0) return;");

    // Sin consultas propias al DOM: los nodos son los que ya resolvió el módulo,
    // todos dentro de `SELECTORES_FONDO`.
    expect(capas).not.toContain("querySelector");
    expect(capas).not.toContain("document");
  });
});

describe("planFondo · la rama quieto no deja nada que montar", () => {
  const OBJETIVOS: readonly ObjetivoFondo[] = ["foto", "onda", "eq", "halo"];

  /** Las cuatro variantes de entorno que conviven con `Modo_Quieto` activo. */
  const modos: readonly ModoFondo[] = [true, false].flatMap((compacto) =>
    [true, false].map((punteroFino) => ({
      quieto: true,
      compacto,
      punteroFino,
      soporteMezcla: true,
    })),
  );

  it("apaga entrada, bucles, ecos, parallax, `will-change` y scrub en las cuatro", () => {
    for (const modo of modos) {
      const plan = planFondo(modo);

      expect(plan.entrada).toBeNull();
      expect(plan.bucleFoto).toBeNull();
      expect(plan.buclesOverlay).toEqual([]);
      expect(plan.ecos).toBeNull();
      expect(plan.parallax).toBe(false);
      expect(plan.willChange).toBe(false);
      // Sin scrub no hay ScrollTrigger espejo ni coreografía de scroll (Req 5.11).
      expect(plan.scrub).toBe(false);
    }
  });

  it("no entrega bucle para ningún objetivo, así que ninguna timeline existe", () => {
    for (const modo of modos) {
      const plan = planFondo(modo);
      for (const objetivo of OBJETIVOS) {
        expect(bucleDe(plan.buclesOverlay, objetivo)).toBeNull();
      }
    }
  });
});

describe("fondo.ts · cambio en caliente de `prefers-reduced-motion`", () => {
  const montaje = cuerpoDe("montarFondoHome");
  const quieto = cuerpoDe("fijarEstadoQuieto");

  it("declara la condición que dispara el cambio", () => {
    expect(CONDICIONES_MM.isReduce).toBe("(prefers-reduced-motion: reduce)");
    expect(montaje).toContain("CONDICIONES_MM,");
  });

  it("recalcula modo y plan dentro del callback, no una sola vez fuera", () => {
    const alta = montaje.indexOf("mm.add(");
    expect(alta).toBeGreaterThanOrEqual(0);
    expect(montaje.indexOf("const modo: ModoFondo = {")).toBeGreaterThan(alta);
    expect(montaje.indexOf("const plan = planFondo(modo);")).toBeGreaterThan(alta);
    expect(montaje.indexOf("montarPiezas({")).toBeGreaterThan(alta);
    // Una sola llamada a cada uno: el contexto nuevo no puede heredar el plan del
    // revertido, porque no hay plan compartido que heredar.
    expect([...fuente.matchAll(/planFondo\(/g)]).toHaveLength(1);
    expect([...fuente.matchAll(/montarPiezas\(\{/g)]).toHaveLength(1);
  });

  it("deja el revert a `matchMedia` y no escucha la media query por su cuenta", () => {
    expect(montaje).toContain("return () => mm.revert();");
    expect([...montaje.matchAll(/mm\.revert\(\)/g)]).toHaveLength(1);
    // GSAP es el único que reacciona al cambio: ni un listener propio ni una
    // suscripción al store que pudiera remontar por un segundo camino.
    expect(fuente).not.toContain("addListener");
    expect(fuente).not.toContain('addEventListener("change"');
    expect(fuente).not.toContain("reduce.subscribe");
  });

  it("aplica el contexto nuevo en el mismo tick, sin temporizadores ni frames propios", () => {
    for (const cuerpo of [montaje, quieto]) {
      for (const aplazamiento of [
        "setTimeout",
        "setInterval",
        "requestAnimationFrame",
        "delayedCall",
        "gsap.ticker",
      ]) {
        expect(cuerpo).not.toContain(aplazamiento);
      }
    }
  });

  it("devuelve al contexto la limpieza de cada pieza y el indicador de modo", () => {
    const cierre = montaje.slice(montaje.indexOf("const limpiezas = montarPiezas("));
    expect(cierre).toContain("for (const limpieza of limpiezas) limpieza();");
    expect(cierre).toContain("delete root.dataset.fondoMotion;");
    expect(montaje).toContain("root.dataset.fondoMotion = etiquetaModo(modo);");
    expect(cuerpoDe("etiquetaModo")).toContain('if (modo.quieto) return "quieto";');
  });
});

/* ------------------------------------------------------------------------- *
 * Tarea 10.2 · la rama de `Modo_Compacto`
 * ------------------------------------------------------------------------- */

/** Cota de `scale` de la entrada de la foto en compacto (Req 12.7). */
const ESCALA_ENTRADA_COMPACTA = 1.04;

/** Cota de `scale` de la respiración idle de la foto en compacto (Req 12.1). */
const ESCALA_IDLE_COMPACTA = 1.04;

/** Ventana de duración de la entrada de la foto, en segundos (Req 12.7). */
const DURACION_ENTRADA = { min: 0.8, max: 1.2 } as const;

/** Tope de `opacity` de la capa de barras en compacto (Req 12.2). */
const TOPE_EQ_COMPACTO = 0.35;

/** Umbral de viewport que separa las dos variantes de tabla (Req 12.4). */
const UMBRAL_COMPACTO = "(max-width: 767px)";

/**
 * Los cuatro entornos que conviven con `Modo_Compacto` activo y movimiento
 * permitido: puntero fino o grueso, con soporte de mezcla o sin él.
 */
const MODOS_COMPACTOS: readonly ModoFondo[] = [true, false].flatMap((punteroFino) =>
  [true, false].map((soporteMezcla) => ({
    quieto: false,
    compacto: true,
    punteroFino,
    soporteMezcla,
  })),
);

/** Objetivos de los bucles que un plan monta, foto incluida. */
function objetivosDeBucles(bucles: readonly (BucleFondo | null)[]): readonly ObjetivoFondo[] {
  return bucles
    .filter((bucle): bucle is BucleFondo => bucle !== null)
    .map((bucle) => bucle.objetivo);
}

/**
 * Fuente de `fondo.ts` sin comentarios de bloque ni de línea: lo que queda es
 * código ejecutable, así que una mención en prosa no puede aprobar ni suspender
 * un contrato sobre lo que el módulo **escribe**.
 */
function codigoFuente(): string {
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((linea) => !linea.trimStart().startsWith("//"))
    .join("\n");
}

describe("planFondo · la rama compacta trae su tabla y nada más", () => {
  it("entra desde un `scale` no mayor que 1.04, con la opacidad y el ease de la tabla", () => {
    for (const modo of MODOS_COMPACTOS) {
      const entrada = planFondo(modo).entrada;
      expect(entrada).not.toBeNull();
      if (entrada === null) continue;

      expect(entrada.escala).toBeLessThanOrEqual(ESCALA_ENTRADA_COMPACTA);
      expect(entrada.escala).toBeGreaterThan(1);
      expect(entrada.opacidad).toBe(0.65);
      expect(entrada.duracion).toBeGreaterThanOrEqual(DURACION_ENTRADA.min);
      expect(entrada.duracion).toBeLessThanOrEqual(DURACION_ENTRADA.max);
      expect(entrada.ease).toBe("power2.out");
      // La entrada compacta nunca es más amplia que la de escritorio.
      expect(entrada.escala).toBeLessThanOrEqual(ENTRADA_FOTO.amplio.escala);
    }
  });

  it("respira la foto entre 1 y 1.04 con un tramo de 12 s o más", () => {
    for (const modo of MODOS_COMPACTOS) {
      const bucleFoto = planFondo(modo).bucleFoto;
      expect(bucleFoto).not.toBeNull();
      if (bucleFoto === null) continue;

      expect(bucleFoto.desde).toBe(1);
      expect(bucleFoto.hasta).toBeLessThanOrEqual(ESCALA_IDLE_COMPACTA);
      expect(bucleFoto.hasta).toBeGreaterThan(bucleFoto.desde);
      expect(bucleFoto.tramo).toBeGreaterThanOrEqual(RANGO_TRAMO_FOTO.min);
      expect(bucleFoto.tramo).toBeGreaterThanOrEqual(12);
      expect(cicloEnRango(bucleFoto)).toBe(true);
      expect(bucleFoto.ease).toBe("sine.inOut");
      expect(EASINGS_SUAVES as readonly string[]).toContain(bucleFoto.ease);
      expect(bucleFoto.yoyo).toBe(true);
      expect(bucleFoto.props).toEqual(["scale"]);
      // La amplitud compacta no supera la de escritorio.
      expect(bucleFoto.hasta).toBeLessThanOrEqual(IDLE_FOTO.amplio.hasta);
    }
  });

  it("anima exactamente dos de las tres overlays: la onda y el halo", () => {
    for (const modo of MODOS_COMPACTOS) {
      const plan = planFondo(modo);

      expect(plan.buclesOverlay).toHaveLength(2);
      expect([...objetivosDeBucles(plan.buclesOverlay)].sort()).toEqual(["halo", "onda"]);
      expect(bucleDe(plan.buclesOverlay, "onda")).not.toBeNull();
      expect(bucleDe(plan.buclesOverlay, "halo")).not.toBeNull();
    }
  });

  it("deja las barras EQ sin bucle y por debajo del tope de `opacity`", () => {
    // La tabla no ofrece variante compacta: la ausencia es la que apaga la pieza.
    expect(BUCLE_EQ.compacto).toBeNull();
    expect(BUCLE_EQ.amplio).not.toBeNull();

    for (const modo of MODOS_COMPACTOS) {
      const plan = planFondo(modo);

      expect(bucleDe(plan.buclesOverlay, "eq")).toBeNull();
      expect(plan.topeOverlay).toBeGreaterThan(0);
      expect(plan.topeOverlay).toBeLessThanOrEqual(TOPE_EQ_COMPACTO);

      // Y ningún bucle vivo toca `opacity`, así que el tope del estado final es
      // el que la capa conserva (diseño D4, Req 2.8).
      for (const bucle of plan.buclesOverlay) {
        expect(bucle.props).not.toContain("opacity");
      }
    }

    expect(TOPE_OVERLAY_CON_MEZCLA).toBeLessThanOrEqual(TOPE_EQ_COMPACTO);
    expect(TOPE_OVERLAY_SIN_MEZCLA).toBeLessThanOrEqual(TOPE_EQ_COMPACTO);
  });

  it("declara exactamente una instancia de cada bucle: foto, onda y halo", () => {
    for (const modo of MODOS_COMPACTOS) {
      const plan = planFondo(modo);
      const objetivos = objetivosDeBucles([plan.bucleFoto, ...plan.buclesOverlay]);

      expect(objetivos).toHaveLength(3);
      expect(new Set(objetivos).size).toBe(3);
      for (const objetivo of ["foto", "onda", "halo"] as const) {
        expect(objetivos.filter((actual) => actual === objetivo)).toHaveLength(1);
      }
      expect(objetivos).not.toContain("eq");
    }
  });

  it("apaga el parallax con cualquier puntero y deja el scrub en pie", () => {
    for (const modo of MODOS_COMPACTOS) {
      expect(parallaxActivo(modo)).toBe(false);
      expect(planFondo(modo).parallax).toBe(false);
      // El compacto sí conserva coreografía de scroll y `will-change`: lo que se
      // apaga es el puntero, no el recorrido (Req 12.3).
      expect(planFondo(modo).scrub).toBe(true);
      expect(planFondo(modo).willChange).toBe(true);
    }
  });
});

describe("fondo.ts · rama compacta del contexto", () => {
  const montaje = cuerpoDe("montarFondoHome");
  const codigo = codigoFuente();

  it("lee el viewport compacto de la condición de `matchMedia`, con el umbral de 767 px", () => {
    expect(CONDICIONES_MM.isCompacto).toBe(UMBRAL_COMPACTO);
    expect(montaje).toContain("compacto: Boolean(context.conditions?.isCompacto)");
    expect([...montaje.matchAll(/context\.conditions\?\.isCompacto/g)]).toHaveLength(1);
    // El umbral no se escribe a mano en ningún sitio: la única media query propia
    // del módulo es `Puntero_Fino`, que no mira el ancho (Req 11.6, 12.4).
    expect(codigo).not.toContain("max-width");
    expect(codigo).not.toContain("min-width");
    expect(codigo).not.toContain("innerWidth");
    expect([...codigo.matchAll(/window\.matchMedia\(/g)]).toHaveLength(1);
  });

  it("cruza el umbral con un solo revert y un colector nuevo, sin temporizadores", () => {
    expect(montaje).toContain("return () => mm.revert();");
    expect([...montaje.matchAll(/mm\.revert\(\)/g)]).toHaveLength(1);
    // Colector vacío en cada invocación del callback: el contexto nuevo no puede
    // heredar una timeline del revertido, así que al otro lado del umbral hay
    // exactamente una instancia de cada bucle (Req 12.4, 13.3).
    expect(montaje).toContain("montarPiezas({ gsap, root, nodos, plan, modo, bucles: [] })");
    expect([...fuente.matchAll(/bucles: \[\]/g)]).toHaveLength(1);
    expect(veces("bucles.push(")).toBe(4);

    for (const aplazamiento of [
      "setTimeout",
      "setInterval",
      "requestAnimationFrame",
      "delayedCall",
      "gsap.ticker",
    ]) {
      expect(codigo).not.toContain(aplazamiento);
    }
  });

  it("publica el modo compacto como indicador de diagnóstico", () => {
    const etiqueta = cuerpoDe("etiquetaModo");
    expect(etiqueta).toContain('return modo.compacto ? "compacto" : "amplio";');
    expect(montaje).toContain("root.dataset.fondoMotion = etiquetaModo(modo);");
  });

  it("no abre rama de viewport en ninguna pieza: la ausencia de tabla es la rama", () => {
    for (const pieza of [
      "montarFoto",
      "montarOnda",
      "montarEq",
      "montarHalo",
      "montarEcos",
      "montarParallax",
      "montarVisibilidad",
      "fijarEstadoQuieto",
    ]) {
      expect(cuerpoDe(pieza)).not.toContain("modo.compacto");
    }
    // La única lectura del modo compacto en todo el módulo es la etiqueta.
    expect(veces("modo.compacto")).toBe(1);
    expect(codigo).not.toContain("varianteFondo");
    expect(codigo).not.toContain('"compacto"]');
  });

  it("no escribe estilos inline de altura sobre `.home` ni `.home__pin`", () => {
    // Ni el contenedor del pin ni la sección entran en la lista blanca del fondo,
    // así que ninguna pieza puede tomarlos como objetivo (Req 12.5).
    expect(SELECTORES_FONDO).not.toContain(".home");
    expect(SELECTORES_FONDO).not.toContain(".home__pin");
    for (const selector of selectoresLocales()) {
      expect(selector).not.toBe(".home");
      expect(selector).not.toBe(".home__pin");
    }
    expect(codigo).not.toContain(".home__pin");

    // Las propiedades de altura son de la lista negra, disjunta de la blanca.
    for (const prop of ["height", "min-height", "max-height", "minHeight", "maxHeight"]) {
      expect(PROPS_PERMITIDAS as readonly string[]).not.toContain(prop);
    }
    expect(PROPS_LAYOUT).toContain("height");
    for (const prop of PROPS_PERMITIDAS) {
      expect(PROPS_LAYOUT).not.toContain(prop);
    }

    // Y el módulo no las nombra: la única mención de `height` es la **lectura**
    // de la caja del fondo que alimenta el parallax.
    expect(codigo).not.toContain("min-height");
    expect(codigo).not.toContain("max-height");
    expect(codigo).not.toContain("minHeight");
    expect(codigo).not.toContain("maxHeight");
    expect([...codigo.matchAll(/height/gi)]).toHaveLength(1);
    expect(codigo).toContain("alto: rect.height");

    // Los dos únicos accesos a `style` son el `will-change` de la foto y su
    // retirada: ni un `setProperty` ni un `cssText` de altura en todo el módulo.
    expect([...codigo.matchAll(/\.style\b/g)]).toHaveLength(2);
    expect(codigo).toContain("foto.style.willChange = WILL_CHANGE_FOTO;");
    expect(codigo).toContain("foto.style.removeProperty(PROP_WILL_CHANGE);");
    expect(codigo).not.toContain("cssText");
    expect(codigo).not.toContain("setProperty");
    expect(codigo).not.toContain("setAttribute");
  });
});

/* ------------------------------------------------------------------------- *
 * Tarea 12.1 · el ScrollTrigger espejo de `home-orbita`
 *
 * La pieza no tiene aritmética propia: su contrato es **de qué no hace**. El ST
 * de la órbita se lee y no se toca, el espejo copia de él los cinco valores que
 * lo mantienen en el mismo progreso, y las dos ausencias que lo cancelan lo
 * hacen antes de crear una sola cosa. Todo eso es verificable sobre la fuente,
 * que es justo lo que esta suite hace, y el diff nulo de `orbita.ts` lo confirma
 * desde el otro lado (Req 5.1, 5.2, 5.10, 5.11).
 * ------------------------------------------------------------------------- */

/** Las cinco lecturas que el espejo hace del ST de la órbita (Req 5.1). */
const LECTURAS_ORBITA: readonly string[] = [
  "scroller",
  "trigger",
  "vars.start",
  "vars.end",
  "vars.scrub",
];

/** Lo que el fondo no puede invocar ni reasignar sobre el ST ajeno (Req 5.2). */
const PROHIBIDO_EN_LA_ORBITA: readonly string[] = [
  "kill",
  "disable",
  "enable",
  "refresh",
  "update",
  "vars.onRefresh",
  "vars.onUpdate",
  "vars.start =",
  "vars.end =",
  "vars.scrub =",
];

describe("fondo.ts · ScrollTrigger espejo del scrub de la órbita", () => {
  const scrub = cuerpoDe("montarScrub");
  const lectura = cuerpoDe("scrollTriggerDeLaOrbita");
  const codigo = codigoFuente();

  it("cuelga la pieza de la costura `montarPiezas`, después de todas las demás", () => {
    const piezas = cuerpoDe("montarPiezas");
    expect(piezas).toContain("montarScrub(contexto)");
    expect(piezas).toContain("if (scrub !== null) limpiezas.push(scrub);");

    // Va última: crear el ST dispara un refresco que puede llamar a su `onUpdate`
    // en el acto, y esa llamada debe encontrar el colector de bucles completo.
    for (const previa of [
      "fijarEstadoQuieto",
      "montarFoto",
      "montarOnda",
      "montarEq",
      "montarHalo",
      "montarEcos",
      "montarParallax",
      "montarVisibilidad",
    ]) {
      expect(piezas.indexOf("montarScrub(")).toBeGreaterThan(piezas.indexOf(`${previa}(`));
    }
  });

  it("localiza el ST de la órbita por su id, con una única lectura envuelta", () => {
    expect(fuente).toContain('const ID_ORBITA = "home-orbita";');
    expect(veces('"home-orbita"')).toBe(1);
    expect(scrub).toContain("const orbita = scrollTriggerDeLaOrbita();");

    expect(lectura).toContain("return ScrollTrigger.getById(ID_ORBITA);");
    expect(lectura).toContain("} catch {");
    expect(lectura).toContain("return undefined;");
    // Una sola búsqueda por id en todo el módulo: la sonda del registro solo
    // comprueba que el método existe.
    expect([...codigo.matchAll(/ScrollTrigger\.getById\(/g)]).toHaveLength(1);
    // Las otras dos menciones no buscan nada: la sonda del registro comprueba
    // que el método existe y el tipo del resultado se deriva de su firma.
    expect(codigo).toContain('typeof ScrollTrigger.getById === "function"');
    expect(codigo).toContain("type TriggerScroll = ReturnType<typeof ScrollTrigger.getById>;");
    expect([...codigo.matchAll(/ScrollTrigger\.getById\b/g)]).toHaveLength(3);
  });

  it("crea el espejo con su propio id y copia los cinco valores de la órbita", () => {
    expect(fuente).toContain('const ID_ESPEJO = "home-fondo";');
    expect(scrub).toContain("const espejo = ScrollTrigger.create({");
    expect(scrub).toContain("id: ID_ESPEJO,");
    expect(scrub).toContain("scroller: orbita.scroller,");
    expect(scrub).toContain("trigger: orbita.trigger,");
    expect(scrub).toContain("start: orbita.vars.start,");
    expect(scrub).toContain("end: orbita.vars.end,");
    expect(scrub).toContain("scrub: orbita.vars.scrub,");
    expect(scrub).toContain("invalidateOnRefresh: true,");
    // Un solo ST y una sola timeline: el espejo no se multiplica por capa.
    expect([...scrub.matchAll(/ScrollTrigger\.create\(/g)]).toHaveLength(1);
    expect([...scrub.matchAll(/gsap\.timeline\(/g)]).toHaveLength(1);
    expect([...codigo.matchAll(/ScrollTrigger\.create\(/g)]).toHaveLength(1);
  });

  it("declara exactamente las vars del espejo, sin una sola propiedad animada", () => {
    expect(clavesDe(scrub)).toEqual([
      "defaults",
      "ease",
      "id",
      "animation",
      "scroller",
      "trigger",
      "start",
      "end",
      "scrub",
      "invalidateOnRefresh",
      // Lo único que el espejo declara y la órbita no: la pausa por progreso.
      "onUpdate",
    ]);

    // La pieza declara la costura, no la coreografía: los tramos los cuelga
    // `colgarTramos` a partir de la tabla de keyframes.
    for (const clave of clavesDe(scrub)) {
      expect(PROPS_PERMITIDAS as readonly string[]).not.toContain(clave);
      expect(PROPS_LAYOUT).not.toContain(clave);
    }
    for (const creacion of ["gsap.to(", "gsap.fromTo(", ".to(", ".fromTo(", "gsap.set("]) {
      expect(scrub).not.toContain(creacion);
    }
  });

  it("solo lee del ST de la órbita, y solo esas cinco claves", () => {
    const accesos = [...scrub.matchAll(/orbita\.(\w+(?:\.\w+)?)/g)].map((m) => m[1]);
    expect(accesos).toHaveLength(LECTURAS_ORBITA.length);
    expect([...accesos].sort()).toEqual([...LECTURAS_ORBITA].sort());

    // Ni una escritura sobre la instancia ajena ni sobre sus vars.
    expect(scrub).not.toMatch(/orbita\.[\w.]+\s*=[^=]/);
    for (const prohibido of PROHIBIDO_EN_LA_ORBITA) {
      expect(scrub, `el espejo toca la órbita: ${prohibido}`).not.toContain(`orbita.${prohibido}`);
    }
    // Y la órbita no se alcanza por ningún otro camino que su id.
    expect(codigo).not.toContain("montarOrbita");
    expect(codigo).not.toContain("home-burbuja");
  });

  it("no crea scroller ni contenedor de scroll propio: el de la órbita es el suyo", () => {
    expect(scrub).not.toContain("querySelector");
    expect(scrub).not.toContain("closest");
    expect(scrub).not.toContain("document");
    expect(scrub).not.toContain("window");
    expect(scrub).not.toContain("nodos.");
    expect(codigo).not.toContain("scrollerProxy");
    expect(codigo).not.toContain(".escena-capa");
    // La única aparición de `scroller` en el módulo es la copia del de la órbita.
    expect([...codigo.matchAll(/scroller: orbita\.scroller,/g)]).toHaveLength(1);
    expect([...codigo.matchAll(/scroller/g)]).toHaveLength(2);
  });

  it("no refresca, no programa frames y no toca el refresco global", () => {
    expect(codigo).not.toContain("ScrollTrigger.refresh");
    expect(codigo).not.toContain("ScrollTrigger.update");
    expect(codigo).not.toContain("ScrollTrigger.clearMatchMedia");
    expect(codigo).not.toContain("ScrollTrigger.sort");
    for (const aplazamiento of ["setTimeout", "setInterval", "requestAnimationFrame"]) {
      expect(scrub).not.toContain(aplazamiento);
    }
  });

  it("abre la timeline lineal: sin `repeat`, sin `yoyo` y sin `delay`", () => {
    expect(fuente).toContain('const EASE_SCRUB: EaseSuave = "none";');
    expect(scrub).toContain(
      "const scrubFondo = gsap.timeline({ defaults: { ease: EASE_SCRUB } });",
    );
    expect(EASINGS_SUAVES as readonly string[]).toContain("none");
    expect(scrub).toContain("animation: scrubFondo,");

    for (const prohibido of ["repeat:", "yoyo", "delay", "REPETICION_BUCLE", "paused"]) {
      expect(scrub).not.toContain(prohibido);
    }
    // No es un bucle infinito: no entra en el colector de la pausa por visibilidad.
    expect(scrub).not.toContain("bucles");
    expect(veces("bucles.push(")).toBe(4);
  });

  it("sin scrub en el plan y sin ST de la órbita no crea nada", () => {
    const guardas = scrub.slice(0, scrub.indexOf("const scrubFondo"));
    expect(guardas).toContain("if (!plan.scrub) return null;");
    expect(guardas).toContain("if (orbita === undefined) return null;");
    expect(guardas).not.toContain("gsap.timeline(");
    expect(guardas).not.toContain("ScrollTrigger.create(");

    // `plan.scrub` ya es falso en `Modo_Quieto`, así que la misma guarda cubre
    // Req 5.11 sin rama propia de modo, y en compacto el scrub sigue en pie.
    expect(scrub).not.toContain("modo.");
    for (const modo of MODOS_COMPACTOS) {
      expect(planFondo(modo).scrub).toBe(true);
      expect(planFondo({ ...modo, quieto: true }).scrub).toBe(false);
    }
  });

  it("mata en la limpieza solo el ST y la timeline que creó", () => {
    const limpieza = scrub.slice(scrub.indexOf("return () => {"));
    expect(limpieza).toContain("espejo.kill();");
    expect(limpieza).toContain("scrubFondo.kill();");
    expect([...limpieza.matchAll(/\.kill\(/g)]).toHaveLength(2);
    expect(limpieza).not.toContain("orbita");
    expect(limpieza).not.toContain("ScrollTrigger.");
  });

  it("no copia ninguna cifra: el `scrub` y las fronteras vienen de fuera", () => {
    expect(scrub).not.toMatch(/\d/);
    // Las fronteras y el tope tampoco pasan por aquí: la tabla de keyframes la
    // lee `colgarTramos`, que es quien traduce cada tramo a un tween.
    expect(scrub).not.toContain("keyframesFondo");
    expect(scrub).not.toContain("topeOverlay");
  });
});

/* ------------------------------------------------------------------------- *
 * Tarea 12.2 · los nueve tramos de la timeline de scrub
 *
 * La coreografía del scrub no tiene aritmética propia: es `keyframesFondo(tope)`
 * traducida a tweens. Lo que esta suite verifica es esa traducción, en dos
 * planos. Sobre la fuente: un `fromTo` por keyframe, colgado en su `inicio` con
 * la duración de su tramo, sin `ease` propio, sin `overwrite`, sin `repeat`, sin
 * `yoyo` y sin `delay`, con los objetivos reducidos a las cuatro capas del fondo.
 * Y sobre la tabla: que esa regla de colocación —posición `inicio`, duración
 * `largoKeyframe`— reproduce exactamente la curva pura, que el largo total de la
 * timeline queda en 1 y que los tres canales cubren `[0, 1]` sin huecos ni
 * solapes (Req 5.3–5.8).
 * ------------------------------------------------------------------------- */

/** Los tres canales de la timeline: un objetivo y una propiedad cada uno. */
const CANALES: readonly {
  objetivo: Keyframe["objetivo"];
  prop: Keyframe["prop"];
  valor: keyof ValoresFondo;
}[] = [
  { objetivo: "foto", prop: "brightness", valor: "fotoBrillo" },
  { objetivo: "foto", prop: "opacity", valor: "fotoOpacidad" },
  { objetivo: "overlay", prop: "opacity", valor: "overlayOpacidad" },
];

/** Los dos topes de `opacity` de las overlays, uno por soporte de mezcla. */
const TOPES: readonly number[] = [TOPE_OVERLAY_CON_MEZCLA, TOPE_OVERLAY_SIN_MEZCLA];

/** Progresos de muestreo: las cuatro fronteras, los extremos y puntos interiores. */
const PROGRESOS: readonly number[] = [
  0, 0.03, 0.05, ...FRONTERAS_SCRUB, 0.4, 0.5, 0.78, 0.9, 0.97, 1,
];

/** Tramos de un canal, en el orden en que la timeline los recorre. */
function tramosDelCanal(
  keyframes: readonly Keyframe[],
  canal: { objetivo: Keyframe["objetivo"]; prop: Keyframe["prop"] },
): readonly Keyframe[] {
  return keyframes.filter(
    (keyframe) => keyframe.objetivo === canal.objetivo && keyframe.prop === canal.prop,
  );
}

/**
 * Valor que la timeline rinde en el tiempo `t`, reproduciendo lo que GSAP hace
 * con la regla de colocación de `colgarTramos`: cada tramo empieza en su `inicio`,
 * dura `largoKeyframe` y con `ease: "none"` interpola en línea recta; el último
 * tramo alcanzado es el que manda.
 */
function valorEnTimeline(tramos: readonly Keyframe[], t: number): number {
  let valor = tramos[0].desde;

  for (const tramo of tramos) {
    if (tramo.inicio > t) break;

    const largo = largoKeyframe(tramo);
    const avance = largo <= 0 ? 1 : Math.min((t - tramo.inicio) / largo, 1);
    valor = tramo.desde + (tramo.hasta - tramo.desde) * avance;
  }

  return valor;
}

describe("fondo.ts · tramos de la timeline de scrub", () => {
  const scrub = cuerpoDe("montarScrub");
  const tramos = cuerpoDe("colgarTramos");
  const objetivos = cuerpoDe("objetivosDelTramo");
  const canal = cuerpoDe("valorDelTramo");
  const codigo = codigoFuente();

  it("cuelga los tramos de la timeline antes de crear el ScrollTrigger espejo", () => {
    expect(scrub).toContain("colgarTramos(contexto, scrubFondo);");
    expect(scrub.indexOf("colgarTramos(")).toBeGreaterThan(scrub.indexOf("const scrubFondo"));
    expect(scrub.indexOf("colgarTramos(")).toBeLessThan(scrub.indexOf("ScrollTrigger.create("));
    // Una sola llamada, y solo desde la pieza del espejo.
    expect([...codigo.matchAll(/colgarTramos\(contexto, scrubFondo\)/g)]).toHaveLength(1);
  });

  it("toma la tabla completa de `keyframesFondo(plan.topeOverlay)` y nada más", () => {
    expect(tramos).toContain("for (const keyframe of keyframesFondo(plan.topeOverlay))");
    expect([...codigo.matchAll(/keyframesFondo\(/g)]).toHaveLength(1);
    expect(codigo).not.toContain("function keyframesFondo(");

    const fin = fuente.indexOf('} from "./fondo.curvas"');
    const importado = fuente.slice(fuente.lastIndexOf("import {", fin), fin);
    expect(importado).toContain("keyframesFondo");
    expect(importado).toContain("largoKeyframe");
    expect(importado).toContain("cadenaBrillo");

    // Ni las fronteras ni los valores de la curva se importan por separado: la
    // tabla es la única fuente, y el tope llega ya resuelto en el plan.
    for (const ajeno of [
      "FRONTERAS_SCRUB",
      "BRILLO_FOTO_ATENUADO",
      "OPACIDAD_FOTO_FINAL",
      "OVERLAY_EN_MESETA",
      "OVERLAY_FINAL",
      "TOPE_OVERLAY_CON_MEZCLA",
      "TOPE_OVERLAY_SIN_MEZCLA",
      "topeOverlay",
      "valoresFondoEn",
      "interpolarKeyframe",
    ]) {
      expect(importado, `el scrub importa ${ajeno} en vez de leer la tabla`).not.toContain(ajeno);
    }
    expect(tramos).toContain("plan.topeOverlay");
    expect([...codigo.matchAll(/plan\.topeOverlay/g)]).toHaveLength(1);
  });

  it("traduce cada keyframe a un `fromTo` colgado en su `inicio`", () => {
    expect(tramos).toContain("scrubFondo.fromTo(");
    expect([...tramos.matchAll(/\.fromTo\(/g)]).toHaveLength(1);
    expect(tramos).toContain("valorDelTramo(keyframe, keyframe.desde),");
    expect(tramos).toContain("...valorDelTramo(keyframe, keyframe.hasta),");
    expect(tramos).toContain("duration: largoKeyframe(keyframe),");
    // El cuarto argumento de `fromTo` es la posición en la timeline, y es el
    // `inicio` del keyframe: de ahí sale la equivalencia progreso ↔ tiempo.
    expect(tramos).toContain("keyframe.inicio,");
    expect([...tramos.matchAll(/keyframe\.inicio/g)]).toHaveLength(1);
    // Un tramo sin objetivos en el DOM no llega a colgarse (Req 2.11).
    expect(tramos).toContain("if (objetivos.length === 0) continue;");
  });

  it("hereda el ease lineal y no declara `overwrite`, `repeat`, `yoyo` ni `delay`", () => {
    expect(tramos).toContain("immediateRender: false,");
    for (const prohibido of [
      "ease",
      "overwrite",
      "repeat:",
      "yoyo",
      "delay",
      "REPETICION_BUCLE",
      "paused",
      "stagger",
    ]) {
      expect(tramos, `el tramo declara ${prohibido}`).not.toContain(prohibido);
    }
    // El ease viene de los `defaults` de la timeline, y es `none`.
    expect(scrub).toContain("defaults: { ease: EASE_SCRUB }");
  });

  it("apunta solo a las cuatro capas que el fondo posee", () => {
    expect(objetivos).toContain("nodos.foto");
    expect(objetivos).toContain("nodos.onda");
    expect(objetivos).toContain("nodos.eq");
    expect(objetivos).toContain("nodos.halo");
    // Ni los ecos —de `Orbita_Home` en el scroll— ni el contenedor, cuya
    // `opacity` pertenece a la disolución Home → Hook.
    expect(objetivos).not.toContain("nodos.ecos");
    expect(objetivos).not.toContain("nodos.fondo");
    expect(objetivos).not.toContain("nodos.barras");
    // La bolsa llega resuelta: la pieza no busca nodos por su cuenta.
    for (const busqueda of ["querySelector", "closest", "document", "window", "getElementBy"]) {
      expect(objetivos).not.toContain(busqueda);
      expect(tramos).not.toContain(busqueda);
    }
  });

  it("no escribe fuera de sus tweens: sin `set`, sin clases y sin estilos inline", () => {
    for (const cuerpo of [tramos, objetivos, canal]) {
      expect(cuerpo).not.toContain("gsap.set");
      expect(cuerpo).not.toContain("classList");
      expect(cuerpo).not.toContain(".style");
      expect(cuerpo).not.toContain("setProperty");
      expect(cuerpo).not.toContain("setAttribute");
      expect(cuerpo).not.toContain("dataset");
    }
  });

  it("deja fuera de la lista blanca los objetivos de `Orbita_Home`", () => {
    // La omisión de Req 5.7 se sostiene por construcción: los objetivos salen de
    // `resolverNodosFondo`, que solo consulta `SELECTORES_FONDO`.
    for (const ajeno of [
      ".home__cue",
      ".home__copy",
      ".home__fragmentos",
      ".collage article",
      ".home__orbita",
      ".home__play",
      ".home__play-ring",
      ".home__play-core",
    ]) {
      expect(SELECTORES_FONDO, `la lista blanca incluye ${ajeno}`).not.toContain(ajeno);
      expect(codigo, `el módulo menciona ${ajeno}`).not.toContain(ajeno);
    }
  });

  it("reparte los tres canales sin cifras ni easings en el módulo del DOM", () => {
    expect(canal).toContain('if (keyframe.prop === "opacity") return { opacity: valor };');
    expect(canal).toContain("return { filter: cadenaBrillo(valor) };");
    // La función CSS y su unidad viven en el módulo puro (Req 12.7).
    expect(codigo).not.toContain("brightness(");
    for (const cuerpo of [tramos, objetivos, canal]) {
      // Ni un valor de la curva ni una unidad: todo llega del keyframe.
      expect(cuerpo).not.toMatch(/\d+\.\d+/);
      expect(cuerpo).not.toContain('"%"');
      for (const easing of EASINGS_SUAVES) expect(cuerpo).not.toContain(`"${easing}"`);
    }
  });

  it("anima solo propiedades de la lista blanca, ninguna de layout", () => {
    // Desde el `fromTo` y desde el reparto de canales: las firmas quedan fuera.
    const claves = [
      ...clavesDe(tramos.slice(tramos.indexOf("scrubFondo.fromTo("))),
      ...clavesDe(canal.slice(canal.indexOf("if (keyframe.prop"))),
    ];
    expect(claves.length).toBeGreaterThanOrEqual(4);

    for (const clave of claves) {
      const permitida =
        (PROPS_PERMITIDAS as readonly string[]).includes(clave) || CONFIG_GSAP.includes(clave);
      expect(permitida, `clave inesperada en el scrub: ${clave}`).toBe(true);
      expect(PROPS_LAYOUT).not.toContain(clave);
    }
    // Los dos canales CSS de la tabla, ya traducidos: `opacity` y `filter`.
    expect(claves).toContain("opacity");
    expect(claves).toContain("filter");
  });
});

describe("keyframesFondo · la colocación de los tramos es el progreso", () => {
  it("cada tramo cabe entre su `inicio` y su `fin`, y el largo total queda en 1", () => {
    for (const tope of TOPES) {
      const keyframes = keyframesFondo(tope);

      for (const keyframe of keyframes) {
        const largo = largoKeyframe(keyframe);
        expect(largo).toBeGreaterThan(0);
        expect(keyframe.inicio + largo).toBeCloseTo(keyframe.fin, 10);
      }

      // El tramo que llega más lejos fija el largo de la timeline: 1 unidad de
      // tiempo por 1 unidad de progreso, sin factor de escala.
      expect(Math.max(...keyframes.map((keyframe) => keyframe.fin))).toBe(1);
      expect(Math.min(...keyframes.map((keyframe) => keyframe.inicio))).toBe(0);
    }
  });

  it("los tres canales cubren `[0, 1]` sin huecos ni solapes", () => {
    for (const tope of TOPES) {
      const keyframes = keyframesFondo(tope);

      for (const canal of CANALES) {
        const tramos = tramosDelCanal(keyframes, canal);
        expect(tramos.length).toBeGreaterThan(0);
        expect(tramos[0].inicio).toBe(0);
        expect(tramos[tramos.length - 1].fin).toBe(1);

        for (let i = 1; i < tramos.length; i += 1) {
          // El siguiente tramo arranca donde acaba el anterior y con su mismo
          // valor: la curva es continua en las cuatro fronteras (Req 5.6).
          expect(tramos[i].inicio).toBe(tramos[i - 1].fin);
          expect(tramos[i].desde).toBeCloseTo(tramos[i - 1].hasta, 10);
        }
      }
    }
  });

  it("rinde en cada progreso el mismo valor que la curva pura", () => {
    for (const tope of TOPES) {
      const keyframes = keyframesFondo(tope);

      for (const p of PROGRESOS) {
        const esperado = valoresFondoEn(p, tope);

        for (const canal of CANALES) {
          const valor = valorEnTimeline(tramosDelCanal(keyframes, canal), p);
          expect(valor, `${canal.objetivo}.${canal.prop} en p = ${p}`).toBeCloseTo(
            esperado[canal.valor],
            10,
          );
        }
      }
    }
  });

  it("la foto atenúa con una sola propiedad en cada instante", () => {
    for (const tope of TOPES) {
      const keyframes = keyframesFondo(tope).filter((keyframe) => keyframe.objetivo === "foto");

      for (const uno of keyframes) {
        for (const otro of keyframes) {
          if (uno === otro || uno.prop === otro.prop) continue;
          const solapan = uno.inicio < otro.fin && otro.inicio < uno.fin;
          if (!solapan) continue;

          // Req 5.3: `opacity` o `filter: brightness`, nunca las dos a la vez.
          const enMovimiento = [uno, otro].filter((k) => k.desde !== k.hasta);
          expect(enMovimiento.length).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

/* ------------------------------------------------------------------------- *
 * Tarea 12.3 · la pausa de los bucles por progreso
 *
 * La frontera es `debenPausarBucles(p)` y ya la verifica la Propiedad 9, así que
 * aquí no se vuelve a comprobar dónde está: lo que se comprueba es la costura.
 * Que el disparador es el `onUpdate` del ST **espejo** y no el de la órbita, que
 * la pausa conserva el `progress()` sin `set` de la propiedad, que el
 * `will-change` desaparece mientras nada se mueve, que el alcance es el colector
 * compartido y nada más y —lo que no se sostiene por construcción— que las dos
 * mecánicas que pausan ese colector no se pisan: la de visibilidad (7.9) y esta
 * solo reanudan lo que ellas mismas pausaron (Req 5.9, 13.5, 13.9, 13.10).
 * ------------------------------------------------------------------------- */

describe("fondo.ts · pausa de los bucles por progreso", () => {
  const pausa = cuerpoDe("pausaPorProgreso");
  const scrub = cuerpoDe("montarScrub");
  const visibilidad = cuerpoDe("montarVisibilidad");
  const codigo = codigoFuente();

  it("cuelga el manejador del `onUpdate` del ST espejo, y de ningún otro sitio", () => {
    expect(scrub).toContain("const pausarPorProgreso = pausaPorProgreso(contexto);");
    expect(scrub).toContain("onUpdate: (self) => pausarPorProgreso(self.progress),");
    // El progreso llega del espejo. La órbita sigue con sus cinco lecturas y su
    // `onUpdate` intacto: ni se lee ni se reasigna (Req 5.2).
    expect(scrub).not.toContain("orbita.vars.onUpdate");
    expect(scrub).not.toMatch(/orbita\.[\w.]+\s*=[^=]/);
    expect([...codigo.matchAll(/pausaPorProgreso\(/g)]).toHaveLength(2);
    expect([...codigo.matchAll(/onUpdate/g)]).toHaveLength(1);

    // Se construye antes de crear el ST, porque crearlo dispara un refresco que
    // puede llamar al callback en el acto.
    expect(scrub.indexOf("pausaPorProgreso(contexto)")).toBeLessThan(
      scrub.indexOf("ScrollTrigger.create("),
    );
  });

  it("decide la frontera con `debenPausarBucles` en vez de escribirla", () => {
    const fin = fuente.indexOf('} from "./fondo.curvas"');
    const importado = fuente.slice(fuente.lastIndexOf("import {", fin), fin);
    expect(importado).toContain("debenPausarBucles");
    expect(importado).not.toContain("P_PAUSA");

    expect(pausa).toContain("if (debenPausarBucles(progreso)) {");
    expect([...codigo.matchAll(/debenPausarBucles\(/g)]).toHaveLength(1);
    expect(codigo).not.toContain("function debenPausarBucles(");
    // Ni la frontera ni ninguna otra cifra: el módulo del DOM no la conoce.
    expect(pausa).not.toMatch(/\d/);
    expect(debenPausarBucles(P_PAUSA)).toBe(true);
  });

  it("pausa y reanuda las mismas timelines, sin `set` y sin instancias nuevas", () => {
    expect(pausa).toContain("bucle.pause();");
    expect(pausa).toContain("for (const bucle of pausados) bucle.resume();");
    // `pause()`/`resume()` conservan el `progress()`: ni se recoloca el tiempo ni
    // se escribe la propiedad animada, así que no hay salto al cruzar la frontera.
    for (const prohibido of [
      "gsap.set(",
      "gsap.to(",
      "gsap.timeline(",
      "gsap.quickTo(",
      ".progress(",
      ".seek(",
      ".restart(",
      ".play(",
      ".kill(",
      ".invalidate(",
      "clearProps",
    ]) {
      expect(pausa, `la pausa por progreso hace ${prohibido}`).not.toContain(prohibido);
    }
    // La pieza no anima nada: no declara una sola propiedad ni un solo knob.
    expect(clavesDe(pausa)).toEqual([]);
  });

  it("retira el `will-change` mientras están pausados y lo restaura al reanudar", () => {
    expect(pausa).toContain("if (foto !== null) retirarWillChange(foto);");
    expect(pausa).toContain("if (foto !== null && plan.willChange) aplicarWillChange(foto);");
    // Una escritura por cruce, no una por fotograma del scrub: la fase la guarda
    // `enPausa`, y las dos ramas salen antes si no hay cruce.
    expect(pausa).toContain("let enPausa = false;");
    expect(pausa).toContain("if (enPausa) return;");
    expect(pausa).toContain("if (!enPausa) return;");
    expect([...pausa.matchAll(/retirarWillChange\(/g)]).toHaveLength(1);
    expect([...pausa.matchAll(/aplicarWillChange\(/g)]).toHaveLength(1);
    // Reutiliza las funciones de la pieza de la foto: ni un acceso propio a
    // `style` ni un valor de `will-change` copiado (Req 13.5).
    expect(pausa).not.toContain("style");
    expect(pausa).not.toContain("WILL_CHANGE_FOTO");
    expect(pausa).not.toContain("PROP_WILL_CHANGE");
    // Y solo lo restaura si el plan lo contempla, como hace la entrada.
    expect(cuerpoDe("montarFoto")).toContain("if (plan.willChange) aplicarWillChange(foto);");
    for (const modo of MODOS_COMPACTOS) {
      expect(planFondo(modo).willChange).toBe(true);
      expect(planFondo({ ...modo, quieto: true }).willChange).toBe(false);
    }
  });

  it("actúa sobre el colector compartido y sobre nada más", () => {
    expect(pausa).toContain("const { nodos, plan, bucles } = contexto;");
    expect(pausa).toContain("for (const bucle of bucles) {");
    // El colector son los cuatro bucles infinitos del fondo: el idle de la foto y
    // los tres de las overlays. Nadie más se registra en él (Req 5.9).
    expect(veces("bucles.push(")).toBe(4);
    // Ni los ecos, ni el parallax, ni un solo objeto de `Orbita_Home`.
    for (const ajeno of [
      "entradaFoto",
      "entradaEcos",
      "cierreEcos",
      "parallax",
      "scrubFondo",
      "espejo",
      "orbita",
      "ScrollTrigger",
      "montarOrbita",
    ]) {
      expect(pausa, `la pausa por progreso alcanza ${ajeno}`).not.toContain(ajeno);
    }
    // Su único acceso al DOM es la foto que ya resolvió el módulo.
    expect(pausa).toContain("const foto = nodos.foto;");
    for (const busqueda of ["querySelector", "document", "window", "getElementBy"]) {
      expect(pausa).not.toContain(busqueda);
    }
  });

  it("compone con la pausa por visibilidad: cada una reanuda solo lo que pausó", () => {
    // Las dos filtran por lo que está corriendo, así que ninguna se apropia de un
    // bucle que la otra dejó pausado…
    expect(pausa).toContain("if (bucle.paused()) continue;");
    expect(visibilidad).toContain("pausados = bucles.filter((bucle) => !bucle.paused());");
    // …y las dos recuerdan su propia colección para reanudar.
    expect(pausa).toContain("const pausados = new Set<BucleInfinito>();");
    expect(pausa).toContain("pausados.add(bucle);");
    expect(pausa).toContain("pausados.clear();");
    expect(visibilidad).toContain("let pausados: readonly BucleInfinito[] = [];");
    expect(visibilidad).toContain("for (const bucle of pausados) bucle.resume();");
    // Dos colecciones independientes, una por mecánica, y ninguna compartida en
    // el contexto: `contexto.bucles` es lo único común.
    expect(fuente).toContain("bucles: BucleInfinito[];");
    expect([...codigo.matchAll(/pausados/g)].length).toBeGreaterThan(0);
    expect(codigo).not.toContain("contexto.pausados");

    // Un `onUpdate` por debajo de la frontera con la pestaña oculta no reanuda
    // nada, porque esta mecánica no había cruzado: la guarda de fase es la que lo
    // impide (Req 13.9, 13.10).
    const reanudacion = pausa.slice(pausa.indexOf("if (!enPausa) return;"));
    expect(reanudacion.indexOf("if (!enPausa) return;")).toBeLessThan(
      reanudacion.indexOf("bucle.resume()"),
    );
    // Y a la inversa: esta pausa no consulta la visibilidad ni la reimplementa.
    expect(pausa).not.toContain("document.hidden");
    expect(pausa).not.toContain("EVENTO_VISIBILIDAD");
    expect(veces("EVENTO_VISIBILIDAD")).toBe(3);
  });

  it("no registra escuchas, no programa frames y no necesita limpieza propia", () => {
    for (const prohibido of [
      "addEventListener",
      "removeEventListener",
      "setTimeout",
      "setInterval",
      "requestAnimationFrame",
      "delayedCall",
      "gsap.ticker",
    ]) {
      expect(pausa).not.toContain(prohibido);
    }
    // Devuelve el manejador y nada más: su estado muere con el ST que lo invoca,
    // que la limpieza del espejo ya mata.
    expect(fuente).toContain(
      "function pausaPorProgreso(contexto: ContextoFondo): (progreso: number) => void {",
    );
    expect(pausa).toContain("return (progreso: number): void => {");
    expect(pausa).not.toContain("LimpiezaFondo");
    expect(cuerpoDe("montarPiezas")).not.toContain("pausaPorProgreso");

    const limpieza = scrub.slice(scrub.indexOf("return () => {"));
    expect(limpieza).toContain("espejo.kill();");
    expect(limpieza).toContain("scrubFondo.kill();");
    expect([...limpieza.matchAll(/\.kill\(/g)]).toHaveLength(2);
  });
});
