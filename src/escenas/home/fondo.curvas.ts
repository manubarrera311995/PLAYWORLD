/**
 * Aritmética y tablas del fondo vivo del home. Módulo **puro**: no toca el DOM,
 * no importa GSAP y no tiene estado. Todo el motion del fondo lee sus valores de
 * aquí, de modo que la parte verificable de la funcionalidad entra en `vitest`
 * con `environment: "node"` (diseño D3).
 *
 * Este archivo contiene los tipos, las constantes y las tablas de motion. La
 * aritmética del scrub, el plan por modo, el calendario de los ecos y el
 * parallax se añaden sobre estas mismas tablas.
 */

/** Estado del entorno que decide qué motion se monta (Req 11.9, 12.1–12.3). */
export type ModoFondo = {
  quieto: boolean;
  compacto: boolean;
  punteroFino: boolean;
  soporteMezcla: boolean;
};

/** Easings admitidos en cualquier bucle infinito del fondo (Req 2.5). */
export type EaseSuave =
  | "none"
  | "power1.in"
  | "power1.out"
  | "power1.inOut"
  | "sine.in"
  | "sine.out"
  | "sine.inOut";

/** Capas que el fondo puede animar: la foto y las tres overlays (Req 2.1). */
export type ObjetivoFondo = "foto" | "onda" | "eq" | "halo";

/** Lista blanca de propiedades animables, disjunta de `PROPS_LAYOUT` (Req 1.3, 13.7). */
export type PropFondo = "scale" | "scaleY" | "x" | "y" | "opacity" | "rotation" | "filter";

/** Entrada de la capa fotográfica: `scale`/`opacity` desde estos valores hasta 1/1 (Req 1.1). */
export type EntradaFoto = { escala: number; opacidad: number; duracion: number; ease: string };

/**
 * Tramo de `filter` de un bucle, con su función CSS y su unidad. Es el segundo
 * par de valores de un bucle que declara `"filter"` entre sus `props`: `desde` y
 * `hasta` de `BucleFondo` describen la propiedad de `transform`, y este tramo el
 * filtro que la acompaña (Req 2.8, 13.7).
 */
export type FiltroBucle = {
  funcion: "blur" | "brightness";
  desde: number;
  hasta: number;
  unidad: "px" | "";
};

/**
 * Bucle infinito de una capa. `tramo` es la duración de **un** trayecto:
 * el ciclo completo es `tramo` sin `yoyo` y `2 × tramo` con `yoyo`.
 *
 * `filtro` solo está presente en los bucles que declaran `"filter"` entre sus
 * `props`: la onda con su desenfoque y el halo con su brillo.
 */
export type BucleFondo = {
  objetivo: ObjetivoFondo;
  props: readonly PropFondo[];
  desde: number;
  hasta: number;
  tramo: number;
  ease: EaseSuave;
  desfase: number;
  yoyo: boolean;
  filtro?: FiltroBucle;
};

/** Un elemento de `Ecos_Esquina` con su instante de arranque (Req 3.2). */
export type PasoEco = { selector: string; inicio: number; duracion: number };

/** Calendario completo de la entrada escalonada de los ecos (Req 3.1–3.4, 3.7). */
export type CalendarioEcos = {
  pasos: readonly PasoEco[];
  paso: number;
  ease: string;
  yDesde: number;
  corte: number;
};

/** Qué se monta y qué no para un `ModoFondo` dado (Req 11.1–11.2, 12.1–12.3). */
export type PlanFondo = {
  entrada: EntradaFoto | null;
  bucleFoto: BucleFondo | null;
  buclesOverlay: readonly BucleFondo[];
  ecos: CalendarioEcos | null;
  parallax: boolean;
  scrub: boolean;
  willChange: boolean;
  topeOverlay: number;
};

/** Valores del fondo para un progreso del scrub (Req 5.3–5.6). */
export type ValoresFondo = {
  fotoOpacidad: number;
  fotoBrillo: number;
  overlayOpacidad: number;
};

/** Tramo lineal de la curva del scrub, en unidades de progreso `p ∈ [0, 1]`. */
export type Keyframe = {
  objetivo: "foto" | "overlay";
  prop: "opacity" | "brightness";
  desde: number;
  hasta: number;
  inicio: number;
  fin: number;
};

/** Rectángulo del fondo en coordenadas de viewport, para el parallax (Req 4.2). */
export type Caja = { izquierda: number; arriba: number; ancho: number; alto: number };

/** Desplazamiento aplicado por el parallax, en píxeles y acotado (Req 4.2). */
export type Desplazamiento = { x: number; y: number };

/** Posición del puntero en coordenadas de viewport (Req 4.1). */
export type PuntoPuntero = { x: number; y: number };

/** Resolución tolerante de nodos: lo ausente es `null` o `[]` (Req 1.10, 2.11, 3.8). */
export type NodosFondo = {
  fondo: HTMLElement | null;
  foto: HTMLImageElement | null;
  onda: SVGElement | null;
  eq: HTMLElement | null;
  halo: HTMLElement | null;
  barras: readonly HTMLElement[];
  ecos: readonly HTMLElement[];
};

/**
 * Las tres —y solo tres— condiciones de `gsap.matchMedia()` del fondo (Req 11.6).
 */
export const CONDICIONES_MM: {
  readonly isReduce: string;
  readonly isMotion: string;
  readonly isCompacto: string;
} = {
  isReduce: "(prefers-reduced-motion: reduce)",
  isMotion: "(prefers-reduced-motion: no-preference)",
  isCompacto: "(max-width: 767px)",
} as const;

/** Progreso a partir del cual los bucles infinitos se pausan (Req 5.9). */
export const P_PAUSA = 0.1;

/** Lista blanca de propiedades animables por el fondo (Req 1.3, 2.8). */
export const PROPS_PERMITIDAS: readonly PropFondo[] = [
  "scale",
  "scaleY",
  "x",
  "y",
  "opacity",
  "rotation",
  "filter",
] as const;

/** Lista negra: ninguna tabla de motion puede tocar el layout (Req 12.5, 13.7). */
export const PROPS_LAYOUT: readonly string[] = [
  "width",
  "height",
  "top",
  "left",
  "right",
  "bottom",
  "margin",
  "padding",
] as const;

/** Valores de `mix-blend-mode` admitidos en las overlays (Req 2.3). */
export const MEZCLAS_PERMITIDAS: readonly ["overlay", "screen", "plus-lighter"] = [
  "overlay",
  "screen",
  "plus-lighter",
] as const;

/** Easings admitidos en los bucles infinitos (Req 2.5). */
export const EASINGS_SUAVES: readonly EaseSuave[] = [
  "none",
  "power1.in",
  "power1.out",
  "power1.inOut",
  "sine.in",
  "sine.out",
  "sine.inOut",
] as const;

/**
 * Todo lo que el fondo puede tocar. No aparece aquí `.grano`, `canvas`,
 * `.home__cue`, `.home__fragmentos`, `.home__play*`, `.collage article`
 * ni `.home__orbita` (Req 5.7, 6.8, 10.3, 10.4).
 */
export const SELECTORES_FONDO: readonly string[] = [
  ".home__fondo",
  ".home__fondo-foto",
  '[data-fondo-capa="onda"]',
  '[data-fondo-capa="eq"]',
  '[data-fondo-capa="halo"]',
  ".home__fondo-barra",
  ".home__kicker",
  ".home__eco",
] as const;

/** Orden de apilado de las overlays dentro de `.home__fondo` (Req 10.6). */
export const Z_OVERLAYS: Readonly<Record<"onda" | "eq" | "halo", number>> = {
  onda: 1,
  eq: 2,
  halo: 3,
} as const;

/** Valor de `--z-grain` en `tokens.css`: el grano queda siempre por encima (Req 10.6). */
export const Z_GRAIN = 8;

/** Parallax de puntero: alcance 12 px, tween corto y easing suave (Req 4.2, 4.3). */
export const PARALLAX: {
  readonly alcance: 12;
  readonly duracion: number;
  readonly ease: "power1.out";
} = {
  alcance: 12,
  duracion: 0.45,
  ease: "power1.out",
} as const;

/**
 * Entrada escalonada de `Ecos_Esquina`: `opacity 0 → 1`, `y 12 → 0`, 0.6 s por
 * elemento, paso 0.09 s, total ≤ 1.0 s y corte por scroll anticipado ≤ 0.2 s
 * (Req 3.1–3.3, 3.7).
 */
export const ENTRADA_ECOS: {
  readonly y: 12;
  readonly duracion: 0.6;
  readonly paso: 0.09;
  readonly ease: "power2.out";
  readonly corte: number;
  readonly total: 1;
} = {
  y: 12,
  duracion: 0.6,
  paso: 0.09,
  ease: "power2.out",
  corte: 0.18,
  total: 1,
} as const;

/** Selector del primer eco, siempre el kicker (Req 3.2, 3.4). */
export const SELECTOR_KICKER = ".home__kicker";

/** Selector de los ecos de esquina, excluidos en compacto (Req 3.4). */
export const SELECTOR_ECO = ".home__eco";

/** Número de barras de la capa de ecualizador, dentro de 5–12 (Req 2.4). */
export const BARRAS_EQ = 7;

/** Desfase entre barras consecutivas del ecualizador (Req 2.4). */
export const PASO_EQ = 0.09;

/**
 * Desfases de arranque de los bucles overlay (Req 2.6). Diferencias por pareja:
 * 0.55, 0.85 y 1.40 s, todas en `[0.4, 1.5]`, con retardo total 1.40 s ≤ 3 s.
 */
export const DESFASES_OVERLAY: Readonly<Record<"onda" | "eq" | "halo", number>> = {
  onda: 0.0,
  eq: 0.55,
  halo: 1.4,
} as const;

/** Entrada de la foto por variante de viewport (Req 1.1, 12.7). */
export const ENTRADA_FOTO: Readonly<Record<"amplio" | "compacto", EntradaFoto>> = {
  amplio: { escala: 1.06, opacidad: 0.65, duracion: 1.0, ease: "power2.out" },
  compacto: { escala: 1.04, opacidad: 0.65, duracion: 1.0, ease: "power2.out" },
} as const;

/**
 * Respiración idle de la foto: un único bucle infinito sobre `Capa_Foto`
 * (Req 1.2, 12.1, 13.5). Ciclo `2 × tramo` por el `yoyo`: 16 s por trayecto en
 * amplio y 14 s en compacto, ambos en el rango 12–20 s del enunciado.
 */
export const IDLE_FOTO: Readonly<Record<"amplio" | "compacto", BucleFondo>> = {
  amplio: {
    objetivo: "foto",
    props: ["scale"],
    desde: 1,
    hasta: 1.08,
    tramo: 16,
    ease: "sine.inOut",
    desfase: 0,
    yoyo: true,
  },
  compacto: {
    objetivo: "foto",
    props: ["scale"],
    desde: 1,
    hasta: 1.04,
    tramo: 14,
    ease: "sine.inOut",
    desfase: 0,
    yoyo: true,
  },
} as const;

/**
 * Onda: `x ±2.5 %` más `filter: blur(0 → 1.5px)`, ciclo 8 s en amplio y 10 s en
 * compacto, sin `yoyo` (el trayecto ya recorre el vaivén completo de -2.5 a 2.5).
 * La `opacity` de las overlays no aparece aquí: es propiedad exclusiva de la
 * timeline de scrub (diseño D4, Req 2.8).
 */
export const BUCLE_ONDA: Readonly<Record<"amplio" | "compacto", BucleFondo>> = {
  amplio: {
    objetivo: "onda",
    props: ["x", "filter"],
    desde: -2.5,
    hasta: 2.5,
    tramo: 8,
    ease: "sine.inOut",
    desfase: DESFASES_OVERLAY.onda,
    yoyo: false,
    filtro: { funcion: "blur", desde: 0, hasta: 1.5, unidad: "px" },
  },
  compacto: {
    objetivo: "onda",
    props: ["x", "filter"],
    desde: -2.5,
    hasta: 2.5,
    tramo: 10,
    ease: "sine.inOut",
    desfase: DESFASES_OVERLAY.onda,
    yoyo: false,
    filtro: { funcion: "blur", desde: 0, hasta: 1.5, unidad: "px" },
  },
} as const;

/**
 * Barras del ecualizador: `scaleY 0.28 ↔ 0.92` con tramo 0.8 s (Req 2.4) y ciclo
 * 1.6 s por el `yoyo` (Req 2.5). En compacto no se animan: quedan en su estado
 * final por CSS (Req 12.2).
 */
export const BUCLE_EQ: Readonly<Record<"amplio" | "compacto", BucleFondo | null>> = {
  amplio: {
    objetivo: "eq",
    props: ["scaleY"],
    desde: 0.28,
    hasta: 0.92,
    tramo: 0.8,
    ease: "sine.inOut",
    desfase: DESFASES_OVERLAY.eq,
    yoyo: true,
  },
  compacto: null,
} as const;

/**
 * Halo: `scale 0.94 ↔ 1.06` más `filter: brightness(1 ↔ 1.08)`, ciclo 6.5 s en
 * amplio y 8 s en compacto (`2 × tramo`, con `yoyo`).
 */
export const BUCLE_HALO: Readonly<Record<"amplio" | "compacto", BucleFondo>> = {
  amplio: {
    objetivo: "halo",
    props: ["scale", "filter"],
    desde: 0.94,
    hasta: 1.06,
    tramo: 3.25,
    ease: "sine.inOut",
    desfase: DESFASES_OVERLAY.halo,
    yoyo: true,
    filtro: { funcion: "brightness", desde: 1, hasta: 1.08, unidad: "" },
  },
  compacto: {
    objetivo: "halo",
    props: ["scale", "filter"],
    desde: 0.94,
    hasta: 1.06,
    tramo: 4,
    ease: "sine.inOut",
    desfase: DESFASES_OVERLAY.halo,
    yoyo: true,
    filtro: { funcion: "brightness", desde: 1, hasta: 1.08, unidad: "" },
  },
} as const;
/* ------------------------------------------------------------------------- *
 * Aritmética del scrub
 *
 * `Progreso_Orbita` (p ∈ [0, 1]) es la única entrada: el estado visual del
 * fondo es función pura de `p` y del tope de opacidad de las overlays, nunca
 * del camino recorrido (diseño D4, Req 5.6). Los mismos keyframes alimentan la
 * timeline ligada al ScrollTrigger espejo y `valoresFondoEn`, de modo que
 * timeline y curva pura son literalmente la misma función.
 * ------------------------------------------------------------------------- */

/** Tope de `opacity` de las overlays con soporte de mezcla (≤ 0.35, Req 2.7). */
export const TOPE_OVERLAY_CON_MEZCLA = 0.3;

/** Tope de `opacity` de las overlays sin soporte de mezcla (≤ 0.20, Req 2.12). */
export const TOPE_OVERLAY_SIN_MEZCLA = 0.18;

/** Fronteras de los tramos del scrub, en unidades de progreso (Req 5.3–5.5). */
export const FRONTERAS_SCRUB: readonly number[] = [0.1, 0.7, 0.85, 0.95] as const;

/** Brillo de la foto alcanzado en `p = 0.10` y mantenido hasta el final (Req 5.3). */
export const BRILLO_FOTO_ATENUADO = 0.86;

/** `opacity` de la foto alcanzada en `p = 0.95` y mantenida hasta 1.00 (Req 5.5). */
export const OPACIDAD_FOTO_FINAL = 0.08;

/** `opacity` de las overlays en la meseta de `p = 0.70` (Req 5.4: ≤ 0.12). */
export const OVERLAY_EN_MESETA = 0.1;

/** `opacity` de las overlays desde `p = 0.85` (Req 5.5: ≤ 0.05). */
export const OVERLAY_FINAL = 0.04;

/**
 * Tope de `opacity` de las `Capas_Overlay`. Con soporte de `mix-blend-mode`
 * el techo es 0.30; sin soporte baja a 0.18 para que el fallback del CSS y la
 * curva del scrub coincidan (Req 2.7, 2.12).
 */
export function topeOverlay(soporteMezcla: boolean): number {
  return soporteMezcla ? TOPE_OVERLAY_CON_MEZCLA : TOPE_OVERLAY_SIN_MEZCLA;
}

/** Acota el progreso a `[0, 1]`; lo no finito se lee como 0. */
function acotarProgreso(p: number): number {
  if (!Number.isFinite(p)) return 0;
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  return p;
}

/**
 * Los nueve tramos de la curva del scrub, en el orden de la tabla del diseño.
 * Todos son lineales (`ease: "none"` en la timeline), así que la interpolación
 * es idéntica en ambos sentidos del scroll (Req 5.6, 5.8).
 */
export function keyframesFondo(tope: number): readonly Keyframe[] {
  return [
    // Tramo A: la foto se atenúa con una sola propiedad, `brightness` (Req 5.3).
    {
      objetivo: "foto",
      prop: "brightness",
      desde: 1,
      hasta: BRILLO_FOTO_ATENUADO,
      inicio: 0,
      fin: 0.1,
    },
    {
      objetivo: "foto",
      prop: "brightness",
      desde: BRILLO_FOTO_ATENUADO,
      hasta: BRILLO_FOTO_ATENUADO,
      inicio: 0.1,
      fin: 1,
    },
    // La `opacity` de la foto se conserva exacta hasta 0.85 (Req 5.3, 5.5).
    { objetivo: "foto", prop: "opacity", desde: 1, hasta: 1, inicio: 0, fin: 0.85 },
    {
      objetivo: "foto",
      prop: "opacity",
      desde: 1,
      hasta: OPACIDAD_FOTO_FINAL,
      inicio: 0.85,
      fin: 0.95,
    },
    {
      objetivo: "foto",
      prop: "opacity",
      desde: OPACIDAD_FOTO_FINAL,
      hasta: OPACIDAD_FOTO_FINAL,
      inicio: 0.95,
      fin: 1,
    },
    // Tramo B: las overlays parten del tope y bajan a la meseta (Req 2.7, 5.4).
    { objetivo: "overlay", prop: "opacity", desde: tope, hasta: tope, inicio: 0, fin: 0.1 },
    {
      objetivo: "overlay",
      prop: "opacity",
      desde: tope,
      hasta: OVERLAY_EN_MESETA,
      inicio: 0.1,
      fin: 0.7,
    },
    // Tramo C: overlays casi apagadas antes del giro final (Req 5.4, 5.5).
    {
      objetivo: "overlay",
      prop: "opacity",
      desde: OVERLAY_EN_MESETA,
      hasta: OVERLAY_FINAL,
      inicio: 0.7,
      fin: 0.85,
    },
    {
      objetivo: "overlay",
      prop: "opacity",
      desde: OVERLAY_FINAL,
      hasta: OVERLAY_FINAL,
      inicio: 0.85,
      fin: 1,
    },
  ] as const;
}

/**
 * Longitud de un tramo en unidades de progreso. Es también su duración en la
 * timeline del scrub, porque esa timeline mide el progreso en su propio tiempo:
 * un tramo colgado en `inicio` con esta duración termina exactamente en `fin`,
 * de modo que la timeline y `valoresFondoEn` son la misma función (Req 5.6, 5.8).
 */
export function largoKeyframe(keyframe: Keyframe): number {
  return keyframe.fin - keyframe.inicio;
}

/**
 * Valor lineal de un keyframe en el progreso `p`, acotado a su propio tramo.
 * Un tramo de longitud nula devuelve su valor de llegada.
 */
export function interpolarKeyframe(keyframe: Keyframe, p: number): number {
  const largo = largoKeyframe(keyframe);
  if (largo <= 0) return keyframe.hasta;

  const bruto = (acotarProgreso(p) - keyframe.inicio) / largo;
  const t = bruto <= 0 ? 0 : bruto >= 1 ? 1 : bruto;

  // `desde + (hasta - desde) * t` conserva el valor exacto en los tramos
  // constantes: con `desde === hasta` el resultado es `desde` sin error.
  return keyframe.desde + (keyframe.hasta - keyframe.desde) * t;
}

/** Último tramo cuyo inicio no supera `p`; antes del primero, el primero. */
function tramoEn(
  keyframes: readonly Keyframe[],
  objetivo: Keyframe["objetivo"],
  prop: Keyframe["prop"],
  p: number,
): Keyframe | null {
  let elegido: Keyframe | null = null;

  for (const keyframe of keyframes) {
    if (keyframe.objetivo !== objetivo || keyframe.prop !== prop) continue;
    if (elegido === null) elegido = keyframe;
    if (keyframe.inicio <= p) elegido = keyframe;
  }

  return elegido;
}

/**
 * Estado del fondo en el progreso `p`. Función pura y total: sin estado propio,
 * definida para todo real (fuera de `[0, 1]` se acota a la frontera más cercana)
 * y derivada de los mismos keyframes que construyen la timeline del scrub
 * (Req 5.3–5.6).
 */
export function valoresFondoEn(p: number, tope: number): ValoresFondo {
  const progreso = acotarProgreso(p);
  const keyframes = keyframesFondo(tope);

  const fotoOpacidad = tramoEn(keyframes, "foto", "opacity", progreso);
  const fotoBrillo = tramoEn(keyframes, "foto", "brightness", progreso);
  const overlayOpacidad = tramoEn(keyframes, "overlay", "opacity", progreso);

  return {
    fotoOpacidad: fotoOpacidad === null ? 1 : interpolarKeyframe(fotoOpacidad, progreso),
    fotoBrillo: fotoBrillo === null ? 1 : interpolarKeyframe(fotoBrillo, progreso),
    overlayOpacidad: overlayOpacidad === null ? tope : interpolarKeyframe(overlayOpacidad, progreso),
  };
}

/**
 * Los bucles infinitos se pausan a partir de `P_PAUSA`: mientras el scrub manda,
 * ningún bucle consume frames ni compite por las propiedades (Req 5.9).
 */
export function debenPausarBucles(p: number): boolean {
  return p >= P_PAUSA;
}

/* ------------------------------------------------------------------------- *
 * Plan de motion por modo
 *
 * `planFondo` es la única puerta por la que `fondo.ts` decide qué se monta:
 * dado un `ModoFondo` devuelve las tablas que aplican y nada más. Es una
 * función pura del modo (Propiedad 11), así que la rama de `Modo_Quieto`
 * (Req 11.1, 11.2) y la rama compacta (Req 12.1–12.3) se verifican sin DOM.
 * ------------------------------------------------------------------------- */

/** Variante de viewport de las tablas de motion (Req 12.1, 12.2, 12.7). */
export type VarianteFondo = "amplio" | "compacto";

/** Valor de `repeat` de todo bucle infinito del fondo (Req 1.2, 2.5). */
export const REPETICION_BUCLE = -1;

/**
 * Rango de la duración **por tramo** del bucle de `Capa_Foto`: Req 1.2 lo fija
 * entre 12 s y 20 s por trayecto, y Req 12.1 exige ≥ 12 s en compacto.
 */
export const RANGO_TRAMO_FOTO: { readonly min: 12; readonly max: 20 } = {
  min: 12,
  max: 20,
} as const;

/**
 * Rango de la duración **por ciclo completo** de los bucles de `Capas_Overlay`
 * (Req 2.5): 1.2 s a 12 s. Con `yoyo` el ciclo es `2 × tramo`, así que las
 * barras (tramo 0.8 s, Req 2.4) entran con ciclo 1.6 s.
 */
export const RANGO_CICLO_OVERLAY: { readonly min: 1.2; readonly max: 12 } = {
  min: 1.2,
  max: 12,
} as const;

/** Diferencia admitida entre dos desfases de bucles overlay (Req 2.6). */
export const RANGO_DIFERENCIA_DESFASE: { readonly min: 0.4; readonly max: 1.5 } = {
  min: 0.4,
  max: 1.5,
} as const;

/** Retardo total máximo del escalonado de los bucles overlay (Req 2.6). */
export const DESFASE_TOTAL_MAX = 3;

/** Lista vacía compartida por la rama quieto: cero bucles overlay (Req 11.2). */
const SIN_BUCLES: readonly BucleFondo[] = [] as const;

/**
 * `Modo_Quieto` está activo si lo dice **cualquiera** de sus tres fuentes: la
 * condición `isReduce` de `gsap.matchMedia()`, la clase `html.reduce` o el store
 * `reduce`. Solo se desactiva cuando las tres están inactivas (Req 11.9).
 */
export function esQuieto(fuentes: { condicion: boolean; clase: boolean; store: boolean }): boolean {
  return fuentes.condicion || fuentes.clase || fuentes.store;
}

/**
 * Sin `gsap.matchMedia()` no hay detección fiable de movimiento, así que el
 * estado por defecto es quieto: nada se anima y el fallo queda registrado por
 * quien llama (Req 11.11).
 */
export function esQuietoPorDefecto(entorno: { matchMedia: boolean }): boolean {
  return !entorno.matchMedia;
}

/** Variante de tabla que corresponde al modo: el umbral es `isCompacto`. */
export function varianteFondo(modo: ModoFondo): VarianteFondo {
  return modo.compacto ? "compacto" : "amplio";
}

/**
 * Duración de un ciclo completo del bucle. `tramo` es **un** trayecto: sin
 * `yoyo` el ciclo es el propio tramo y con `yoyo` es la ida más la vuelta.
 */
export function cicloBucle(bucle: BucleFondo): number {
  return bucle.yoyo ? bucle.tramo * 2 : bucle.tramo;
}

/**
 * Comprueba el rango temporal que declara el enunciado para cada objetivo: la
 * foto se mide **por tramo** (12–20 s, Req 1.2) y las overlays **por ciclo
 * completo** (1.2–12 s, Req 2.5).
 */
export function cicloEnRango(bucle: BucleFondo): boolean {
  if (bucle.objetivo === "foto") {
    return bucle.tramo >= RANGO_TRAMO_FOTO.min && bucle.tramo <= RANGO_TRAMO_FOTO.max;
  }

  const ciclo = cicloBucle(bucle);
  return ciclo >= RANGO_CICLO_OVERLAY.min && ciclo <= RANGO_CICLO_OVERLAY.max;
}

/**
 * Bucle del plan que corresponde a un objetivo, o `null` si el modo no lo trae.
 * Es la puerta por la que `fondo.ts` recoge su tabla ya resuelta: en compacto la
 * EQ no está en `buclesOverlay` y en `Modo_Quieto` la lista está vacía, así que
 * la ausencia del bucle es lo que impide que su timeline exista (Req 11.2, 12.2).
 */
export function bucleDe(
  bucles: readonly BucleFondo[],
  objetivo: ObjetivoFondo,
): BucleFondo | null {
  for (const bucle of bucles) {
    if (bucle.objetivo === objetivo) return bucle;
  }

  return null;
}

/**
 * Valor de `filter` de un tramo de bucle, ya formateado como función CSS:
 * `blur(1.5px)`, `brightness(1.08)`. Vive aquí y no en `fondo.ts` para que
 * ninguna cifra ni ninguna unidad de la coreografía se escriba en el módulo del
 * DOM (Req 12.7).
 */
export function cadenaFiltro(filtro: FiltroBucle, valor: number): string {
  return `${filtro.funcion}(${valor}${filtro.unidad})`;
}

/**
 * Tramo de `filter` con el que `Capa_Foto` escribe su brillo en el scrub: sus
 * extremos son los del tramo A de `keyframesFondo` (1.00 → 0.86) y `brightness`
 * es adimensional. De él solo se usan la función CSS y la unidad, porque el valor
 * concreto llega del keyframe que se esté traduciendo (Req 5.3).
 */
const FILTRO_BRILLO_FOTO: FiltroBucle = {
  funcion: "brightness",
  desde: 1,
  hasta: BRILLO_FOTO_ATENUADO,
  unidad: "",
} as const;

/**
 * Valor de `filter` del canal de brillo de `Capa_Foto`: `brightness(0.93)`. Vive
 * aquí por la misma razón que `cadenaFiltro`: ni el nombre de la función CSS ni
 * su unidad se escriben en el módulo del DOM (Req 12.7).
 */
export function cadenaBrillo(valor: number): string {
  return cadenaFiltro(FILTRO_BRILLO_FOTO, valor);
}

/**
 * Valor de una propiedad de `transform` expresada en porcentaje de la caja del
 * propio nodo, como pide la onda (`x ±2.5 %`, Req 2.5).
 */
export function enPorcentaje(valor: number): string {
  return `${valor}%`;
}

/**
 * Diferencias por pareja de los desfases de arranque, en valor absoluto. Todas
 * deben caer en `RANGO_DIFERENCIA_DESFASE` para que los bucles overlay nunca
 * latan al unísono (Req 2.6).
 */
export function diferenciasDesfase(bucles: readonly BucleFondo[]): readonly number[] {
  const diferencias: number[] = [];

  for (let i = 0; i < bucles.length; i += 1) {
    for (let j = i + 1; j < bucles.length; j += 1) {
      diferencias.push(Math.abs(bucles[i].desfase - bucles[j].desfase));
    }
  }

  return diferencias;
}

/** Bucles overlay del modo: 3 en amplio y 2 (onda y halo) en compacto (Req 12.2). */
function buclesOverlayDe(modo: ModoFondo): readonly BucleFondo[] {
  if (modo.quieto) return SIN_BUCLES;

  const variante = varianteFondo(modo);
  const candidatos: readonly (BucleFondo | null)[] = [
    BUCLE_ONDA[variante],
    BUCLE_EQ[variante],
    BUCLE_HALO[variante],
  ];

  return candidatos.filter((bucle): bucle is BucleFondo => bucle !== null);
}

/**
 * El parallax de puntero pide las tres condiciones a la vez: entorno con
 * `Puntero_Fino`, viewport no compacto y movimiento permitido (Req 4.4, 4.5,
 * 11.2, 12.3). Falso ⇒ `fondo.ts` no registra ni el listener.
 */
export function parallaxActivo(modo: ModoFondo): boolean {
  return modo.punteroFino && !modo.compacto && !modo.quieto;
}

/**
 * Qué se monta para un modo dado. En `Modo_Quieto` todo queda a `null` / `[]` /
 * `false`: sin entrada, sin bucles, sin ecos animados, sin parallax y sin
 * coreografía de scroll, de modo que `Capa_Foto` y `Capas_Overlay` presentan su
 * estado final con cero tweens (Req 1.8, 11.1, 11.2). Con movimiento hay
 * exactamente un bucle sobre la foto (Req 13.5) y los bucles overlay del modo.
 *
 * `topeOverlay` viaja siempre en el plan, también en quieto: la `opacity` de las
 * overlays es fija en esa rama, pero sigue siendo el mismo techo (Req 2.7, 2.12).
 *
 * `willChange` es verdadero solo cuando hay bucle vivo sobre la foto, porque
 * `will-change: transform` se aplica mientras la respiración idle existe y se
 * retira al revertir (Req 1.5, 1.6, 11.1).
 *
 * `ecos` es el calendario mínimo garantizado: el número real de elementos de
 * `Ecos_Esquina` lo conoce el DOM, así que `fondo.ts` recalcula el calendario
 * con `calendarioEcos(n, modo)` sobre los nodos resueltos. Sin DOM el plan solo
 * puede afirmar lo invariable: que hay un primer paso, que es el kicker y que
 * arranca en 0 (Req 3.2, 3.4).
 */
export function planFondo(modo: ModoFondo): PlanFondo {
  const tope = topeOverlay(modo.soporteMezcla);

  if (modo.quieto) {
    return {
      entrada: null,
      bucleFoto: null,
      buclesOverlay: SIN_BUCLES,
      ecos: null,
      parallax: false,
      scrub: false,
      willChange: false,
      topeOverlay: tope,
    };
  }

  const variante = varianteFondo(modo);
  const bucleFoto = IDLE_FOTO[variante];

  return {
    entrada: ENTRADA_FOTO[variante],
    bucleFoto,
    buclesOverlay: buclesOverlayDe(modo),
    ecos: calendarioEcos(1, modo),
    parallax: parallaxActivo(modo),
    scrub: true,
    willChange: bucleFoto !== null,
    topeOverlay: tope,
  };
}

/**
 * `Registro_GSAP` debe entregar la instancia con ScrollTrigger **y** Flip. Si
 * falta cualquiera de los dos, `fondo.ts` no crea tweens ni timelines y deja las
 * capas en su estado estático sin propagar error (Req 14.1, 14.10).
 */
export function capacidadesSuficientes(caps: { scrollTrigger: boolean; flip: boolean }): boolean {
  return caps.scrollTrigger && caps.flip;
}

/* ------------------------------------------------------------------------- *
 * Calendario de los ecos
 *
 * `Ecos_Esquina` entra en cascada: `opacity 0 → 1` y `y 12 → 0`, 0.6 s por
 * elemento, paso 0.09 s en orden de documento empezando por `.home__kicker`, con
 * una duración total de la secuencia ≤ 1.0 s (Req 3.1, 3.2). El número real de
 * elementos lo conoce el DOM, así que `calendarioEcos(n, modo)` es la función
 * pura que traduce ese recuento en instantes de arranque, y `fondo.ts` solo la
 * consume. `.home__fragmentos` nunca es objetivo: es el contenedor, y su
 * desaparición durante el scroll pertenece a `Orbita_Home` (Req 3.3).
 * ------------------------------------------------------------------------- */

/** Techo de la secuencia completa de ecos, en segundos (Req 3.2). */
export const TOTAL_ECOS = ENTRADA_ECOS.total;

/**
 * Ventana disponible para escalonar los arranques: el último eco debe empezar
 * como muy tarde en `total - duracion` para que la secuencia entera quepa en
 * 1.0 s (0.4 s con la tabla actual, Req 3.2).
 */
export const VENTANA_ECOS = ENTRADA_ECOS.total - ENTRADA_ECOS.duracion;

/**
 * Paso mínimo al que se puede comprimir la cascada. Por debajo de 0.01 s la
 * cascada dejaría de leerse como tal y los instantes empezarían a colisionar en
 * coma flotante, así que este suelo es también la garantía de que los `inicio`
 * son estrictamente crecientes.
 */
export const PASO_MINIMO_ECOS = 0.01;

/**
 * Número máximo de elementos escalonados: `1 + ventana / pasoMínimo`. Con la
 * tabla actual son 41, muy por encima de los 5 elementos que declara
 * `home.copy.json` (kicker + 4 ecos). Si el DOM trajera más, los excedentes
 * quedan fuera del calendario y `fondo.ts` los deja en su estado final.
 */
export const MAX_PASOS_ECOS = Math.round(VENTANA_ECOS / PASO_MINIMO_ECOS) + 1;

/**
 * Número de elementos que reciben paso propio para un recuento `n` y un modo.
 * En `Modo_Compacto` la cascada se reduce al kicker (Req 3.4); en amplio se
 * escalona todo lo que quepa en `MAX_PASOS_ECOS`.
 */
export function cantidadEcos(n: number, modo: ModoFondo): number {
  if (!Number.isFinite(n)) return 0;

  const enteros = Math.floor(n);
  if (enteros <= 0) return 0;
  if (modo.compacto) return 1;

  return Math.min(enteros, MAX_PASOS_ECOS);
}

/**
 * Paso efectivo de la cascada para `cantidad` elementos.
 *
 * **Regla de compresión.** El paso nominal es 0.09 s (Req 3.2). Como cada
 * elemento dura 0.6 s y la secuencia entera no puede pasar de 1.0 s, el último
 * arranque debe caber en `VENTANA_ECOS = 0.4 s`, lo que deja sitio para 5
 * elementos con el paso nominal (`4 × 0.09 + 0.6 = 0.96 s`). A partir de 6 el
 * paso se comprime a `VENTANA_ECOS / (cantidad - 1)`, que reparte los arranques
 * por igual dentro de la ventana: la cascada se acelera pero mantiene el orden
 * estricto y el techo de 1.0 s. Mientras `cantidad ≤ 5` el valor devuelto es
 * exactamente 0.09 s.
 */
export function pasoEcos(cantidad: number): number {
  if (cantidad <= 1) return ENTRADA_ECOS.paso;

  const reparto = VENTANA_ECOS / (cantidad - 1);
  return reparto < ENTRADA_ECOS.paso ? reparto : ENTRADA_ECOS.paso;
}

/**
 * Selectores que la cascada puede animar, en orden de documento. Nunca incluye
 * `.home__fragmentos`: ese contenedor lo gobierna `Orbita_Home` (Req 3.3, 3.4).
 */
export function objetivosEcos(modo: ModoFondo): readonly string[] {
  return modo.compacto ? [SELECTOR_KICKER] : [SELECTOR_KICKER, SELECTOR_ECO];
}

/**
 * Calendario de la entrada escalonada de `Ecos_Esquina` para `n` elementos
 * presentes en el DOM.
 *
 * - `null` si no hay ningún elemento, de modo que `fondo.ts` omita la timeline
 *   sin avisar al visitante (Req 3.8).
 * - El primer paso es siempre `.home__kicker` y arranca en 0; los siguientes son
 *   `.home__eco` (Req 3.2).
 * - En `Modo_Compacto` el calendario tiene longitud 1: solo el kicker, sin
 *   `stagger` (Req 3.4).
 * - `inicio` es estrictamente creciente y `max(inicio) + duracion ≤ 1.0`
 *   (Req 3.2), con el paso comprimido según la regla de `pasoEcos`.
 * - `corte` es el plazo del corte por scroll anticipado, ≤ 0.2 s (Req 3.7).
 */
export function calendarioEcos(n: number, modo: ModoFondo): CalendarioEcos | null {
  const cantidad = cantidadEcos(n, modo);
  if (cantidad === 0) return null;

  const paso = pasoEcos(cantidad);
  const pasos: PasoEco[] = [];

  for (let i = 0; i < cantidad; i += 1) {
    const bruto = i * paso;

    pasos.push({
      selector: i === 0 ? SELECTOR_KICKER : SELECTOR_ECO,
      // El techo de la ventana absorbe el error de coma flotante del reparto:
      // solo puede recortar el último arranque, así que el orden estricto
      // sobrevive intacto.
      inicio: bruto > VENTANA_ECOS ? VENTANA_ECOS : bruto,
      duracion: ENTRADA_ECOS.duracion,
    });
  }

  return {
    pasos,
    paso,
    ease: ENTRADA_ECOS.ease,
    yDesde: ENTRADA_ECOS.y,
    corte: ENTRADA_ECOS.corte,
  };
}

/* ------------------------------------------------------------------------- *
 * Parallax de puntero
 *
 * El desplazamiento es función pura del punto, de la caja del fondo y del
 * último valor válido: `fondo.ts` solo traduce el evento de puntero a esta
 * llamada y entrega el resultado a los dos `quickTo` (Req 4.1–4.3). Al ser
 * pura, la acotación (Req 4.2), el retorno al centro (Req 4.7) y la tolerancia
 * a eventos degenerados (Req 4.9) se verifican sin DOM.
 * ------------------------------------------------------------------------- */

/** Caja utilizable: rectángulo finito con ancho y alto estrictamente positivos. */
function cajaUtilizable(caja: Caja): boolean {
  return (
    Number.isFinite(caja.izquierda) &&
    Number.isFinite(caja.arriba) &&
    Number.isFinite(caja.ancho) &&
    Number.isFinite(caja.alto) &&
    caja.ancho > 0 &&
    caja.alto > 0
  );
}

/**
 * Posición del puntero respecto al centro del tramo `[inicio, inicio + tamaño]`
 * en el rango `[-1, 1]`: 0 exacto en el centro, -1 en el borde inicial y 1 en el
 * final. Fuera del rectángulo el valor se acota, así que el alcance nunca crece
 * por seguir moviendo el puntero más allá del borde (Req 4.2).
 *
 * La expresión es impar en `coordenada - centro`, de modo que dos puntos
 * simétricos respecto al centro dan exactamente valores opuestos.
 */
function posicionNormalizada(coordenada: number, inicio: number, tamano: number): number {
  const mitad = tamano / 2;
  const normalizada = (coordenada - (inicio + mitad)) / mitad;

  if (normalizada <= -1) return -1;
  if (normalizada >= 1) return 1;
  return normalizada;
}

/**
 * Desplazamiento por parallax para un punto de puntero sobre la caja del fondo:
 * la posición normalizada respecto al centro (`[-1, 1]` en cada eje) por el
 * alcance de 12 px, acotado a `[-12, 12]` en ambos ejes y exactamente `(0, 0)`
 * con el puntero en el centro (Req 4.2).
 *
 * Un punto ausente o con coordenadas no finitas, o una caja degenerada (ancho o
 * alto no positivo, medidas no finitas), devuelven `previo`: el evento se
 * descarta y el último desplazamiento válido sigue en pie, sin reiniciar nada
 * (Req 4.9).
 */
export function desplazamientoParallax(
  punto: PuntoPuntero | null,
  caja: Caja,
  previo: Desplazamiento,
): Desplazamiento {
  if (punto === null) return previo;
  if (!Number.isFinite(punto.x) || !Number.isFinite(punto.y)) return previo;
  if (!cajaUtilizable(caja)) return previo;

  return {
    x: posicionNormalizada(punto.x, caja.izquierda, caja.ancho) * PARALLAX.alcance,
    y: posicionNormalizada(punto.y, caja.arriba, caja.alto) * PARALLAX.alcance,
  };
}

/**
 * Desplazamiento de salida: el centro exacto. Lo usan `pointerleave`, `blur`, el
 * paso a `Modo_Quieto` y la limpieza del contexto para devolver el fondo a
 * `(0, 0)` con el mismo tween corto de `PARALLAX` (Req 4.4–4.8).
 */
export function salidaParallax(): Desplazamiento {
  return { x: 0, y: 0 };
}
