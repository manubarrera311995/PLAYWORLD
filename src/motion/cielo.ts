/**
 * `Director_Cielo`: la transición de carácter del cielo global y su bucle único.
 *
 * Este módulo es la única parte del cielo que toca el DOM. Resuelve los dos
 * nodos de `Cielo_Global` —`.mundo__bg` y su `.mundo__veil`, declarados en
 * `src/App.svelte` y vestidos por `src/piel/tokens.css`—, pide a
 * `./cielo.perfiles` los valores de reposo de la escena destino y los lleva ahí
 * con dos tweens. El bucle de la escena, si el perfil declara uno, nace en el
 * `onComplete` de esa transición: como máximo uno vivo, y siempre dentro del
 * mismo `gsap.context` (Req 8.5, 9.9, 13.6). Ni una cifra de la coreografía vive
 * aquí: la tabla, los rangos de seguridad y la duración son del módulo puro
 * (Req 9.7, 9.9, 9.10).
 *
 * GSAP llega exclusivamente por `ensureGsap()`, sin registro propio de plugins
 * ni importaciones directas de sus módulos (Req 14.2, 14.12). El color solo se
 * escribe por `aplicarPaleta` (Req 9.2, 10.5, 10.7).
 *
 * El ciclo de vida es el que pide Req 8.6 y 13.4: matar el `gsap.context` de la
 * escena anterior **antes** de crear el nuevo y **sin revertir** sus estilos
 * inline, de modo que los dos tweens arranquen desde los valores actualmente
 * computados y no desde un estado base intermedio. No hay ningún `gsap.set` de
 * reposo por esa misma razón.
 *
 * Requirements: 8.1, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 9.1, 9.2, 9.4, 9.5,
 * 9.6, 9.7, 9.9, 9.10, 9.11, 10.2, 10.5, 10.7, 10.9, 11.4, 11.5, 12.6, 13.4,
 * 13.6, 14.2, 14.8
 */

import { get } from "svelte/store";

import { viewport } from "../estado/viewport";
import { aplicarPaleta } from "../sketches/paleta";
import { ensureGsap } from "./gsap";
import {
  OBJETIVOS_CIELO,
  derivaPx,
  duracionCielo,
  perfilDe,
  valoresCieloEn,
} from "./cielo.perfiles";
import type { BucleCielo, ModoCielo, PerfilCielo, ValoresCielo } from "./cielo.perfiles";

/** Limpieza que devuelve `cambiarCielo`: revierte lo que este módulo aplicó (Req 8.1). */
export type LimpiezaCielo = () => void;

/** Instancia que entrega `Registro_GSAP`. */
type InstanciaGsap = ReturnType<typeof ensureGsap>;

/** `Contexto_GSAP` del cielo, uno por escena viva (Req 13.4, 13.6). */
type ContextoCielo = ReturnType<InstanciaGsap["context"]>;

/** Los dos nodos de `Cielo_Global`; ambos o ninguno (Req 8.9). */
type NodosCielo = { cielo: Element; velo: Element };

/** Vars de un extremo de la transición: solo `transform`, `opacity` y `filter` (Req 8.3). */
type DestinoCielo = { opacity: number; scale: number; filter?: string };

/** Prefijo de los avisos de diagnóstico del cielo. */
const AVISO = "[cielo]";

/** Limpieza sin efecto: la devuelven las guardas que no crean un solo tween. */
const LIMPIEZA_VACIA: LimpiezaCielo = () => undefined;

/** Easing de la transición de carácter, el mismo en los dos modos (Req 8.4, 11.4). */
const EASE_CIELO = "power2.out";

/**
 * Contexto de la escena viva. Es estado de módulo a propósito: `Director_Cielo`
 * gobierna un fondo persistente que sobrevive al montaje y desmontaje de las
 * escenas, así que la referencia con la que cancelar la escena anterior no puede
 * vivir dentro de ninguna de ellas (Req 8.6, 13.4).
 */
let ctxPrevio: ContextoCielo | null = null;

/**
 * `Modo_Compacto` desde el store `viewport`, que ya clasifica el ancho con el
 * mismo umbral de 768px que usa `gsap.matchMedia()` en el resto del repo. Se lee
 * envuelto porque un entorno sin `window` deja el store en su valor de medida por
 * defecto y no debe hacer fallar la transición.
 */
function esCompacto(): boolean {
  try {
    return get(viewport).modo === "compacto";
  } catch {
    return false;
  }
}

/**
 * Resuelve `.mundo__bg` y `.mundo__veil` desde `document`, con los selectores de
 * `OBJETIVOS_CIELO`: la lista blanca del módulo puro es la única fuente de qué
 * puede animar el cielo, de modo que ningún otro nodo —ni el grano p5 ni su
 * canvas— puede entrar por aquí (Req 8.3, 10.2, 10.4).
 *
 * Devuelve `null` si falta cualquiera de los dos, y también si la consulta no se
 * puede hacer (un entorno sin `document`). Quien llama sale entonces sin crear
 * tweens y con una limpieza sin efecto, conservando el último estado aplicado a
 * `Cielo_Global` (Req 8.9).
 */
function resolverNodosCielo(): NodosCielo | null {
  try {
    if (typeof document === "undefined") return null;

    const [selectorCielo, selectorVelo] = OBJETIVOS_CIELO;
    const cielo = document.querySelector(selectorCielo);
    const velo = document.querySelector(selectorVelo);
    if (cielo === null || velo === null) return null;

    return { cielo, velo };
  } catch {
    return null;
  }
}

/** `cieloBrillo` viaja siempre dentro de `filter`, nunca como propiedad propia. */
function cadenaBrillo(valor: number): string {
  return `brightness(${valor})`;
}

/**
 * Destino del velo: `veloOpacidad` → `opacity` y `veloEscala` → `scale`, tal como
 * documenta `PerfilCielo`. Los valores llegan ya acotados a `RANGOS_CIELO` por
 * `valoresCieloEn`, así que la transición no puede sacar el velo de sus rangos de
 * seguridad (Req 9.10).
 */
function destinoVelo(valores: ValoresCielo): DestinoCielo {
  return { opacity: valores.veloOpacidad, scale: valores.veloEscala };
}

/**
 * Destino del cielo: `cieloOpacidad` → `opacity`, `cieloEscala` → `scale` y
 * `cieloBrillo` → `filter: brightness()`. El gradiente sigue siendo el único y el
 * declarado por el CSS: aquí no se escribe `background-image` ni se referencia un
 * archivo, de modo que ninguna escena estrena asset (Req 8.7).
 *
 * `cieloEscala` es el colchón de la deriva y no forma parte de las cuatro
 * magnitudes acotadas, así que se toma del perfil; el resto viene de los valores
 * ya acotados.
 */
function destinoCielo(perfil: PerfilCielo, valores: ValoresCielo): DestinoCielo {
  return {
    opacity: valores.cieloOpacidad,
    scale: perfil.cieloEscala,
    filter: cadenaBrillo(valores.cieloBrillo),
  };
}

/**
 * Tamaño del viewport para la deriva. Si no hay `window` (pruebas en node) el
 * alcance sale a 0 y el bucle no se mueve: no lanza (Req 9.6).
 */
function medidasViewport(): { ancho: number; alto: number } {
  if (typeof window === "undefined") return { ancho: 0, alto: 0 };
  return { ancho: window.innerWidth, alto: window.innerHeight };
}

/**
 * Un único bucle infinito sobre `Cielo_Global`, arrancado al terminar la
 * transición de carácter (Req 8.5, 9.9, 13.6). `perfil.bucle === null` —home,
 * edicion, ipod, creacion, quieto o nombre desconocido— sale sin crear nada:
 * esas escenas se quedan en el reposo que acaba de pintar la transición
 * (Req 9.3, 9.4, 9.5, 9.7, 11.5).
 *
 * Las tres ramas leen cifras de `cielo.perfiles`: respiración de `hook` (opacidad
 * de `.mundo__bg`, amplitud ≤ 0.04, ciclo 17 s), sintonía de `archivo` (paleta
 * por `aplicarPaleta` + opacidad en [0.94, 1.00]) y deriva de `colectiva` (`x`/`y`
 * acotados al 2 % del viewport, colchón `cieloEscala` 1.06). Ease y ciclo salen
 * de la tabla, siempre dentro de la lista suave y de 12–40 s (Req 8.5).
 */
function arrancarBucle(
  gsap: InstanciaGsap,
  nodos: NodosCielo,
  perfil: PerfilCielo,
): void {
  const bucle = perfil.bucle;
  if (bucle === null) return;

  if (bucle.tipo === "respiracion") {
    arrancarRespiracion(gsap, nodos, perfil, bucle);
    return;
  }
  if (bucle.tipo === "deriva") {
    arrancarDeriva(gsap, nodos, perfil, bucle);
    return;
  }
  arrancarSintonia(gsap, nodos, perfil, bucle);
}

/** `hook`: vaivén de `opacity` de `.mundo__bg` alrededor del reposo (Req 9.1). */
function arrancarRespiracion(
  gsap: InstanciaGsap,
  nodos: NodosCielo,
  perfil: PerfilCielo,
  bucle: Extract<BucleCielo, { tipo: "respiracion" }>,
): void {
  const valle = valoresCieloEn(perfil, 0.5);
  gsap.to(nodos.cielo, {
    opacity: valle.cieloOpacidad,
    duration: bucle.ciclo / 2,
    repeat: -1,
    yoyo: true,
    ease: bucle.ease,
  });
}

/**
 * `colectiva`: deriva lenta de `.mundo__bg` en `x`/`y`. El alcance lo calcula
 * `derivaPx`, que ya acota al 2 % del viewport (Req 9.6, 12.6). `y` va al signo
 * contrario para que el recorrido no sea una diagonal pura.
 */
function arrancarDeriva(
  gsap: InstanciaGsap,
  nodos: NodosCielo,
  perfil: PerfilCielo,
  bucle: Extract<BucleCielo, { tipo: "deriva" }>,
): void {
  const { ancho, alto } = medidasViewport();
  const alcance = derivaPx(perfil, ancho, alto);
  gsap.to(nodos.cielo, {
    x: alcance.x,
    y: -alcance.y,
    duration: bucle.ciclo / 2,
    repeat: -1,
    yoyo: true,
    ease: bucle.ease,
  });
}

/**
 * `archivo`: una sola timeline que encadena las dos paletas de `dnaAPaleta` por
 * `aplicarPaleta` y mueve la `opacity` de `.mundo__bg` entre reposo y valle.
 * El color no se escribe nunca a mano (Req 9.2, 10.5, 10.7).
 */
function arrancarSintonia(
  gsap: InstanciaGsap,
  nodos: NodosCielo,
  perfil: PerfilCielo,
  bucle: Extract<BucleCielo, { tipo: "sintonia" }>,
): void {
  const [fria, calida] = bucle.paletas;
  const valle = valoresCieloEn(perfil, 0.5);
  const opciones = { duracion: bucle.tramo, ease: bucle.ease };
  const tl = gsap.timeline({ repeat: -1 });
  tl.call(() => {
    aplicarPaleta(calida, opciones);
  });
  tl.to(nodos.cielo, {
    opacity: valle.cieloOpacidad,
    duration: bucle.tramo,
    ease: bucle.ease,
  }, 0);
  tl.call(() => {
    aplicarPaleta(fria, opciones);
  });
  tl.to(nodos.cielo, {
    opacity: perfil.cieloOpacidad,
    duration: bucle.tramo,
    ease: bucle.ease,
  });
}

/**
 * Lleva `Cielo_Global` al reposo de la escena destino y deja el contexto vivo
 * apuntado en `ctxPrevio`.
 *
 * El orden es el que exige Req 8.6: resolver, calcular, **matar la escena
 * anterior** y solo entonces crear. `kill(false)` no revierte los estilos inline
 * del contexto que muere, así que los dos `gsap.to` parten de los valores
 * actualmente computados —sin `gsap.set` de estado base y sin salto visible—
 * aunque la transición previa no hubiese terminado. Al no quedar ninguna timeline
 * de la escena anterior, tampoco pueden coexistir bucles de dos escenas en ningún
 * instante (Req 13.4, 13.6).
 *
 * `valoresCieloEn(perfil, 0)` es el reposo del perfil: en el instante 0 los tres
 * tipos de bucle valen su punto de partida, así que la misma función que verifica
 * los rangos del bucle entrega aquí el destino de la transición. Un nombre fuera
 * del recorrido devuelve `BASE_CIELO` por `perfilDe`, sin bucle, así que el caso
 * desconocido no necesita rama propia (Req 8.8, 9.11).
 *
 * `Modo_Quieto` tampoco la necesita: `duracionCielo(modo)` da 0.2 s y `perfilDe`
 * ya trae `bucle: null`, de modo que la rama quieta es un tween corto sin estados
 * intermedios visibles y con cero tweens con repetición (Req 11.4, 11.5).
 */
function aplicarCielo(nombre: string, quieto: boolean): LimpiezaCielo {
  const nodos = resolverNodosCielo();
  if (nodos === null) return LIMPIEZA_VACIA;

  const gsap = ensureGsap();
  const modo: ModoCielo = { quieto, compacto: esCompacto() };
  const perfil = perfilDe(nombre, modo);
  const valores = valoresCieloEn(perfil, 0);
  const duracion = duracionCielo(modo);

  ctxPrevio?.kill(false);
  ctxPrevio = null;

  const ctx = gsap.context(() => {
    const transicion = gsap.timeline({
      defaults: { duration: duracion, ease: EASE_CIELO, overwrite: "auto" },
      onComplete: () => {
        arrancarBucle(gsap, nodos, perfil);
      },
    });
    transicion.to(nodos.velo, destinoVelo(valores), 0);
    transicion.to(nodos.cielo, destinoCielo(perfil, valores), 0);

    if (perfil.paletaReposo) {
      aplicarPaleta(perfil.paletaReposo, { duracion, ease: EASE_CIELO });
    }
  });

  ctxPrevio = ctx;

  return () => {
    if (ctxPrevio === ctx) ctxPrevio = null;
    ctx.revert();
  };
}

/**
 * Aplica a `Cielo_Global` el carácter de la escena `nombre` y devuelve la
 * limpieza de su `Contexto_GSAP`.
 *
 * Única función pública del módulo (Req 8.1). `nombre` se acepta como `string` y
 * no como `NombreEscena` porque `perfilDe` es total: cualquier valor fuera del
 * recorrido cae en el estado base sin bucle. `quieto` es el valor vigente de
 * `Modo_Quieto` que le pasa quien invoca, sin volver a consultarlo aquí.
 *
 * La limpieza devuelta revierte los estilos inline que este módulo aplicó a los
 * dos nodos y mata sus tweens, dejando `Cielo_Global` como lo vestía el CSS. Es
 * `ctx.revert()`, no `kill(false)`: al soltar el cielo del todo —y no al pasar de
 * escena— sí queremos que no quede residuo.
 *
 * Nada de lo que ocurra dentro puede interrumpir la navegación: cualquier fallo
 * inesperado se registra y la llamada devuelve una limpieza sin efecto, en vez de
 * propagar la excepción a `Director_Escenas` (Req 8.8, 9.11, 10.9). La ausencia
 * del grano p5 no aparece como caso: este módulo nunca lo busca ni lo toca, así
 * que el cielo se anima igual y no puede crear una instancia sustituta
 * (Req 10.2, 10.9).
 */
export function cambiarCielo(nombre: string, quieto: boolean): LimpiezaCielo {
  try {
    return aplicarCielo(nombre, quieto);
  } catch {
    console.warn(`${AVISO} la transición de "${nombre}" no pudo aplicarse: el cielo queda como estaba.`);
    return LIMPIEZA_VACIA;
  }
}
