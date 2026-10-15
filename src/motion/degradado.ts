/**
 * Anochecer del cielo: una familia (durazno → magenta → noche) que baja de luz
 * con el recorrido. Los colores salen de `docs/FONDOS/gradientes_1920x1080_COMPLETO`,
 * muestreados de arriba a abajo. No se cargan las imágenes: el cielo sigue siendo
 * el gradiente CSS de `.mundo__bg`, y aquí solo se interpolan sus paradas.
 *
 * La tinta se queda en crema en todo el recorrido, también sobre los cielos claros.
 */

import { ensureGsap } from "./gsap";
import { duracionCielo } from "./cielo.perfiles";

export type Degradado = {
  arriba: string;
  alta: string;
  media: string;
  baja: string;
  suelo: string;
  tinta: string;
  tintaSuave: string;
  tintaMuda: string;
  tintaTitulo: string;
  grano: number;
};

const TINTA: Pick<Degradado, "tinta" | "tintaSuave" | "tintaMuda" | "tintaTitulo"> = {
  tinta: "#fff6ef",
  tintaSuave: "rgba(255, 245, 236, 0.9)",
  tintaMuda: "rgba(255, 246, 239, 0.72)",
  tintaTitulo: "#fff8f1",
};

function degradado(
  arriba: string,
  alta: string,
  media: string,
  baja: string,
  suelo: string,
  grano: number,
): Degradado {
  return { arriba, alta, media, baja, suelo, grano, ...TINTA };
}

/** Un paso por escena, del más claro al más oscuro. */
export const DEGRADADOS: Readonly<Record<string, Degradado>> = {
  home: degradado("#f48ca1", "#eb899f", "#c7709c", "#a74f98", "#a04294", 0.2),
  hook: degradado("#e277ad", "#d86ba9", "#c259a2", "#a5489a", "#913f94", 0.24),
  archivo: degradado("#a677a3", "#9572a9", "#7767ab", "#5959a5", "#48509e", 0.28),
  edicion: degradado("#d64872", "#c54a7d", "#8d4c97", "#4f51a8", "#3554ab", 0.32),
  ipod: degradado("#b33f9a", "#a43b99", "#893493", "#6c2c86", "#5b277b", 0.36),
  creacion: degradado("#382565", "#502f70", "#8a4980", "#b85e81", "#ca667c", 0.4),
  colectiva: degradado("#2b1a48", "#43244d", "#854252", "#c26454", "#da7555", 0.44),
};

const INICIAL = DEGRADADOS.home;

const estado: Degradado = { ...INICIAL };

function pintar(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--deg-arriba", estado.arriba);
  root.style.setProperty("--deg-alta", estado.alta);
  root.style.setProperty("--deg-media", estado.media);
  root.style.setProperty("--deg-baja", estado.baja);
  root.style.setProperty("--deg-suelo", estado.suelo);
  root.style.setProperty("--ink", estado.tinta);
  root.style.setProperty("--ink-soft", estado.tintaSuave);
  root.style.setProperty("--ink-mute", estado.tintaMuda);
  root.style.setProperty("--ink-title", estado.tintaTitulo);
  root.style.setProperty("--grano-op", String(estado.grano));
}

export function degradadoDe(nombre: string): Degradado {
  return DEGRADADOS[nombre] ?? INICIAL;
}

/**
 * Lleva el cielo y la tinta al degradado de la escena. La duración coincide con
 * la transición de carácter del cielo (0.9 s, 0.2 s en quieto).
 */
export function aplicarDegradado(nombre: string, quieto: boolean): void {
  const destino = degradadoDe(nombre);
  const gsap = ensureGsap();
  gsap.to(estado, {
    arriba: destino.arriba,
    alta: destino.alta,
    media: destino.media,
    baja: destino.baja,
    suelo: destino.suelo,
    tinta: destino.tinta,
    tintaSuave: destino.tintaSuave,
    tintaMuda: destino.tintaMuda,
    tintaTitulo: destino.tintaTitulo,
    grano: destino.grano,
    duration: duracionCielo({ quieto, compacto: false }),
    ease: "power2.out",
    overwrite: "auto",
    onUpdate: pintar,
  });
}
