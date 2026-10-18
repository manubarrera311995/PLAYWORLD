import type { Mancha } from "./boleta";

/** Historia de 1080×1920. La columna de la pantalla, en un archivo. */
export const TARJETA = { ancho: 1080, alto: 1920 } as const;

const MARGEN_X = 84;
const MARGEN_Y = 140;

export type TemaTarjeta = {
  track: string;
  artist: string;
};

export type Tarjeta = {
  alias: string;
  proyecto: string;
  anio: number | null;
  alma: string;
  temas: TemaTarjeta[];
  mancha: Mancha;
};

export type Banda = { y: number; alto: number };

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
    fuente(ctx, 400, px, "Anton", "-0.03em");
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
  fuente(ctx, 500, 26, "Inter", "0.42em");
  ctx.fillText(tarjeta.proyecto, x, y);
  if (tarjeta.anio != null) {
    const anio = String(tarjeta.anio);
    const tracking = 26 * 0.42;
    const anchoAnio = Math.max(0, ctx.measureText(anio).width - tracking);
    ctx.fillText(anio, x + ancho - anchoAnio, y);
  }
  y += 52;
  const alias = tarjeta.alias.trim();
  if (!alias) return y;
  const px = pxQueCabe(ctx, alias, ancho, 118, 64);
  fuente(ctx, 400, px, "Anton", "-0.03em");
  ctx.fillStyle = tinta;
  ctx.fillText(alias, x, y);
  return y + px * 0.9 + 36;
}

function pintarTemas(
  ctx: CanvasRenderingContext2D,
  tarjeta: Tarjeta,
  x: number,
  ancho: number,
  desde: number,
  alto: number,
): void {
  const temas = tarjeta.temas;
  if (!temas.length || alto < 48) return;
  const franjas = tarjeta.mancha.franjas;
  const bandas = repartirBandas(
    temas.map((_, i) => franjas[i]?.peso ?? 1),
    desde,
    alto,
  );
  const numAncho = 86;
  const textoX = x + numAncho;
  const textoAncho = ancho - numAncho;
  const tituloPx = 42;
  const tituloLh = 50;
  const artistaPx = 28;
  const artistaLh = 34;
  const gap = 8;

  temas.forEach((tema, i) => {
    const banda = bandas[i];
    if (!banda) return;
    const tinta = franjas[i]?.tinta ?? tarjeta.mancha.pie;
    const cabeTitulo = (s: string) => {
      fuente(ctx, 400, tituloPx, "Inter");
      return ctx.measureText(s).width <= textoAncho;
    };
    const dos = tituloLh * 2 + gap + artistaLh;
    const lineas = envolver(tema.track, banda.alto >= dos ? 2 : 1, cabeTitulo);
    fuente(ctx, 400, artistaPx, "Inter");
    const artista = envolver(tema.artist, 1, (s) => ctx.measureText(s).width <= textoAncho);
    const bloque = lineas.length * tituloLh + (artista.length ? gap + artistaLh : 0);
    const ty = banda.y + Math.max(0, (banda.alto - bloque) / 2);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, banda.y, ancho, banda.alto);
    ctx.clip();
    ctx.fillStyle = tinta;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.globalAlpha = 0.72;
    fuente(ctx, 500, 26, "Inter", "0.06em");
    ctx.fillText(String(i + 1).padStart(2, "0"), x, ty + 8);
    ctx.globalAlpha = 1;
    fuente(ctx, 400, tituloPx, "Inter");
    lineas.forEach((linea, li) => ctx.fillText(linea, textoX, ty + li * tituloLh));
    if (artista[0]) {
      ctx.globalAlpha = 0.72;
      fuente(ctx, 400, artistaPx, "Inter");
      ctx.fillText(artista[0], textoX, ty + lineas.length * tituloLh + gap);
    }
    ctx.restore();
  });
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
  fuente(ctx, 500, px, "Inter", "0.16em");
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

export function dibujarTarjeta(ctx: CanvasRenderingContext2D, tarjeta: Tarjeta): void {
  const { ancho, alto } = TARJETA;
  pintarFondo(ctx, tarjeta.mancha, ancho, alto);
  const x = MARGEN_X;
  const anchoTexto = ancho - MARGEN_X * 2;
  const cabeza = pintarCabeza(ctx, tarjeta, x, anchoTexto, tarjeta.mancha.cabecera);
  const selloY = pintarSello(ctx, tarjeta.alma, x, anchoTexto, alto - MARGEN_Y, tarjeta.mancha.pie);
  pintarTemas(ctx, tarjeta, x, anchoTexto, cabeza + 12, selloY - cabeza - 48);
}

async function fuentesListas(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all([
    document.fonts.load("400 118px Anton"),
    document.fonts.load("400 42px Inter"),
    document.fonts.load("500 30px Inter"),
  ]).catch(() => undefined);
}

export async function descargarTarjeta(tarjeta: Tarjeta): Promise<void> {
  await fuentesListas();
  const canvas = document.createElement("canvas");
  canvas.width = TARJETA.ancho;
  canvas.height = TARJETA.alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  dibujarTarjeta(ctx, tarjeta);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo(tarjeta.alias);
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
