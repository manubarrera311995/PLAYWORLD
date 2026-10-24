/**
 * El asterisco del puntero es crema. Sobre un fondo blanco, como la carcasa
 * o la pantalla del iPod, se confunde. Aquí se decide cuándo pintarlo de negro.
 *
 * Solo cuenta una superficie clara y casi neutra (blanco, gris claro, papel).
 * Un rosa o un azul, aunque sean luminosos, dejan el asterisco crema.
 */

export type CapaFondo = {
  backgroundColor: string;
  backgroundImage: string;
  /** Foto, video o canvas: el color no está en el CSS. */
  cubre?: boolean;
};

type Rgb = { r: number; g: number; b: number; a: number };

const ALFA_MIN = 0.85;
const LUMINANCIA_MIN = 0.45;
const CROMA_MAX = 36;

const COLOR =
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b|rgba?\([^)]+\)/g;

function parseHex(hex: string): Rgb | null {
  let h = hex.slice(1);
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
  if (h.length !== 6 && h.length !== 8) return null;
  const n = Number.parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  if (h.length === 6) return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  return { r: (n >> 24) & 255, g: (n >> 16) & 255, b: (n >> 8) & 255, a: (n & 255) / 255 };
}

function parseColor(raw: string): Rgb | null {
  const texto = raw.trim();
  if (texto.toLowerCase() === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  if (texto.startsWith("#")) return parseHex(texto);
  const m = texto.match(
    /rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+)(%))?\s*\)/i,
  );
  if (!m) return null;
  const a = m[4] === undefined ? 1 : m[5] ? Number(m[4]) / 100 : Number(m[4]);
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a };
}

function luminancia({ r, g, b }: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function esClaroNeutro(c: Rgb): boolean {
  const croma = Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
  return luminancia(c) >= LUMINANCIA_MIN && croma <= CROMA_MAX;
}

function coloresDeCapa(capa: CapaFondo): Rgb[] | null {
  const imagen = capa.backgroundImage;
  const paradas =
    imagen && imagen !== "none"
      ? [...imagen.matchAll(COLOR)]
          .map((m) => parseColor(m[0]))
          .filter((c): c is Rgb => c !== null && c.a >= ALFA_MIN)
      : [];
  if (paradas.length > 0) return paradas;
  const solido = parseColor(capa.backgroundColor);
  if (solido && solido.a >= ALFA_MIN) return [solido];
  return null;
}

/** Capas de delante hacia atrás, como las devuelve `elementsFromPoint`. */
export function punteroSobreClaro(capas: readonly CapaFondo[]): boolean {
  for (const capa of capas) {
    if (capa.cubre || /url\(/i.test(capa.backgroundImage)) return false;
    const colores = coloresDeCapa(capa);
    if (!colores) continue;
    return colores.every(esClaroNeutro);
  }
  return false;
}
