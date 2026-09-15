/**
 * Perfiles del cielo global (`.mundo__bg` + `.mundo__veil`) en ambos modos de
 * viewport, más la evaluación de sus bucles.
 *
 * Módulo puro: no toca el DOM, no importa GSAP y no crea temporizadores. Es la
 * única fuente de los valores de reposo, los bucles y los rangos de seguridad
 * que `src/motion/cielo.ts` traduce a tweens.
 *
 * Requirements: 8.8, 9.1, 9.2, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 11.4,
 * 11.5, 12.6, 14.8
 */

import type { RutaParsed } from "../escenas/director/router";
import type { Paleta } from "../datos/tipos";
import { dnaAPaleta } from "../datos/color";

export type NombreEscena = RutaParsed["name"];

/** Easings permitidos en los bucles de fondo (Req 8.5). */
export type EaseSuave =
  | "none"
  | "power1.in"
  | "power1.out"
  | "power1.inOut"
  | "sine.in"
  | "sine.out"
  | "sine.inOut";

/**
 * Un bucle por escena como máximo (Req 13.6). `respiracion` mueve `opacity` de
 * `.mundo__bg`, `deriva` mueve `x`/`y` en porcentaje del viewport y `sintonia`
 * encadena dos paletas por `aplicarPaleta` sin escribir color directamente.
 */
export type BucleCielo =
  | { tipo: "respiracion"; amplitud: number; ciclo: number; ease: EaseSuave }
  | { tipo: "deriva"; amplitudPct: number; ciclo: number; ease: EaseSuave }
  | {
      tipo: "sintonia";
      tramo: number;
      factor: number;
      ease: EaseSuave;
      paletas: readonly [Paleta, Paleta];
    };

export type PerfilCielo = {
  veloOpacidad: number; // .mundo__veil opacity
  veloEscala: number; // .mundo__veil scale
  cieloOpacidad: number; // .mundo__bg opacity
  cieloBrillo: number; // .mundo__bg filter: brightness()
  cieloEscala: number; // .mundo__bg scale (colchón para la deriva)
  bucle: BucleCielo | null;
  paletaReposo: Paleta | null; // null ⇒ la escena es dueña del color
};

export type ModoCielo = { quieto: boolean; compacto: boolean };

export type ValoresCielo = Pick<
  PerfilCielo,
  "veloOpacidad" | "veloEscala" | "cieloOpacidad" | "cieloBrillo"
> & { derivaX: number; derivaY: number };

export type RangoCielo = { min: number; max: number };

/** Orden del recorrido; los pares consecutivos son los que exige Req 9.8. */
export const RECORRIDO: readonly NombreEscena[] = [
  "home",
  "hook",
  "archivo",
  "edicion",
  "ipod",
  "creacion",
  "colectiva",
] as const;

/**
 * Estado base del cielo (Req 9.7): velo a 0.70 sin escala, cielo opaco y sin
 * brillo añadido, cero bucles. Es también la respuesta a un nombre de escena
 * desconocido (Req 8.8, 9.11).
 */
export const BASE_CIELO: PerfilCielo = {
  veloOpacidad: 0.7,
  veloEscala: 1,
  cieloOpacidad: 1,
  cieloBrillo: 1,
  cieloEscala: 1,
  bucle: null,
  paletaReposo: null,
};

/**
 * Los dos extremos de la sintonía de `archivo` se derivan de `dnaAPaleta`
 * (Req 9.2, 10.5, 10.7): el módulo nunca declara colores literales. Los dos
 * puntos de DNA están suficientemente separados en oscuridad y energía para
 * que `c1` y `c2` difieran por canal de forma perceptible.
 */
const DNA_SINTONIA_FRIA = { oscuridad: 15, energy: 15, nostalgia: 35 };
const DNA_SINTONIA_CALIDA = { oscuridad: 85, energy: 90, nostalgia: 65 };

const PALETAS_SINTONIA: readonly [Paleta, Paleta] = [
  dnaAPaleta(DNA_SINTONIA_FRIA),
  dnaAPaleta(DNA_SINTONIA_CALIDA),
];

/**
 * Valores de reposo y bucle de cada escena en modo amplio (≥ 768px).
 * `home` coincide con `BASE_CIELO` porque allí manda `Fondo_Home` (Req 9.7).
 */
export const PERFILES_AMPLIO: Readonly<Record<NombreEscena, PerfilCielo>> = {
  home: BASE_CIELO,
  hook: {
    veloOpacidad: 0.94,
    veloEscala: 1,
    cieloOpacidad: 1,
    cieloBrillo: 1,
    cieloEscala: 1,
    bucle: { tipo: "respiracion", amplitud: 0.04, ciclo: 17, ease: "sine.inOut" },
    paletaReposo: null,
  },
  archivo: {
    veloOpacidad: 0.78,
    veloEscala: 1,
    cieloOpacidad: 0.97,
    cieloBrillo: 1,
    cieloEscala: 1,
    bucle: {
      tipo: "sintonia",
      tramo: 9,
      factor: 1,
      ease: "sine.inOut",
      paletas: PALETAS_SINTONIA,
    },
    paletaReposo: PALETAS_SINTONIA[0],
  },
  edicion: {
    veloOpacidad: 0.62,
    veloEscala: 1,
    cieloOpacidad: 1,
    cieloBrillo: 1,
    cieloEscala: 1,
    bucle: null,
    paletaReposo: null,
  },
  ipod: {
    veloOpacidad: 0.56,
    veloEscala: 0.9,
    cieloOpacidad: 1,
    cieloBrillo: 1,
    cieloEscala: 1,
    bucle: null,
    paletaReposo: null,
  },
  creacion: {
    veloOpacidad: 0.42,
    veloEscala: 1,
    cieloOpacidad: 1,
    cieloBrillo: 1.09,
    cieloEscala: 1,
    bucle: null,
    paletaReposo: null,
  },
  colectiva: {
    veloOpacidad: 0.66,
    veloEscala: 1,
    cieloOpacidad: 1,
    cieloBrillo: 1,
    // Colchón para que la deriva de ±2 % no descubra el borde de `.mundo__bg`.
    cieloEscala: 1.06,
    bucle: { tipo: "deriva", amplitudPct: 2, ciclo: 36, ease: "sine.inOut" },
    paletaReposo: null,
  },
};

/**
 * Modo compacto (≤ 767px): **mismos valores de reposo** que el modo amplio y el
 * **mismo tipo** de bucle, con la amplitud entre el 60 % y el 75 % de la de
 * escritorio y el ciclo siempre mayor o igual (Req 12.6). Al conservar los
 * valores de reposo, el contraste entre escenas consecutivas de Req 9.8 se
 * mantiene idéntico en los dos modos.
 *
 * - `hook`: amplitud 0.03 (75 % de 0.04), ciclo 20 s ≥ 17 s, dentro de 14–20 s.
 * - `archivo`: factor 0.6 (60 % de 1), tramo 12 s ≥ 9 s, dentro de 6–12 s.
 * - `colectiva`: ±1.2 % (60 % de ±2 %), ciclo 44 s ≥ 36 s, dentro de 24–48 s.
 */
export const PERFILES_COMPACTO: Readonly<Record<NombreEscena, PerfilCielo>> = {
  home: BASE_CIELO,
  hook: {
    ...PERFILES_AMPLIO.hook,
    bucle: { tipo: "respiracion", amplitud: 0.03, ciclo: 20, ease: "sine.inOut" },
  },
  archivo: {
    ...PERFILES_AMPLIO.archivo,
    bucle: {
      tipo: "sintonia",
      tramo: 12,
      factor: 0.6,
      ease: "sine.inOut",
      paletas: PALETAS_SINTONIA,
    },
  },
  edicion: PERFILES_AMPLIO.edicion,
  ipod: PERFILES_AMPLIO.ipod,
  creacion: PERFILES_AMPLIO.creacion,
  colectiva: {
    ...PERFILES_AMPLIO.colectiva,
    bucle: { tipo: "deriva", amplitudPct: 1.2, ciclo: 44, ease: "sine.inOut" },
  },
};

/** Rangos de seguridad válidos en todo instante de cualquier bucle (Req 9.10). */
export const RANGOS_CIELO: Readonly<
  Record<"veloOpacidad" | "veloEscala" | "cieloOpacidad" | "cieloBrillo", RangoCielo>
> = {
  veloOpacidad: { min: 0.3, max: 1 },
  veloEscala: { min: 0.85, max: 1.05 },
  cieloOpacidad: { min: 0.9, max: 1 },
  cieloBrillo: { min: 0.95, max: 1.12 },
};

/**
 * Los dos únicos objetivos que el cielo puede animar (Req 8.3, 10.4): ni
 * `.grano` ni ningún `canvas` aparecen aquí.
 */
export const OBJETIVOS_CIELO: readonly [".mundo__bg", ".mundo__veil"] = [
  ".mundo__bg",
  ".mundo__veil",
];

/** Mínimos de contraste entre escenas consecutivas del recorrido (Req 9.8). */
export const UMBRALES_CONTRASTE: {
  readonly veloOpacidad: 0.05;
  readonly veloEscala: 0.04;
  readonly cieloBrillo: 0.05;
} = { veloOpacidad: 0.05, veloEscala: 0.04, cieloBrillo: 0.05 };

/** Duración de la transición de carácter: 0.9 s con movimiento (Req 8.4, 9.9), ≤ 0.2 s en quieto (Req 11.4). */
const DURACION_CIELO = 0.9;
const DURACION_CIELO_QUIETO = 0.2;

export function esEscenaConocida(nombre: string): nombre is NombreEscena {
  return (RECORRIDO as readonly string[]).includes(nombre);
}

/**
 * Total por construcción: un nombre fuera del recorrido devuelve `BASE_CIELO`
 * sin bucle (Req 8.8, 9.11) y en quieto ninguna escena declara bucle (Req 11.5).
 * El modo elige la tabla; nunca hay más de un bucle por escena (Req 13.6).
 */
export function perfilDe(nombre: string, modo: ModoCielo): PerfilCielo {
  if (!esEscenaConocida(nombre)) return BASE_CIELO;
  const perfil = modo.compacto ? PERFILES_COMPACTO[nombre] : PERFILES_AMPLIO[nombre];
  if (modo.quieto) return { ...perfil, bucle: null };
  return perfil;
}

export function duracionCielo(modo: ModoCielo): number {
  return modo.quieto ? DURACION_CIELO_QUIETO : DURACION_CIELO;
}

/** Tope duro de la deriva: 2 % del ancho y del alto del viewport (Req 9.6). */
const DERIVA_MAX_PCT = 2;

/**
 * Recorrido de `opacity` de `.mundo__bg` que la sintonía de `archivo` se permite
 * a cada lado de su valor de reposo. Con reposo 0.97 y factor 1 el bucle queda
 * en `[0.94, 1.00]`, que es exactamente lo que pide Req 9.2.
 */
const AMPLITUD_SINTONIA = 0.03;

/** Margen para que las comparaciones con umbral no fallen por coma flotante. */
const EPSILON = 1e-9;

function acotar(valor: number, rango: RangoCielo): number {
  if (!Number.isFinite(valor)) return rango.min;
  return Math.min(rango.max, Math.max(rango.min, valor));
}

/** Normaliza cualquier instante a la fase `[0, 1)` del ciclo. */
function fase(t: number): number {
  if (!Number.isFinite(t)) return 0;
  const resto = t % 1;
  return resto < 0 ? resto + 1 : resto;
}

/** Vaivén `0 → 1 → 0` en un ciclo: la forma de un `yoyo` con `sine.inOut`. */
function vaiven(t: number): number {
  return (1 - Math.cos(2 * Math.PI * fase(t))) / 2;
}

/** Oscilación con signo `0 → 1 → 0 → -1 → 0`, para los recorridos simétricos. */
function oscilacion(t: number): number {
  return Math.sin(2 * Math.PI * fase(t));
}

/** La amplitud declarada nunca puede pasar del tope duro del 2 % (Req 9.6). */
function amplitudDeriva(amplitudPct: number): number {
  if (!Number.isFinite(amplitudPct) || amplitudPct <= 0) return 0;
  return Math.min(amplitudPct, DERIVA_MAX_PCT);
}

/**
 * Estado del cielo en el instante `t` del ciclo, con `t` expresado en fracciones
 * de ciclo (`0` y `1` son el mismo punto). Función pura y total: cualquier `t`,
 * incluidos los no finitos y los de fuera de `[0, 1]`, cae en la fase
 * equivalente. Las cuatro magnitudes salen acotadas a `RANGOS_CIELO`, así que
 * ningún bucle puede sacar el fondo de sus rangos de seguridad (Req 9.10).
 *
 * `derivaX` y `derivaY` van en porcentaje del viewport y solo los mueve el bucle
 * de deriva, con un cuarto de ciclo de desfase entre ejes para que el recorrido
 * sea elíptico y no diagonal.
 */
export function valoresCieloEn(perfil: PerfilCielo, t: number): ValoresCielo {
  const bucle = perfil.bucle;
  let cieloOpacidad = perfil.cieloOpacidad;
  let derivaX = 0;
  let derivaY = 0;

  if (bucle !== null) {
    if (bucle.tipo === "respiracion") {
      cieloOpacidad = perfil.cieloOpacidad - bucle.amplitud * vaiven(t);
    } else if (bucle.tipo === "sintonia") {
      cieloOpacidad =
        perfil.cieloOpacidad + AMPLITUD_SINTONIA * bucle.factor * oscilacion(t);
    } else {
      const amplitud = amplitudDeriva(bucle.amplitudPct);
      derivaX = amplitud * oscilacion(t);
      derivaY = amplitud * oscilacion(t + 0.25);
    }
  }

  return {
    veloOpacidad: acotar(perfil.veloOpacidad, RANGOS_CIELO.veloOpacidad),
    veloEscala: acotar(perfil.veloEscala, RANGOS_CIELO.veloEscala),
    cieloOpacidad: acotar(cieloOpacidad, RANGOS_CIELO.cieloOpacidad),
    cieloBrillo: acotar(perfil.cieloBrillo, RANGOS_CIELO.cieloBrillo),
    derivaX,
    derivaY,
  };
}

/**
 * Desplazamiento máximo de la deriva en píxeles para un viewport dado, acotado
 * al 2 % de cada eje (Req 9.6). Perfiles sin deriva y viewports degenerados o no
 * finitos devuelven `(0, 0)`, de modo que la función es total.
 */
export function derivaPx(
  perfil: PerfilCielo,
  ancho: number,
  alto: number,
): { x: number; y: number } {
  const bucle = perfil.bucle;
  if (bucle === null || bucle.tipo !== "deriva") return { x: 0, y: 0 };

  const anchoUtil = Number.isFinite(ancho) && ancho > 0 ? ancho : 0;
  const altoUtil = Number.isFinite(alto) && alto > 0 ? alto : 0;
  const fraccion = amplitudDeriva(bucle.amplitudPct) / 100;
  const tope = DERIVA_MAX_PCT / 100;

  return {
    x: Math.min(anchoUtil * fraccion, anchoUtil * tope),
    y: Math.min(altoUtil * fraccion, altoUtil * tope),
  };
}

/**
 * Dos escenas se distinguen por el fondo si alguna de las tres magnitudes de
 * carácter alcanza su umbral (Req 9.8). Basta una: los perfiles del recorrido
 * cumplen al menos un umbral en cada par consecutivo, varios en dos umbrales.
 */
export function contrasteSuficiente(a: PerfilCielo, b: PerfilCielo): boolean {
  const alcanza = (diferencia: number, umbral: number): boolean =>
    Math.abs(diferencia) >= umbral - EPSILON;

  return (
    alcanza(a.veloOpacidad - b.veloOpacidad, UMBRALES_CONTRASTE.veloOpacidad) ||
    alcanza(a.veloEscala - b.veloEscala, UMBRALES_CONTRASTE.veloEscala) ||
    alcanza(a.cieloBrillo - b.cieloBrillo, UMBRALES_CONTRASTE.cieloBrillo)
  );
}
