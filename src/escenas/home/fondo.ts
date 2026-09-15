/**
 * Contexto GSAP del `Fondo_Home`.
 *
 * Este módulo es la **única** parte del fondo que toca el DOM: resuelve los
 * nodos de las cuatro capas, decide el modo de movimiento y abre un contexto
 * `gsap.matchMedia()` acotado a la raíz del home, hermano e independiente del de
 * `montarOrbita` (diseño D1, Req 13.1, 14.5). Todo lo calculable vive en
 * `./fondo.curvas`: aquí no se duplica ni una tabla ni una fórmula.
 *
 * GSAP se obtiene exclusivamente por `ensureGsap()`, sin registro propio de
 * plugins ni importaciones directas de sus módulos (Req 1.7, 14.1, 14.3).
 *
 * Sobre la base cuelga `montarPiezas`, la costura de las timelines. De momento
 * viven ahí la pareja de `Capa_Foto` —entrada de una pasada y respiración idle—,
 * los tres bucles desfasados de las overlays (onda, barras EQ y halo), la
 * cascada de entrada de `Ecos_Esquina`, el parallax de puntero sobre
 * `.home__fondo`, la pausa por visibilidad de la pestaña, el reposo de la rama
 * quieta y el ScrollTrigger espejo de `home-orbita` con la timeline de scrub que
 * cuelga de él y la pausa de los bucles por progreso que decide su `onUpdate`.
 */

import { get } from "svelte/store";

import { Flip, ScrollTrigger, ensureGsap } from "../../motion/gsap";
import { reduce } from "../../motion/reducedMotion";
import {
  CONDICIONES_MM,
  PARALLAX,
  PASO_EQ,
  PROPS_PERMITIDAS,
  REPETICION_BUCLE,
  SELECTOR_ECO,
  SELECTOR_KICKER,
  bucleDe,
  cadenaBrillo,
  cadenaFiltro,
  calendarioEcos,
  capacidadesSuficientes,
  debenPausarBucles,
  desplazamientoParallax,
  enPorcentaje,
  esQuieto,
  esQuietoPorDefecto,
  keyframesFondo,
  largoKeyframe,
  planFondo,
  salidaParallax,
} from "./fondo.curvas";
import type {
  BucleFondo,
  Caja,
  Desplazamiento,
  EaseSuave,
  FiltroBucle,
  Keyframe,
  ModoFondo,
  NodosFondo,
  PlanFondo,
} from "./fondo.curvas";

/** Limpieza del `Contexto_GSAP` del fondo, devuelta por el attach (Req 14.5). */
export type LimpiezaFondo = () => void;

/** Instancia que entrega `Registro_GSAP`. */
type InstanciaGsap = ReturnType<typeof ensureGsap>;

/** Prefijo de los avisos de diagnóstico del fondo. */
const AVISO = "[fondo-home]";

/** Limpieza sin efecto: la devuelven las guardas que no montan nada. */
const LIMPIEZA_VACIA: LimpiezaFondo = () => undefined;

/*
 * Selectores de los nodos que el fondo posee. Todos pertenecen a
 * `SELECTORES_FONDO` (la lista blanca de `fondo.curvas.ts`), de modo que ningún
 * objetivo de `Orbita_Home` ni el grano p5 pueden entrar por aquí (Req 5.7, 6.8).
 */
const SELECTOR_FONDO = ".home__fondo";
const SELECTOR_FOTO = ".home__fondo-foto";
const SELECTOR_ONDA = '[data-fondo-capa="onda"]';
const SELECTOR_EQ = '[data-fondo-capa="eq"]';
const SELECTOR_HALO = '[data-fondo-capa="halo"]';
const SELECTOR_BARRA = ".home__fondo-barra";

/** Ausencia total de capas: lo devuelve la resolución cuando no hay fondo. */
const NODOS_VACIOS: NodosFondo = {
  fondo: null,
  foto: null,
  onda: null,
  eq: null,
  halo: null,
  barras: [],
  ecos: [],
};

/**
 * Resolución tolerante de los nodos del fondo: lo que falte queda en `null` o
 * en `[]` y la función **nunca lanza**, así que la degradación es composicional
 * (falta un nodo ⇒ desaparece su animación, el resto sigue en pie).
 *
 * Sin `.home__fondo` no hay nada que resolver (Req 2.11). La ausencia de la
 * capa fotográfica se registra con un aviso en consola para diagnóstico, sin
 * propagar excepción (Req 1.10); la ausencia de los ecos es silenciosa, porque
 * el visitante no debe ver un error por un texto de atmósfera (Req 3.8).
 */
export function resolverNodosFondo(root: HTMLElement): NodosFondo {
  try {
    const fondo = root.querySelector<HTMLElement>(SELECTOR_FONDO);
    if (fondo === null) return NODOS_VACIOS;

    const foto = fondo.querySelector<HTMLImageElement>(SELECTOR_FOTO);
    if (foto === null) {
      console.warn(
        `${AVISO} no se encontró la capa fotográfica (${SELECTOR_FOTO}): se omiten su entrada y su bucle idle.`,
      );
    }

    return {
      fondo,
      foto,
      onda: fondo.querySelector<SVGElement>(SELECTOR_ONDA),
      eq: fondo.querySelector<HTMLElement>(SELECTOR_EQ),
      halo: fondo.querySelector<HTMLElement>(SELECTOR_HALO),
      barras: Array.from(fondo.querySelectorAll<HTMLElement>(SELECTOR_BARRA)),
      // Orden de documento: `querySelectorAll` lo garantiza, así que el kicker
      // encabeza la lista y los ecos la siguen (Req 3.2).
      ecos: Array.from(root.querySelectorAll<HTMLElement>(`${SELECTOR_KICKER}, ${SELECTOR_ECO}`)),
    };
  } catch {
    return NODOS_VACIOS;
  }
}

/** Evalúa una media query sin lanzar: un entorno sin `matchMedia` da `false`. */
function coincide(consulta: string): boolean {
  try {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(consulta).matches;
  } catch {
    return false;
  }
}

/**
 * `Puntero_Fino`: `(hover: hover) and (pointer: fine)`. Se consulta fuera de
 * `gsap.matchMedia()` a propósito, porque el contexto del fondo solo puede
 * declarar las tres claves de `CONDICIONES_MM` (Req 11.6).
 */
function punteroFino(): boolean {
  return coincide("(hover: hover) and (pointer: fine)");
}

/** Soporte real de mezcla: decide el tope de `opacity` de las overlays (Req 2.12). */
function soporteMezcla(): boolean {
  try {
    if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return false;
    return CSS.supports("mix-blend-mode", "plus-lighter");
  } catch {
    return false;
  }
}

/** Segunda fuente de `Modo_Quieto`: la clase `html.reduce` (Req 11.9). */
function claseQuieto(): boolean {
  try {
    return document.documentElement.classList.contains("reduce");
  } catch {
    return false;
  }
}

/** Tercera fuente de `Modo_Quieto`: el store `reduce` (Req 11.9). */
function storeQuieto(): boolean {
  try {
    return get(reduce);
  } catch {
    return false;
  }
}

/**
 * Sonda de `Registro_GSAP`: la instancia debe venir usable y con ScrollTrigger
 * y Flip disponibles. Si el registro falló, acceder a los plugins lanza y la
 * sonda devuelve ambas capacidades en falso (Req 14.10).
 */
function capacidadesDelRegistro(gsap: InstanciaGsap): { scrollTrigger: boolean; flip: boolean } {
  try {
    return {
      scrollTrigger: typeof gsap.to === "function" && typeof ScrollTrigger.getById === "function",
      flip: typeof Flip.getState === "function",
    };
  } catch {
    return { scrollTrigger: false, flip: false };
  }
}

/** `gsap.matchMedia()` y la propia API de media queries, disponibles (Req 11.11). */
function hayMatchMedia(gsap: InstanciaGsap): boolean {
  try {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return typeof gsap.matchMedia === "function";
  } catch {
    return false;
  }
}

/** Etiqueta de diagnóstico del modo montado, publicada en `dataset.fondoMotion`. */
function etiquetaModo(modo: ModoFondo): string {
  if (modo.quieto) return "quieto";
  return modo.compacto ? "compacto" : "amplio";
}

/** Timeline de GSAP, tipada desde la propia instancia para no importar sus módulos. */
type BucleInfinito = ReturnType<InstanciaGsap["timeline"]>;

/**
 * Todo lo que una pieza del fondo necesita: instancia, nodos, plan, modo y el
 * colector de bucles infinitos.
 *
 * `bucles` es la lista compartida de las timelines con `repeat: -1` que el fondo
 * posee: cada pieza que crea una la registra ahí al montarla, y quien necesita
 * actuar sobre todas ellas a la vez —la pausa por visibilidad de esta tarea, la
 * pausa por progreso de la 12.3— lee esa lista en vez de recibir referencias
 * cruzadas entre piezas. El colector nace vacío en cada invocación del callback
 * de `matchMedia`, así que no puede arrastrar timelines de un contexto revertido,
 * y solo contiene bucles del fondo: los de `Orbita_Home` no pasan por aquí
 * (Req 13.9, 13.10, 14.5).
 *
 * Lo que **no** entra: la entrada de la foto y la cascada de `Ecos_Esquina` son
 * de una sola pasada, y el parallax son dos `quickTo` sin timeline.
 */
type ContextoFondo = {
  gsap: InstanciaGsap;
  root: HTMLElement;
  nodos: NodosFondo;
  plan: PlanFondo;
  modo: ModoFondo;
  bucles: BucleInfinito[];
};

/* ------------------------------------------------------------------------- *
 * Timelines #1 y #2 · `Capa_Foto` se asienta y respira
 *
 * Dos timelines encadenadas sobre el mismo nodo: la entrada de una pasada
 * (`scale`/`opacity` hasta 1/1, Req 1.1) y la respiración idle infinita
 * (`scale` con `yoyo`, Req 1.2). Ambas se crean dentro del callback de
 * `matchMedia`, así que quedan registradas en el `Contexto_GSAP` y `mm.revert()`
 * las mata borrando sus estilos inline (Req 13.1, 1.6).
 *
 * Ni un número de la coreografía vive aquí: `plan.entrada` es `ENTRADA_FOTO` y
 * `plan.bucleFoto` es `IDLE_FOTO`, ya resueltas para la variante del viewport
 * por `planFondo` (Req 12.1, 12.7). Este módulo solo las traduce a GSAP.
 * ------------------------------------------------------------------------- */

/** Valor de `will-change` que sostiene la respiración idle (Req 1.5). */
const WILL_CHANGE_FOTO = "transform";

/** Propiedad CSS que la limpieza retira del nodo de la foto (Req 1.6). */
const PROP_WILL_CHANGE = "will-change";

/**
 * `will-change: transform` sobre `Capa_Foto`. Se escribe directamente en el
 * estilo inline y no con `gsap.set`, porque se aplica desde el `onStart` de la
 * entrada —ya fuera del callback de `matchMedia`— y un `set` creado ahí no
 * quedaría registrado en el contexto: la retirada tiene que ser explícita.
 */
function aplicarWillChange(foto: HTMLImageElement): void {
  foto.style.willChange = WILL_CHANGE_FOTO;
}

/** Retira el `will-change` de la foto: revert, quieto y foto ausente (Req 1.6, 1.8). */
function retirarWillChange(foto: HTMLImageElement): void {
  foto.style.removeProperty(PROP_WILL_CHANGE);
}

/**
 * Entrada y respiración idle de `Capa_Foto`. Devuelve `null` cuando no hay nada
 * que montar, y en ese caso **ninguna** de las dos timelines llega a existir:
 *
 * - sin `Capa_Foto`, se omiten las dos y el aviso ya lo emitió
 *   `resolverNodosFondo` al no encontrar el nodo (Req 1.10);
 * - en `Modo_Quieto`, `plan.entrada` y `plan.bucleFoto` vienen a `null`, así que
 *   la foto se queda en `scale` 1 y `opacity` 1 por CSS, con cero tweens y sin
 *   `will-change` (Req 1.8, 11.1).
 *
 * El encadenado es directo: la entrada arranca sola y su `onComplete` pone en
 * marcha el bucle en el mismo tick, muy por debajo del plazo de 0.1 s que pide
 * Req 1.2. El bucle nace `paused` y con `immediateRender: false` para que su
 * `fromTo` no pinte su valor de partida al crearse y no le robe a la entrada su
 * `scale` inicial; `overwrite: "auto"` en los dos tweens garantiza que, cuando
 * el bucle toma el relevo, cualquier resto de la entrada se cancele y el valor
 * actual sea el punto de partida (Req 2.8, 13.5).
 *
 * Solo se animan `scale` y `opacity`, ambas en `PROPS_PERMITIDAS`: ninguna
 * propiedad de layout entra, de modo que `width`, `height`, `top`, `left`,
 * `right`, `bottom` y `margin` conservan sus valores computados (Req 1.3, 1.4).
 */
function montarFoto(contexto: ContextoFondo): LimpiezaFondo | null {
  const { gsap, nodos, plan, bucles } = contexto;
  const foto = nodos.foto;
  if (foto === null) return null;

  const { entrada, bucleFoto } = plan;
  if (entrada === null || bucleFoto === null) return null;

  // Timeline #1: una pasada de `scale`/`opacity` hasta el estado de reposo.
  const entradaFoto = gsap.timeline({
    onStart: () => {
      if (plan.willChange) aplicarWillChange(foto);
    },
  });

  entradaFoto.fromTo(
    foto,
    { scale: entrada.escala, opacity: entrada.opacidad },
    {
      scale: 1,
      opacity: 1,
      duration: entrada.duracion,
      ease: entrada.ease,
      overwrite: "auto",
    },
  );

  // Timeline #2: la respiración infinita, en espera hasta que la entrada acaba.
  const idleFoto = gsap.timeline({ paused: true });

  idleFoto.fromTo(
    foto,
    { scale: bucleFoto.desde },
    {
      scale: bucleFoto.hasta,
      duration: bucleFoto.tramo,
      ease: bucleFoto.ease,
      repeat: REPETICION_BUCLE,
      yoyo: bucleFoto.yoyo,
      overwrite: "auto",
      immediateRender: false,
    },
  );

  entradaFoto.eventCallback("onComplete", () => {
    idleFoto.play(0);
  });

  // El bucle infinito de la foto entra en el colector; la entrada, no.
  bucles.push(idleFoto);

  return () => {
    idleFoto.kill();
    entradaFoto.kill();
    retirarWillChange(foto);
  };
}

/* ------------------------------------------------------------------------- *
 * Timelines #3, #4 y #5 · las overlays respiran desfasadas
 *
 * Un bucle infinito por capa (Req 13.5), cada uno con el retardo de arranque que
 * trae su tabla, de modo que onda, barras y halo nunca latan al unísono
 * (Req 2.6). Las tres timelines animan **solo** `transform` y `filter`: la
 * `opacity` de las overlays es propiedad exclusiva de la timeline de scrub,
 * porque si un bucle la tocase, al pausarlo en `Progreso_Orbita ≥ 0.10` el scrub
 * tomaría el relevo desde un valor arbitrario (diseño D4, Req 2.8, 5.9).
 *
 * Ni una cifra vive aquí: `plan.buclesOverlay` ya trae `BUCLE_ONDA`, `BUCLE_EQ` y
 * `BUCLE_HALO` resueltos para la variante del viewport, con su tramo, su ease,
 * su desfase y el tramo de `filter` que acompaña al `transform` (Req 12.2, 12.7).
 * En compacto la EQ no está en esa lista y en `Modo_Quieto` la lista viene vacía,
 * así que la ausencia del bucle es lo que impide que la timeline exista.
 * ------------------------------------------------------------------------- */

/**
 * Bucle overlay del plan para un objetivo, ya con la garantía de que trae su
 * tramo de `filter`. Devuelve `null` cuando el modo no monta ese bucle, y en ese
 * caso quien llama no crea timeline alguna (Req 2.11, 11.2, 12.2).
 */
function bucleConFiltro(
  plan: PlanFondo,
  objetivo: BucleFondo["objetivo"],
): (BucleFondo & { filtro: FiltroBucle }) | null {
  const bucle = bucleDe(plan.buclesOverlay, objetivo);
  if (bucle === null || bucle.filtro === undefined) return null;

  return { ...bucle, filtro: bucle.filtro };
}

/**
 * Timeline #3: la onda se desplaza en horizontal y se desenfoca al pasar.
 *
 * `x` va en porcentaje de la caja del propio SVG, así que el vaivén es
 * independiente del ancho del viewport, y el `filter: blur()` acompaña al
 * desplazamiento. Sin `yoyo`: el trayecto ya recorre el vaivén completo de un
 * extremo al otro, y `repeat: -1` lo repite indefinidamente (Req 2.5).
 *
 * El `fromTo` sí renderiza su valor de partida al crearse —no lleva
 * `immediateRender: false`— porque nadie más escribe `x` ni `filter` de la onda:
 * el estado inicial declarado es el que debe verse antes de que el bucle corra.
 */
function montarOnda(contexto: ContextoFondo): LimpiezaFondo | null {
  const { gsap, nodos, plan, bucles } = contexto;
  const onda = nodos.onda;
  if (onda === null) return null;

  const bucle = bucleConFiltro(plan, "onda");
  if (bucle === null) return null;

  const bucleOnda = gsap.timeline({ delay: bucle.desfase });

  bucleOnda.fromTo(
    onda,
    {
      x: enPorcentaje(bucle.desde),
      filter: cadenaFiltro(bucle.filtro, bucle.filtro.desde),
    },
    {
      x: enPorcentaje(bucle.hasta),
      filter: cadenaFiltro(bucle.filtro, bucle.filtro.hasta),
      duration: bucle.tramo,
      ease: bucle.ease,
      repeat: REPETICION_BUCLE,
      yoyo: bucle.yoyo,
      overwrite: "auto",
    },
  );

  bucles.push(bucleOnda);

  return () => {
    bucleOnda.kill();
  };
}

/**
 * Timeline #4: las barras del ecualizador suben y bajan en cascada.
 *
 * Un único `fromTo` sobre la lista completa de barras con `stagger: PASO_EQ`:
 * GSAP reparte el retardo entre los siete nodos, así que la cascada es una sola
 * timeline infinita y no siete (Req 2.4, 13.5). El `yoyo` de la tabla convierte
 * el tramo en ida y vuelta, y `delay: bucle.desfase` sitúa su pulso entre el de
 * la onda y el del halo (Req 2.5, 2.6).
 *
 * `transform-origin: 50% 100%` ya lo declara el CSS de `.home__fondo-barra`, así
 * que aquí no se escribe: el módulo del DOM no duplica lo que la hoja de estilos
 * ya garantiza. Este bucle es el único de la terna sin tramo de `filter`, de modo
 * que su tabla llega por `bucleDe` sin pasar por `bucleConFiltro`.
 *
 * Dos ausencias lo cancelan sin rama extra: si el markup no trae barras la lista
 * viene vacía (Req 2.11) y si el modo es compacto o quieto `plan.buclesOverlay`
 * no incluye la entrada `eq`, así que las barras se quedan en el estado final que
 * les da el CSS (Req 12.2).
 */
function montarEq(contexto: ContextoFondo): LimpiezaFondo | null {
  const { gsap, nodos, plan, bucles } = contexto;
  const barras = nodos.barras;
  if (barras.length === 0) return null;

  const bucle = bucleDe(plan.buclesOverlay, "eq");
  if (bucle === null) return null;

  const bucleEq = gsap.timeline({ delay: bucle.desfase });

  bucleEq.fromTo(
    barras,
    { scaleY: bucle.desde },
    {
      scaleY: bucle.hasta,
      duration: bucle.tramo,
      ease: bucle.ease,
      repeat: REPETICION_BUCLE,
      yoyo: bucle.yoyo,
      stagger: PASO_EQ,
      overwrite: "auto",
    },
  );

  bucles.push(bucleEq);

  return () => {
    bucleEq.kill();
  };
}

/**
 * Timeline #5: el halo late en `scale` y en brillo, con el desfase más largo de
 * la terna (1.40 s) para que su pulso entre después de los otros dos (Req 2.6).
 *
 * `yoyo: true`, así que el ciclo completo es ida más vuelta y el valor de partida
 * coincide con el de llegada de cada repetición: no hay salto al reiniciar.
 */
function montarHalo(contexto: ContextoFondo): LimpiezaFondo | null {
  const { gsap, nodos, plan, bucles } = contexto;
  const halo = nodos.halo;
  if (halo === null) return null;

  const bucle = bucleConFiltro(plan, "halo");
  if (bucle === null) return null;

  const bucleHalo = gsap.timeline({ delay: bucle.desfase });

  bucleHalo.fromTo(
    halo,
    {
      scale: bucle.desde,
      filter: cadenaFiltro(bucle.filtro, bucle.filtro.desde),
    },
    {
      scale: bucle.hasta,
      filter: cadenaFiltro(bucle.filtro, bucle.filtro.hasta),
      duration: bucle.tramo,
      ease: bucle.ease,
      repeat: REPETICION_BUCLE,
      yoyo: bucle.yoyo,
      overwrite: "auto",
    },
  );

  bucles.push(bucleHalo);

  return () => {
    bucleHalo.kill();
  };
}

/* ------------------------------------------------------------------------- *
 * Timeline #6 · los ecos entran en cascada
 *
 * `Ecos_Esquina` aparece en orden de documento —el kicker primero, los
 * `.home__eco` detrás— con `opacity 0 → 1` y `y 12 → 0` (Req 3.1, 3.2). El
 * calendario lo calcula `calendarioEcos(n, modo)` sobre el recuento real de
 * nodos: de él salen el paso del `stagger`, la duración por elemento, el ease, el
 * `y` de partida y el plazo del corte, así que aquí no se escribe ni una cifra
 * (Req 12.7).
 *
 * El contenedor de los fragmentos no es objetivo de nada: la cascada solo toca
 * los elementos de texto, y su desaparición durante el scroll pertenece a
 * `Orbita_Home`. Al terminar la pasada, `opacity` e `y` quedan en el estado final
 * sin ninguna animación posterior encima (Req 3.3).
 * ------------------------------------------------------------------------- */

/**
 * Escucha del corte por scroll anticipado. Va en fase de captura sobre `window`
 * para enterarse también del scroll del `.escena-capa` del home —los eventos de
 * scroll no burbujean, pero sí bajan por la fase de captura— y es `once`, así que
 * el corte ocurre como máximo una vez y la escucha se suelta sola al dispararse.
 */
const OPCIONES_ESCUCHA_ECOS = { passive: true, capture: true, once: true } as const;

/**
 * Entrada escalonada de `Ecos_Esquina` y su corte por scroll anticipado.
 *
 * Tres ausencias la cancelan antes de que exista una sola timeline:
 *
 * - sin ningún elemento en el DOM no hay cascada y el visitante no ve ningún
 *   error, porque un texto de atmósfera ausente no es un fallo (Req 3.8);
 * - en `Modo_Quieto`, `plan.ecos` viene a `null`: los ecos se quedan en su estado
 *   final por CSS, con cero tweens y sin `stagger` (Req 3.6, 11.1);
 * - un calendario vacío tampoco monta nada.
 *
 * El estado inicial se escribe con `gsap.set` antes de crear la timeline, dentro
 * del callback de `matchMedia`: así queda pintado desde el primer frame (Req 3.1)
 * y `mm.revert()` lo borra junto al resto de los estilos inline (Req 13.1).
 *
 * En `Modo_Compacto` el calendario trae un único paso, de modo que `animados` es
 * solo el kicker: los ecos de esquina no reciben ni el `set` inicial ni el tween,
 * y el contenedor que el CSS oculta se queda sin un estilo inline añadido
 * (Req 3.4, 12.4). Con un solo nodo el `stagger` no tiene nada que escalonar, así
 * que la rama compacta no necesita código propio.
 *
 * **Corte por scroll anticipado (Req 3.7).** `cierreEcos` es una timeline en
 * espera, creada también en el contexto, que lleva a los pendientes a
 * `opacity 1` / `y 0` en `calendario.corte` (0.18 s ≤ 0.2 s). La primera señal de
 * scroll mata la cascada y la pone en marcha; si la pasada termina antes, la
 * escucha se suelta y el cierre nunca corre, de modo que sobre esas dos
 * propiedades no queda ninguna animación posterior (Req 3.3).
 */
function montarEcos(contexto: ContextoFondo): LimpiezaFondo | null {
  const { gsap, nodos, plan, modo } = contexto;
  const ecos = nodos.ecos;
  if (ecos.length === 0) return null;
  if (plan.ecos === null) return null;

  const calendario = calendarioEcos(ecos.length, modo);
  if (calendario === null) return null;

  const animados = ecos.slice(0, calendario.pasos.length);
  if (animados.length === 0) return null;

  const duracion = calendario.pasos[0].duracion;

  gsap.set(animados, { opacity: 0, y: calendario.yDesde });

  const entradaEcos = gsap.timeline();

  entradaEcos.fromTo(
    animados,
    { opacity: 0, y: calendario.yDesde },
    {
      opacity: 1,
      y: 0,
      duration: duracion,
      ease: calendario.ease,
      stagger: calendario.paso,
      overwrite: "auto",
    },
  );

  // Cierre en espera: parte de los valores que la cascada haya dejado en curso,
  // porque un `to` pausado no fija su punto de partida hasta que se reproduce.
  const cierreEcos = gsap.timeline({ paused: true });

  cierreEcos.to(animados, {
    opacity: 1,
    y: 0,
    duration: calendario.corte,
    ease: calendario.ease,
    overwrite: "auto",
  });

  const cortar = (): void => {
    entradaEcos.kill();
    cierreEcos.play(0);
  };

  window.addEventListener("scroll", cortar, OPCIONES_ESCUCHA_ECOS);

  const soltarEscucha = (): void => {
    window.removeEventListener("scroll", cortar, OPCIONES_ESCUCHA_ECOS);
  };

  entradaEcos.eventCallback("onComplete", soltarEscucha);

  return () => {
    soltarEscucha();
    cierreEcos.kill();
    entradaEcos.kill();
  };
}

/* ------------------------------------------------------------------------- *
 * Timeline #7 · el ScrollTrigger espejo de `home-orbita`
 *
 * `Orbita_Home` ya posee el único ScrollTrigger con scrub del home: el de id
 * `home-orbita`, anclado al `.escena-capa` que envuelve la escena. El fondo no
 * añade tweens a esa timeline ni toca su instancia: crea **otra** cuyo
 * ScrollTrigger declara el mismo `scroller`, el mismo `trigger` y los mismos
 * `start`, `end` y `scrub`, copiados de ella. Compartiendo los cinco valores, el
 * espejo tiene el mismo `progress` que la órbita en todo instante, que es lo que
 * pide Req 5.1 sin necesidad de sincronizar nada a mano.
 *
 * De `orbita` solo se **lee** (`scroller`, `trigger` y tres claves de `vars`):
 * cero escrituras, cero `kill()`, `disable()` o `refresh()` con parámetros
 * propios y cero reasignaciones de su `onRefresh` / `onUpdate`, de modo que la
 * coreografía de la órbita queda intacta (Req 5.2, 6.4). Tampoco nace un
 * contenedor de scroll nuevo: `orbita.scroller` **es** el `.escena-capa` que la
 * órbita resolvió, y el espejo se cuelga de él.
 *
 * Dos ausencias cancelan la pieza sin crear nada y sin propagar excepción, con
 * `Capa_Foto` y `Capas_Overlay` en el estado que les dejó su entrada (Req 5.10,
 * 5.11): que `plan.scrub` venga en falso —la rama de `Modo_Quieto`, donde el
 * plan entero es `null` / `[]` / `false`— y que el ScrollTrigger de la órbita no
 * esté disponible, porque `montarOrbita` no llegó a montarlo o su contexto de
 * `matchMedia` está revertido.
 *
 * De la timeline cuelgan los nueve tramos de `keyframesFondo(tope)`, uno por
 * keyframe y en su propia posición, así que su largo total es 1 y el tiempo de la
 * timeline **es** el progreso del espejo (`colgarTramos`). De sus vars cuelga
 * además el `onUpdate` que pausa los bucles por progreso, propio del espejo y sin
 * volver a leer la órbita (`pausaPorProgreso`).
 * ------------------------------------------------------------------------- */

/** Id del ScrollTrigger de `Orbita_Home`: la única referencia del fondo a ella. */
const ID_ORBITA = "home-orbita";

/** Id del ScrollTrigger espejo que el fondo posee (Req 5.1). */
const ID_ESPEJO = "home-fondo";

/**
 * Easing de la timeline de scrub. Lineal, así que la interpolación es idéntica
 * al avanzar y al retroceder y el estado visual es función del progreso y no del
 * camino recorrido (Req 5.6, 5.8).
 */
const EASE_SCRUB: EaseSuave = "none";

/** Lo que entrega `ScrollTrigger.getById`: la instancia o `undefined`. */
type TriggerScroll = ReturnType<typeof ScrollTrigger.getById>;

/** Timeline ligada al ST espejo: una sola pasada, sin `repeat` ni `yoyo`. */
type TimelineScrub = ReturnType<InstanciaGsap["timeline"]>;

/**
 * Vars de un extremo de un tramo del scrub. Cada keyframe gobierna **un** canal:
 * `opacity` va como número y `brightness` como la función `filter` que le
 * corresponde, de modo que la foto nunca atenúa con las dos a la vez (Req 5.3).
 */
type ValorTramo = { opacity: number } | { filter: string };

/**
 * Las capas que un tramo gobierna: `foto` es un solo nodo y `overlay` son las
 * tres capas de mezcla, que comparten la misma curva de `opacity`.
 *
 * Los cuatro son nodos que el fondo posee, resueltos por `resolverNodosFondo` a
 * partir de la lista blanca `SELECTORES_FONDO`. El copy, la pista de scroll, el
 * contenedor de fragmentos, las carátulas del collage, la órbita y el subárbol
 * del play no están en esa lista y tampoco en esta bolsa, así que ningún tramo
 * puede alcanzarlos: la omisión de Req 5.7 se sostiene por construcción. Lo
 * ausente sale de la lista, y un tramo sin objetivos no llega a colgarse
 * (Req 2.11).
 */
function objetivosDelTramo(nodos: NodosFondo, objetivo: Keyframe["objetivo"]): readonly Element[] {
  if (objetivo === "foto") return nodos.foto === null ? [] : [nodos.foto];

  const overlays: Element[] = [];
  for (const capa of [nodos.onda, nodos.eq, nodos.halo]) {
    if (capa !== null) overlays.push(capa);
  }

  return overlays;
}

/** Traduce un valor del keyframe al canal CSS que ese keyframe gobierna. */
function valorDelTramo(keyframe: Keyframe, valor: number): ValorTramo {
  if (keyframe.prop === "opacity") return { opacity: valor };

  return { filter: cadenaBrillo(valor) };
}

/**
 * Cuelga de la timeline del scrub los nueve tramos de `keyframesFondo(tope)`, uno
 * por keyframe y en su propia posición.
 *
 * La correspondencia entre progreso y tiempo es directa y no necesita factor de
 * escala: cada tramo entra en la posición `keyframe.inicio` con duración
 * `largoKeyframe(keyframe)`, así que el tramo que llega a `fin = 1.00` fija el
 * largo total de la timeline en 1 y el tiempo de la timeline **es** el progreso.
 * El scrub del ST espejo, que reparte `progress ∈ [0, 1]` sobre ese largo, lleva
 * cada tramo exactamente al valor que `valoresFondoEn(p, tope)` da para el mismo
 * `p` (Req 5.6, 5.8). La tabla de keyframes es la única fuente: aquí no se
 * escribe ni una frontera, ni un valor, ni un tope.
 *
 * Los tres canales quedan repartidos como pide el enunciado, sin que este módulo
 * lo decida: el brillo de la foto de 1.00 a 0.86 en `p ∈ [0, 0.10]` y constante
 * después (Req 5.3), la `opacity` de las overlays del tope a 0.10 en
 * `[0.10, 0.70]` y a 0.04 en `[0.70, 0.85]` (Req 5.4), y la `opacity` de la foto
 * de 1.00 a 0.08 en `[0.85, 0.95]`, constante hasta 1.00 (Req 5.5). Los tramos
 * constantes se cuelgan como cualquier otro: mantienen el canal fijado en su
 * valor y hacen que la curva de la timeline sea total en todo `[0, 1]`.
 *
 * Tres detalles sostienen la reversibilidad de Req 5.6. `ease` llega por los
 * `defaults` de la timeline, así que todos los tramos son lineales y la
 * interpolación es idéntica al avanzar y al retroceder. `immediateRender: false`
 * evita que un `fromTo` pinte su valor de partida al crearse y le robe a la
 * entrada de la foto o a un bucle overlay su estado inicial (diseño D4). Y no hay
 * `overwrite`: los dos canales de la foto —`opacity` y `filter`— se solapan en el
 * tiempo sobre el mismo nodo, y cancelarse mutuamente rompería la curva.
 *
 * Ningún tramo lleva `repeat`, `yoyo` ni `delay`: la posición en la timeline es
 * el cuarto argumento de `fromTo`, no un retardo (Req 5.8).
 */
function colgarTramos(contexto: ContextoFondo, scrubFondo: TimelineScrub): void {
  const { nodos, plan } = contexto;

  for (const keyframe of keyframesFondo(plan.topeOverlay)) {
    const objetivos = objetivosDelTramo(nodos, keyframe.objetivo);
    if (objetivos.length === 0) continue;

    scrubFondo.fromTo(
      objetivos,
      valorDelTramo(keyframe, keyframe.desde),
      {
        ...valorDelTramo(keyframe, keyframe.hasta),
        duration: largoKeyframe(keyframe),
        immediateRender: false,
      },
      keyframe.inicio,
    );
  }
}

/**
 * El ScrollTrigger de la órbita, o `undefined` si no está disponible. Una única
 * lectura por id, envuelta para que un registro a medias no propague excepción
 * y el montaje del home se complete igual (Req 5.10).
 */
function scrollTriggerDeLaOrbita(): TriggerScroll {
  try {
    return ScrollTrigger.getById(ID_ORBITA);
  } catch {
    return undefined;
  }
}

/* ------------------------------------------------------------------------- *
 * Pausa por progreso · el scrub toma el relevo de los bucles
 *
 * En cuanto el recorrido arranca, la coreografía de scroll pasa a ser la única
 * dueña de `opacity` y `filter` de las capas, así que los bucles infinitos no
 * tienen nada que aportar: por encima de `P_PAUSA` se quedan quietos y dejan de
 * consumir frames (Req 5.9). La frontera no se escribe aquí, la decide
 * `debenPausarBucles(p)` sobre el progreso del ST **espejo** —nunca el de la
 * órbita, cuyo `onUpdate` no se toca— y ya la verifica la Propiedad 9.
 *
 * La pausa es `pause()` / `resume()` sobre las mismas timelines, sin un solo
 * `set` de la propiedad animada: cada bucle conserva su `progress()`, así que al
 * bajar de la frontera reanuda desde donde quedó y no hay salto visible. Y
 * mientras están pausados el `will-change` de `Capa_Foto` se retira: la promesa
 * de composición al compositor solo tiene sentido mientras algo se mueve
 * (Req 13.5).
 *
 * **Composición con la pausa por visibilidad (Req 13.9, 13.10).** Las dos
 * mecánicas actúan sobre el mismo colector `contexto.bucles`, y ninguna puede
 * deshacer a la otra porque las dos siguen la misma regla: *solo se reanuda lo
 * que uno mismo pausó*. La de visibilidad recuerda en una lista los bucles que
 * estaban corriendo al ocultarse la pestaña; esta recuerda en un conjunto los que
 * estaba corriendo al cruzar la frontera. De ahí salen los cuatro casos:
 *
 * - pausado por scroll y luego pestaña oculta: la visibilidad no encuentra
 *   ninguno corriendo, recuerda una lista vacía y al volver no reanuda nada, de
 *   modo que el progreso del scroll sigue mandando;
 * - pestaña oculta y luego un `onUpdate` por debajo de la frontera —un refresco
 *   del ST puede llegar con la pestaña oculta—: `enPausa` está en falso, así que
 *   esta mecánica sale sin tocar nada y la pausa por visibilidad sobrevive;
 * - pausado por visibilidad y luego cruce de la frontera: los bucles ya están
 *   pausados, así que el conjunto se queda vacío y esta mecánica no se apropia de
 *   lo que no pausó;
 * - y el caso normal, cada una actuando sola, que es lo que hacían por separado.
 *
 * Queda un resto conocido, y es el precio de no reestructurar la pieza de la
 * foto: el bucle idle nace `paused` esperando el `onComplete` de su entrada, así
 * que si el visitante entra con el scroll ya restaurado por encima de la frontera
 * y **no** vuelve a moverlo, ese bucle arranca cuando la entrada termina y no hay
 * un `onUpdate` posterior que lo pause. Por eso la pasada de pausa se repite en
 * cada actualización mientras la frontera está cruzada, en vez de una sola vez al
 * cruzarla: el primer movimiento de scroll lo alcanza. No compite con el scrub
 * en ninguna propiedad —el idle solo anima `scale`— y no deja estado inconsistente.
 * ------------------------------------------------------------------------- */

/**
 * Construye el manejador de la pausa por progreso del ST espejo.
 *
 * Devuelve una función y no monta nada: no registra escuchas, no crea timelines
 * y no escribe una sola propiedad animada. Todo su estado son las dos variables
 * que captura —el conjunto de los bucles que ella pausó y la fase en la que
 * está—, vivas mientras viva el ScrollTrigger que la invoca y recogidas con él
 * cuando el contexto lo mata, de modo que esta pieza no necesita limpieza propia.
 *
 * El conjunto solo admite bucles que estaban corriendo, así que nunca reanuda lo
 * que otra mecánica pausó, y la fase evita repetir la escritura de `will-change`
 * en cada fotograma del scrub: la propiedad se retira al cruzar la frontera y se
 * restaura al volver, una sola vez por cruce y solo si el plan la contempla.
 */
function pausaPorProgreso(contexto: ContextoFondo): (progreso: number) => void {
  const { nodos, plan, bucles } = contexto;
  const foto = nodos.foto;

  const pausados = new Set<BucleInfinito>();
  let enPausa = false;

  return (progreso: number): void => {
    if (debenPausarBucles(progreso)) {
      // Solo lo que está corriendo: lo ya pausado pertenece a quien lo pausó.
      for (const bucle of bucles) {
        if (bucle.paused()) continue;
        bucle.pause();
        pausados.add(bucle);
      }

      if (enPausa) return;
      enPausa = true;
      if (foto !== null) retirarWillChange(foto);
      return;
    }

    // Por debajo de la frontera sin haber cruzado: nada que reanudar, y desde
    // luego nada que arrebatarle a la pausa por visibilidad.
    if (!enPausa) return;
    enPausa = false;

    // `resume()` conserva el `progress()` de cada bucle: se reanuda desde donde
    // quedó, sin `set` de la propiedad y sin crear instancias nuevas.
    for (const bucle of pausados) bucle.resume();
    pausados.clear();

    if (foto !== null && plan.willChange) aplicarWillChange(foto);
  };
}

/**
 * ScrollTrigger espejo del de la órbita, con la timeline de scrub colgada de él.
 *
 * Las dos guardas van antes de crear cualquier cosa, así que cuando el espejo no
 * puede existir no hay ni timeline ni ScrollTrigger: la foto y las overlays se
 * quedan donde las dejó su entrada (Req 5.10, 5.11).
 *
 * `invalidateOnRefresh: true` es propio del espejo —no una copia—: en cada
 * refresco los tweens vuelven a leer sus valores de partida, de modo que un
 * cambio de viewport no arrastra medidas viejas. El refresco global lo dispara
 * `ScrollTrigger.refresh()` cuando corresponde; aquí no se llama, ni con
 * parámetros propios ni sin ellos (Req 5.2).
 *
 * El `onUpdate` es lo único que el espejo declara y la órbita no: lleva el
 * progreso a `pausaPorProgreso`, que pausa y reanuda los bucles del colector
 * (Req 5.9). Se construye antes de crear el ST porque crearlo dispara un refresco
 * que puede llamar al callback en el acto.
 *
 * La limpieza mata solo lo que la pieza creó, en orden inverso al de creación:
 * el ST espejo y su timeline. Al morir el ST muere su `onUpdate` y con él el
 * estado que la pausa por progreso capturaba, así que no hay nada más que soltar.
 * La instancia de la órbita nunca se toca.
 */
function montarScrub(contexto: ContextoFondo): LimpiezaFondo | null {
  const { gsap, plan } = contexto;
  if (!plan.scrub) return null;

  const orbita = scrollTriggerDeLaOrbita();
  if (orbita === undefined) return null;

  // Lineal por defecto y de una sola pasada: los nueve tramos de
  // `keyframesFondo` cuelgan de ella y su largo total queda en 1 (Req 5.8).
  const scrubFondo = gsap.timeline({ defaults: { ease: EASE_SCRUB } });
  colgarTramos(contexto, scrubFondo);

  const pausarPorProgreso = pausaPorProgreso(contexto);

  const espejo = ScrollTrigger.create({
    id: ID_ESPEJO,
    animation: scrubFondo,
    // Cinco lecturas de la órbita y ninguna escritura (Req 5.1, 5.2).
    scroller: orbita.scroller,
    trigger: orbita.trigger,
    start: orbita.vars.start,
    end: orbita.vars.end,
    scrub: orbita.vars.scrub,
    invalidateOnRefresh: true,
    // Propio del espejo, no una copia: el `onUpdate` de la órbita no se toca.
    onUpdate: (self) => pausarPorProgreso(self.progress),
  });

  return () => {
    espejo.kill();
    scrubFondo.kill();
  };
}

/* ------------------------------------------------------------------------- *
 * Par #8 · el fondo sigue al puntero
 *
 * Dos `gsap.quickTo` sobre `x` e `y` de `.home__fondo` —un único tween vivo por
 * eje, reutilizado en cada evento— alimentados por `desplazamientoParallax`
 * (Req 4.1, 4.3). La aritmética es toda del módulo puro: aquí solo se lee el
 * punto del evento, se mide la caja del fondo y se entrega el resultado a los
 * dos setters, así que el alcance de 12 px, el acotado y el `(0, 0)` exacto del
 * centro no pueden divergir de lo que verifica la Propiedad 10 (Req 4.2, 12.7).
 *
 * El desplazamiento se aplica sobre `.home__fondo`, el ancestro de las cuatro
 * capas, de modo que la foto y las tres overlays se mueven juntas con un solo
 * par de tweens y ninguna compite con los bucles, que animan `scale`, `scaleY` y
 * `filter` sobre nodos distintos.
 * ------------------------------------------------------------------------- */

/**
 * Opciones de las escuchas del parallax: pasivas, porque los tres manejadores
 * solo leen coordenadas y nunca llaman a `preventDefault`. La fase de burbujeo se
 * declara de forma explícita para que la retirada case con el registro.
 */
const OPCIONES_ESCUCHA_PARALLAX = { passive: true, capture: false } as const;

/** Ejes que la limpieza cancela sobre el fondo, los mismos que mueve el parallax. */
const EJES_PARALLAX = "x,y";

/**
 * Caja del fondo en coordenadas de viewport. Se mide en el instante del evento,
 * así que el centro sigue siendo el correcto tras un scroll o un cambio de
 * viewport sin necesidad de una escucha extra que invalide una medida en caché.
 */
function cajaDe(elemento: HTMLElement): Caja {
  const rect = elemento.getBoundingClientRect();

  return { izquierda: rect.left, arriba: rect.top, ancho: rect.width, alto: rect.height };
}

/**
 * Parallax de puntero sobre `.home__fondo`.
 *
 * Dos ausencias lo cancelan antes de registrar nada, y en ese caso no existe ni
 * el listener ni un solo tween, de modo que el desplazamiento se queda en
 * `(0, 0)`:
 *
 * - sin `.home__fondo` no hay objetivo (Req 2.11);
 * - `plan.parallax` ya es `parallaxActivo(modo)`, la conjunción de `Puntero_Fino`,
 *   viewport no compacto y movimiento permitido, así que la misma guarda cubre el
 *   entorno sin puntero fino, `Modo_Compacto` y `Modo_Quieto` sin ramas propias
 *   (Req 4.4, 4.5, 11.2, 12.3).
 *
 * `aplicado` guarda el último desplazamiento válido y entra como `previo` en cada
 * cálculo: un evento con coordenadas no finitas o una caja degenerada devuelven
 * ese mismo valor, así que el fondo se queda donde estaba y la escucha sigue viva
 * sin reiniciarse (Req 4.9).
 *
 * `salir` lleva el fondo al centro con el mismo tween corto de `PARALLAX`
 * (0.45 s ≤ 0.8 s, `power1.out`) y lo comparten las dos salidas: `pointerleave`
 * sobre la raíz del home —el puntero abandona el área visible del fondo— y `blur`
 * sobre la ventana —el puntero o el foco se van de la ventana— (Req 4.7).
 *
 * La limpieza retira las tres escuchas que registró, cancela los tweens de ambos
 * ejes y fija el desplazamiento en `salidaParallax()`, de modo que el revert del
 * contexto no puede dejar un resto de traslación (Req 4.6, 4.8).
 */
function montarParallax(contexto: ContextoFondo): LimpiezaFondo | null {
  const { gsap, root, nodos, plan } = contexto;
  const fondo = nodos.fondo;
  if (fondo === null) return null;
  if (!plan.parallax) return null;

  const tween = { duration: PARALLAX.duracion, ease: PARALLAX.ease };
  const parallaxX = gsap.quickTo(fondo, "x", tween);
  const parallaxY = gsap.quickTo(fondo, "y", tween);

  let aplicado: Desplazamiento = salidaParallax();

  const aplicar = (destino: Desplazamiento): void => {
    aplicado = destino;
    parallaxX(destino.x);
    parallaxY(destino.y);
  };

  const mover = (evento: PointerEvent): void => {
    const punto = { x: evento.clientX, y: evento.clientY };
    aplicar(desplazamientoParallax(punto, cajaDe(fondo), aplicado));
  };

  const salir = (): void => {
    aplicar(salidaParallax());
  };

  root.addEventListener("pointermove", mover, OPCIONES_ESCUCHA_PARALLAX);
  root.addEventListener("pointerleave", salir, OPCIONES_ESCUCHA_PARALLAX);
  window.addEventListener("blur", salir, OPCIONES_ESCUCHA_PARALLAX);

  return () => {
    root.removeEventListener("pointermove", mover, OPCIONES_ESCUCHA_PARALLAX);
    root.removeEventListener("pointerleave", salir, OPCIONES_ESCUCHA_PARALLAX);
    window.removeEventListener("blur", salir, OPCIONES_ESCUCHA_PARALLAX);
    gsap.killTweensOf(fondo, EJES_PARALLAX);
    gsap.set(fondo, salidaParallax());
  };
}

/* ------------------------------------------------------------------------- *
 * Escucha #9 · la pestaña oculta deja de consumir frames
 *
 * Un único `visibilitychange` sobre `document` que actúa exactamente sobre
 * `contexto.bucles`: el bucle idle de `Capa_Foto` y los de las tres overlays
 * (Req 13.9, 13.10). Nada más entra en esa lista, de modo que la escucha no
 * puede alcanzar la cascada de `Ecos_Esquina` —una sola pasada—, los `quickTo`
 * del parallax ni un solo objeto de `Orbita_Home`, cuyas timelines pertenecen a
 * otro contexto y nunca se registran aquí (Req 14.5).
 *
 * `pause()` y `resume()` conservan el `progress()` de la timeline y no crean
 * instancias nuevas, que es literalmente lo que pide Req 13.10; la escucha es
 * síncrona, así que el estado de pausa se alcanza en el mismo tick del evento,
 * muy por debajo de los 200 ms de Req 13.9.
 * ------------------------------------------------------------------------- */

/** Evento de visibilidad de la pestaña, el único que esta pieza escucha. */
const EVENTO_VISIBILIDAD = "visibilitychange";

/**
 * Opciones de la escucha de visibilidad: pasiva, porque el manejador solo pausa
 * y reanuda timelines y nunca llama a `preventDefault`. La fase de burbujeo se
 * declara de forma explícita para que la retirada case con el registro.
 */
const OPCIONES_ESCUCHA_VISIBILIDAD = { passive: true, capture: false } as const;

/**
 * Pausa y reanudación de los bucles infinitos del fondo con la visibilidad de la
 * pestaña.
 *
 * Sin bucles en el colector no hay nada que pausar y la escucha no se registra:
 * eso cubre `Modo_Quieto` —donde el plan viene entero a `null` y ninguna pieza
 * registra timeline— y también el markup incompleto, sin ninguna rama propia de
 * modo (Req 11.1, 11.2).
 *
 * `pausados` recuerda **qué** bucles estaban corriendo al ocultarse la pestaña, y
 * al volver se reanudan solo esos. La lista no es un detalle defensivo: hay dos
 * casos en los que un `resume()` indiscriminado haría daño. Uno, el bucle idle de
 * la foto nace `paused` esperando el `onComplete` de la entrada, y reanudarlo
 * antes de tiempo lo arrancaría pisando la entrada. Dos, la pausa por progreso de
 * la coreografía de scroll (Req 5.9) puede tener bucles legítimamente pausados
 * cuando el visitante cambia de pestaña; al volver deben seguir pausados, porque
 * el progreso del scroll no ha cambiado.
 *
 * La limpieza retira la escucha que registró y suelta la lista, de modo que tras
 * `mm.revert()` no queda ni un manejador vivo ni una referencia a las timelines
 * que el contexto acaba de matar (Req 13.1, 13.2).
 */
function montarVisibilidad(contexto: ContextoFondo): LimpiezaFondo | null {
  const { bucles } = contexto;
  if (bucles.length === 0) return null;

  let pausados: readonly BucleInfinito[] = [];

  const alCambiarVisibilidad = (): void => {
    if (document.hidden) {
      pausados = bucles.filter((bucle) => !bucle.paused());
      for (const bucle of pausados) bucle.pause();
      return;
    }

    for (const bucle of pausados) bucle.resume();
    pausados = [];
  };

  document.addEventListener(EVENTO_VISIBILIDAD, alCambiarVisibilidad, OPCIONES_ESCUCHA_VISIBILIDAD);

  return () => {
    document.removeEventListener(
      EVENTO_VISIBILIDAD,
      alCambiarVisibilidad,
      OPCIONES_ESCUCHA_VISIBILIDAD,
    );
    pausados = [];
  };
}

/* ------------------------------------------------------------------------- *
 * Reposo #10 · la rama quieta descansa en su estado final
 *
 * En `Modo_Quieto` el plan viene entero a `null` / `[]` / `false`, así que
 * ninguna pieza crea una timeline y las capas se quedan con los valores que les
 * da el CSS: la foto en `opacity 1` / `scale 1` / `x` e `y` 0 / `rotation` 0 sin
 * `will-change`, las overlays en su estado final —`opacity` del tope, la silueta
 * de las barras, el halo sin escalar— y los ecos en `opacity 1` / `y 0`
 * (Req 1.8, 11.1–11.3, 11.8). Eso basta en un montaje en frío, donde el DOM
 * llega limpio de estilos inline.
 *
 * En caliente no basta, y por una razón concreta del ciclo de `matchMedia`. Al
 * cambiar `(prefers-reduced-motion: reduce)`, GSAP revierte el contexto cuyas
 * condiciones han cambiado y **después**, en el mismo tick y sin fotograma
 * intermedio, invoca el callback con las condiciones nuevas (Req 11.7, 11.10).
 * Pero al revertir un contexto, las funciones de limpieza que devolvieron las
 * piezas corren *después* de que GSAP haya restaurado los estilos inline de sus
 * tweens, de modo que lo que esas limpiezas escriben sobrevive al revert: es el
 * caso del `gsap.set(fondo, salidaParallax())` con el que el parallax garantiza
 * su vuelta al centro (Req 4.6), que deja un `transform` inline en
 * `.home__fondo`. Un solo `clearProps` sobre las capas del fondo cierra ese
 * hueco y hace explícito, en vez de implícito, el estado de reposo de la rama.
 *
 * Es un `gsap.set`: escribe en el mismo tick, no deja ningún tween activo
 * (Req 11.1–11.3) y, creado dentro del callback de `matchMedia`, queda
 * registrado en el `Contexto_GSAP` como todo lo demás (Req 13.1).
 * ------------------------------------------------------------------------- */

/**
 * Propiedades que la rama quieta retira de las capas: la lista blanca completa
 * del fondo más el `will-change` de la respiración idle. Se declaran como lista
 * de `clearProps`, así que aquí no se escribe ni un valor de la coreografía: lo
 * que queda tras la limpieza es exactamente lo que declara el CSS, que es la
 * definición de «estado final» del diseño (Req 1.6, 11.1, 11.3, 11.8, 12.7).
 */
const PROPS_QUIETO: string = [...PROPS_PERMITIDAS, PROP_WILL_CHANGE].join(",");

/** Las capas que el fondo posee, en orden de documento y sin las ausentes. */
function capasDelFondo(nodos: NodosFondo): readonly Element[] {
  const capas: Element[] = [];

  for (const capa of [nodos.fondo, nodos.foto, nodos.onda, nodos.eq, nodos.halo]) {
    if (capa !== null) capas.push(capa);
  }

  return [...capas, ...nodos.barras, ...nodos.ecos];
}

/**
 * Deja las capas del fondo en su estado final sin transición y sin valores
 * residuales del contexto revertido.
 *
 * Solo actúa en `Modo_Quieto`: con movimiento son las propias timelines las que
 * escriben esas propiedades, y adelantarles una limpieza no aportaría nada. La
 * ausencia de nodos tampoco pide rama propia, porque `capasDelFondo` ya deja
 * fuera lo que no está en el DOM (Req 2.11).
 */
function fijarEstadoQuieto(contexto: ContextoFondo): void {
  const { gsap, nodos, modo } = contexto;
  if (!modo.quieto) return;

  const capas = capasDelFondo(nodos);
  if (capas.length === 0) return;

  gsap.set(capas, { clearProps: PROPS_QUIETO });
}

/**
 * Costura de las piezas del fondo. Cada pieza se monta dentro del callback de
 * `matchMedia` —así queda registrada en el contexto y `mm.revert()` la mata con
 * sus estilos inline (Req 13.1)— y devuelve su propia limpieza para lo que GSAP
 * no revierte por sí solo (listeners, `will-change`, indicadores).
 *
 * Cada pieza decide por sí misma si tiene algo que montar, así que la
 * degradación es composicional: en `Modo_Quieto` el plan viene entero a `null` /
 * `[]` / `false` y ninguna devuelve limpieza, con cero tweens sobre `Capa_Foto`,
 * `Capas_Overlay` y `Ecos_Esquina` (Req 11.1–11.3); si falta un nodo, solo
 * desaparece su animación.
 *
 * Ya están en pie el reposo de la rama quieta, la pareja de `Capa_Foto`, los tres
 * bucles overlay —onda, barras EQ y halo—, la cascada de `Ecos_Esquina`, el
 * parallax de puntero, la pausa por visibilidad y el ScrollTrigger espejo.
 *
 * El orden importa en tres puntos. `fijarEstadoQuieto` va **primero**, porque en
 * `Modo_Quieto` es el único que escribe y debe hacerlo antes de que nada pueda
 * pintarse; no devuelve limpieza porque el revert del contexto es toda la que
 * necesita. `montarVisibilidad` va **después de las cuatro piezas con bucle
 * infinito**, porque actúa sobre el colector `contexto.bucles` y necesita que ya
 * se hayan registrado en él. Y `montarScrub` va **última**: crear su
 * ScrollTrigger dispara un refresco que puede llamar a su `onUpdate` en el acto,
 * y esa llamada debe encontrar el colector completo.
 */
function montarPiezas(contexto: ContextoFondo): readonly LimpiezaFondo[] {
  const limpiezas: LimpiezaFondo[] = [];

  fijarEstadoQuieto(contexto);

  const foto = montarFoto(contexto);
  if (foto !== null) limpiezas.push(foto);

  const onda = montarOnda(contexto);
  if (onda !== null) limpiezas.push(onda);

  const eq = montarEq(contexto);
  if (eq !== null) limpiezas.push(eq);

  const halo = montarHalo(contexto);
  if (halo !== null) limpiezas.push(halo);

  const ecos = montarEcos(contexto);
  if (ecos !== null) limpiezas.push(ecos);

  const parallax = montarParallax(contexto);
  if (parallax !== null) limpiezas.push(parallax);

  const visibilidad = montarVisibilidad(contexto);
  if (visibilidad !== null) limpiezas.push(visibilidad);

  const scrub = montarScrub(contexto);
  if (scrub !== null) limpiezas.push(scrub);

  return limpiezas;
}

/**
 * Monta el fondo vivo del home sobre `root` (el `<section class="home">`) y
 * devuelve la limpieza de su `Contexto_GSAP`.
 *
 * El orden es siempre el mismo: resolver, decidir, montar. Las tres guardas de
 * entrada salen sin crear un solo tween y sin propagar excepciones, de modo que
 * un fondo que no puede animarse nunca impide que el home monte:
 *
 * - sin `.home__fondo`, la limpieza es vacía (Req 2.11);
 * - sin ScrollTrigger y Flip en el registro, cero tweens y aviso en consola,
 *   con la foto y las overlays en su estado estático (Req 14.10);
 * - sin `gsap.matchMedia()`, se asume `Modo_Quieto`, se avisa en consola y
 *   queda constancia en `root.dataset.fondoMotion = "no-detectado"` (Req 11.11).
 */
export function montarFondoHome(root: HTMLElement): LimpiezaFondo {
  const gsap = ensureGsap();
  const nodos = resolverNodosFondo(root);
  if (nodos.fondo === null) return LIMPIEZA_VACIA;

  if (!capacidadesSuficientes(capacidadesDelRegistro(gsap))) {
    console.warn(
      `${AVISO} el registro de GSAP no entregó ScrollTrigger y Flip: el fondo queda estático.`,
    );
    return LIMPIEZA_VACIA;
  }

  if (esQuietoPorDefecto({ matchMedia: hayMatchMedia(gsap) })) {
    console.warn(
      `${AVISO} gsap.matchMedia() no está disponible: se asume Modo_Quieto y el fondo queda en su estado final.`,
    );
    root.dataset.fondoMotion = "no-detectado";
    return () => {
      delete root.dataset.fondoMotion;
    };
  }

  const mm = gsap.matchMedia();

  mm.add(
    CONDICIONES_MM,
    (context) => {
      // `Modo_Quieto` es el OR de sus tres fuentes: la condición de matchMedia,
      // la clase `html.reduce` y el store `reduce` (Req 11.9).
      const modo: ModoFondo = {
        quieto: esQuieto({
          condicion: Boolean(context.conditions?.isReduce),
          clase: claseQuieto(),
          store: storeQuieto(),
        }),
        compacto: Boolean(context.conditions?.isCompacto),
        punteroFino: punteroFino(),
        soporteMezcla: soporteMezcla(),
      };

      const plan = planFondo(modo);
      root.dataset.fondoMotion = etiquetaModo(modo);

      // Colector de bucles infinitos, vacío en cada invocación del callback: las
      // piezas lo llenan al montarse y `montarVisibilidad` actúa sobre él.
      const limpiezas = montarPiezas({ gsap, root, nodos, plan, modo, bucles: [] });

      return () => {
        for (const limpieza of limpiezas) limpieza();
        delete root.dataset.fondoMotion;
      };
    },
    root,
  );

  return () => mm.revert();
}
