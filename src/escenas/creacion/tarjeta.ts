import type { Mancha } from "./boleta";

/** Historia de 1080×1920. La columna de la pantalla, en un archivo. */
export const TARJETA = { ancho: 1080, alto: 1920 } as const;

const MARGEN_X = 84;
const MARGEN_Y = 140;

export type TemaTarjeta = {
  track: string;
  artist: string;
  art: string | null;
};

export type Tarjeta = {
  alias: string;
  proyecto: string;
  anio: number | null;
  alma: string;
  descripcion: string;
  temas: TemaTarjeta[];
  mancha: Mancha;
};

export type Banda = { y: number; alto: number };

export type Caja = { x: number; y: number; ancho: number; alto: number };

export type Pieza = { x: number; y: number; ancho: number; alto: number };

/** Dos columnas a sangre. La derecha abre con la pieza alta. */
const MOSAICO = [
  { col: 0, y: 0, alto: 0.38 },
  { col: 1, y: 0, alto: 0.58 },
  { col: 0, y: 0.38, alto: 0.36 },
  { col: 1, y: 0.58, alto: 0.42 },
  { col: 0, y: 0.74, alto: 0.26 },
] as const;

export function collageDe(n: number, caja: Caja): Pieza[] {
  if (n <= 0 || caja.ancho <= 0 || caja.alto <= 0) return [];
  if (n === 5) {
    const mitad = caja.ancho / 2;
    return MOSAICO.map((m) => ({
      x: caja.x + m.col * mitad,
      y: caja.y + m.y * caja.alto,
      ancho: mitad,
      alto: m.alto * caja.alto,
    }));
  }
  const cols = n === 1 ? 1 : 2;
  const filas = Math.ceil(n / cols);
  const ancho = caja.ancho / cols;
  const alto = caja.alto / filas;
  return Array.from({ length: n }, (_, i) => ({
    x: caja.x + (i % cols) * ancho,
    y: caja.y + Math.floor(i / cols) * alto,
    ancho,
    alto,
  }));
}

export function repartirBandas(pesos: number[], desde: number, alto: number): Banda[] {
  if (!pesos.length || alto <= 0) return pesos.map(() => ({ y: desde, alto: 0 }));
  const total = pesos.reduce((a, b) => a + b, 0);
  if (total <= 0) {
    const cada = alto / pesos.length;
    return pesos.map((_, i) => ({ y: desde + cada * i, alto: cada }));
  }
  let y = desde;
  return pesos.map((peso) => {
    const h = (peso / total) * alto;
    const banda = { y, alto: h };
    y += h;
    return banda;
  });
}

/** 0° apunta arriba, como un linear-gradient de CSS. */
export function extremosDegradado(
  grados: number,
  ancho: number,
  alto: number,
): { x0: number; y0: number; x1: number; y1: number } {
  const rad = ((grados % 360) * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const medio = (Math.abs(ancho * dx) + Math.abs(alto * dy)) / 2;
  const cx = ancho / 2;
  const cy = alto / 2;
  return {
    x0: cx - dx * medio,
    y0: cy - dy * medio,
    x1: cx + dx * medio,
    y1: cy + dy * medio,
  };
}

export function envolver(texto: string, maxLineas: number, cabe: (linea: string) => boolean): string[] {
  const palabras = texto.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!palabras.length || maxLineas < 1) return [];

  const lineas: string[] = [];
  let i = 0;
  while (i < palabras.length && lineas.length < maxLineas) {
    const esUltima = lineas.length === maxLineas - 1;
    let linea = "";
    while (i < palabras.length) {
      const pieza = linea ? `${linea} ${palabras[i]}` : palabras[i];
      if (!cabe(pieza)) break;
      linea = pieza;
      i += 1;
    }
    if (!linea) {
      linea = conElipsis(palabras[i] ?? "", cabe);
      i += 1;
    } else if (esUltima && i < palabras.length) {
      linea = conElipsis(linea, cabe);
    }
    lineas.push(linea);
  }
  return lineas;
}

function conElipsis(linea: string, cabe: (s: string) => boolean): string {
  let corte = linea.trimEnd();
  if (cabe(`${corte}…`)) return `${corte}…`;
  while (corte.length > 0 && !cabe(`${corte}…`)) corte = corte.slice(0, -1).trimEnd();
  return corte ? `${corte}…` : "…";
}

export function nombreArchivo(alias: string): string {
  const base = alias
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `playworld-${base || "alma"}.png`;
}

function fuente(
  ctx: CanvasRenderingContext2D,
  peso: number,
  px: number,
  familia: string,
  tracking = "0px",
): void {
  ctx.font = `${peso} ${px}px ${familia}`;
  ctx.letterSpacing = tracking;
}

function pintarFondo(ctx: CanvasRenderingContext2D, mancha: Mancha, ancho: number, alto: number): void {
  const { x0, y0, x1, y1 } = extremosDegradado(mancha.angulo ?? 180, ancho, alto);
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  const paradas = mancha.paradas?.length
    ? mancha.paradas
    : [
        { color: "#3a1658", en: 0 },
        { color: "#e0086a", en: 100 },
      ];
  for (const parada of paradas) grad.addColorStop(Math.max(0, Math.min(1, parada.en / 100)), parada.color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, ancho, alto);
}

function pxQueCabe(
  ctx: CanvasRenderingContext2D,
  texto: string,
  ancho: number,
  max: number,
  min: number,
): number {
  let px = max;
  while (px > min) {
    fuente(ctx, 400, px, "Outfit", "-0.03em");
    if (ctx.measureText(texto).width <= ancho) return px;
    px -= 2;
  }
  return min;
}

function pintarCabeza(
  ctx: CanvasRenderingContext2D,
  tarjeta: Tarjeta,
  x: number,
  ancho: number,
  tinta: string,
): number {
  let y = MARGEN_Y;
  ctx.fillStyle = tinta;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  fuente(ctx, 500, 26, '"DM Sans"', "0.42em");
  ctx.fillText(tarjeta.proyecto, x, y);
  if (tarjeta.anio != null) {
    const anio = String(tarjeta.anio);
    const tracking = 26 * 0.42;
    const anchoAnio = Math.max(0, ctx.measureText(anio).width - tracking);
    ctx.fillText(anio, x + ancho - anchoAnio, y);
  }
  y += 64;
  const alias = tarjeta.alias.trim();
  if (!alias) return y + 12;
  const px = pxQueCabe(ctx, alias, ancho, 118, 64);
  fuente(ctx, 400, px, "Outfit", "-0.03em");
  ctx.textBaseline = "alphabetic";
  const medida = ctx.measureText(alias);
  const sube = medida.actualBoundingBoxAscent || px * 0.82;
  const baja = medida.actualBoundingBoxDescent || px * 0.2;
  ctx.fillText(alias, x, y + sube);
  return y + sube + baja + 56;
}

function pintarDescripcion(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  ancho: number,
  y: number,
  tinta: string,
): number {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (!limpio) return y;
  const px = 26;
  const lh = 36;
  fuente(ctx, 400, px, '"DM Sans"');
  const lineas = envolver(limpio, 6, (s) => ctx.measureText(s).width <= ancho);
  ctx.fillStyle = tinta;
  ctx.globalAlpha = 0.92;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  lineas.forEach((linea, i) => ctx.fillText(linea, x, y + i * lh));
  ctx.globalAlpha = 1;
  return y + lineas.length * lh + 48;
}

function pintarRecorte(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  pieza: Pieza,
): void {
  if (pieza.ancho < 2 || pieza.alto < 2) return;
  if (!img || !img.naturalWidth) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#000";
    ctx.fillRect(pieza.x, pieza.y, pieza.ancho, pieza.alto);
    ctx.restore();
    return;
  }
  const escala = Math.max(pieza.ancho / img.naturalWidth, pieza.alto / img.naturalHeight);
  const sw = pieza.ancho / escala;
  const sh = pieza.alto / escala;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, pieza.x, pieza.y, pieza.ancho, pieza.alto);
}

function pintarEtiqueta(
  ctx: CanvasRenderingContext2D,
  tema: TemaTarjeta,
  pieza: Pieza,
  arriba: boolean,
): void {
  const banda = Math.min(78, pieza.alto * 0.34);
  const y0 = arriba ? pieza.y : pieza.y + pieza.alto - banda;
  const velo = ctx.createLinearGradient(pieza.x, y0, pieza.x, y0 + banda);
  velo.addColorStop(arriba ? 0 : 1, "rgba(8, 4, 12, 0.78)");
  velo.addColorStop(arriba ? 1 : 0, "rgba(8, 4, 12, 0)");
  ctx.fillStyle = velo;
  ctx.fillRect(pieza.x, y0, pieza.ancho, banda);

  const tituloPx = Math.max(14, Math.round(Math.min(28, pieza.ancho * 0.07)));
  const artistaPx = Math.max(12, Math.round(tituloPx * 0.72));
  const yTitulo = arriba ? pieza.y + 16 : pieza.y + pieza.alto - 18 - artistaPx - tituloPx;
  const yArtista = yTitulo + tituloPx + 4;
  ctx.save();
  ctx.beginPath();
  ctx.rect(pieza.x + 12, y0, Math.max(0, pieza.ancho - 24), banda);
  ctx.clip();
  ctx.fillStyle = "#fff6ef";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  fuente(ctx, 500, tituloPx, '"DM Sans"');
  const titulo = envolver(tema.track, 1, (s) => ctx.measureText(s).width <= pieza.ancho - 24);
  ctx.fillText(titulo[0] ?? "", pieza.x + 14, yTitulo);
  fuente(ctx, 400, artistaPx, '"DM Sans"');
  ctx.globalAlpha = 0.84;
  const artista = envolver(tema.artist, 1, (s) => ctx.measureText(s).width <= pieza.ancho - 24);
  if (artista[0]) ctx.fillText(artista[0], pieza.x + 14, yArtista);
  ctx.restore();
}

function pintarCollage(
  ctx: CanvasRenderingContext2D,
  tarjeta: Tarjeta,
  portadas: (HTMLImageElement | null)[],
  caja: Caja,
): void {
  const temas = tarjeta.temas;
  if (!temas.length) return;
  const piezas = collageDe(temas.length, caja);
  temas.forEach((tema, i) => {
    const pieza = piezas[i];
    if (!pieza) return;
    pintarRecorte(ctx, portadas[i] ?? null, pieza);
    const tocaPiso = pieza.y + pieza.alto >= caja.y + caja.alto - 2;
    pintarEtiqueta(ctx, tema, pieza, tocaPiso);
  });
}

function pintarVelos(ctx: CanvasRenderingContext2D, ancho: number, alto: number): void {
  const arriba = ctx.createLinearGradient(0, 0, 0, alto * 0.46);
  arriba.addColorStop(0, "rgba(8, 4, 12, 0.78)");
  arriba.addColorStop(1, "rgba(8, 4, 12, 0)");
  ctx.fillStyle = arriba;
  ctx.fillRect(0, 0, ancho, alto * 0.46);
  const abajo = ctx.createLinearGradient(0, alto * 0.82, 0, alto);
  abajo.addColorStop(0, "rgba(8, 4, 12, 0)");
  abajo.addColorStop(1, "rgba(8, 4, 12, 0.72)");
  ctx.fillStyle = abajo;
  ctx.fillRect(0, alto * 0.82, ancho, alto * 0.18);
}

function pintarSello(
  ctx: CanvasRenderingContext2D,
  alma: string,
  x: number,
  ancho: number,
  piso: number,
  tinta: string,
): number {
  const px = 30;
  const lh = 40;
  fuente(ctx, 500, px, '"DM Sans"', "0.16em");
  const lineas = envolver(alma.toLocaleUpperCase("es"), 2, (s) => ctx.measureText(s).width <= ancho);
  const alto = Math.max(lineas.length, 1) * lh;
  const y = piso - alto;
  ctx.fillStyle = tinta;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.globalAlpha = 1;
  lineas.forEach((linea, i) => ctx.fillText(linea, x, y + i * lh));
  return y;
}

export function dibujarTarjeta(
  ctx: CanvasRenderingContext2D,
  tarjeta: Tarjeta,
  portadas: (HTMLImageElement | null)[] = [],
): void {
  const { ancho, alto } = TARJETA;
  const tinta = "#fff6ef";
  pintarFondo(ctx, tarjeta.mancha, ancho, alto);
  pintarCollage(ctx, tarjeta, portadas, { x: 0, y: 0, ancho, alto });
  pintarVelos(ctx, ancho, alto);
  const x = MARGEN_X;
  const anchoTexto = ancho - MARGEN_X * 2;
  const cabeza = pintarCabeza(ctx, tarjeta, x, anchoTexto, tinta);
  pintarDescripcion(ctx, tarjeta.descripcion, x, anchoTexto, cabeza, tinta);
  pintarSello(ctx, tarjeta.alma, x, anchoTexto, alto - 72, tinta);
}

function cargarImagen(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const fin = (valor: HTMLImageElement | null) => {
      clearTimeout(timer);
      resolve(valor);
    };
    const timer = setTimeout(() => fin(null), 4000);
    img.crossOrigin = "anonymous";
    img.onload = () => fin(img.naturalWidth ? img : null);
    img.onerror = () => fin(null);
    img.src = url;
  });
}

async function fuentesListas(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all([
    document.fonts.load("400 118px Outfit"),
    document.fonts.load('400 42px "DM Sans"'),
    document.fonts.load('500 30px "DM Sans"'),
  ]).catch(() => undefined);
}

export async function descargarTarjeta(tarjeta: Tarjeta): Promise<void> {
  await fuentesListas();
  const portadas = await Promise.all(tarjeta.temas.map((tema) => (tema.art ? cargarImagen(tema.art) : Promise.resolve(null))));
  const canvas = document.createElement("canvas");
  canvas.width = TARJETA.ancho;
  canvas.height = TARJETA.alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  dibujarTarjeta(ctx, tarjeta, portadas);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo(tarjeta.alias);
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
