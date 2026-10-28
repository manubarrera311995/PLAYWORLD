import type { AlmaId } from "../../almas/almas";
import cartas from "./carta.copy.json";

/** La card de la vista, en una historia de 1080×1920. */
export const CARTA = { ancho: 1080, alto: 1920 } as const;

/**
 * En pantalla el borde y la regla son px fijos.
 * El archivo los escala para que pesen igual que en una card de este ancho.
 */
const ANCHO_PANTALLA = 468;
const BORDE_PX = 1.5;
const REGLA_PX = 1;

/** `line-height: normal` de DM Sans, medido en la card. */
const LH_CEJA = 17 / 12.636;
const LH_RASGOS = 18 / 14.04;

const FRENTE = [
  { x: 6, y: 18, n: 4.2, g: 12 },
  { x: 86, y: 14, n: 3.2, g: -8 },
  { x: 90, y: 58, n: 3.6, g: 18 },
  { x: 4, y: 62, n: 2.6, g: -14 },
] as const;

type Cara = {
  fondo: string;
  tinta: string;
  pastilla: string;
  borde: string;
  lineas: string[];
  rasgos: string[];
  lema: string;
};

export type Caja = { x: number; y: number; ancho: number; alto: number };

export type Medidas = {
  borde: number;
  radio: number;
  ceja: { x: number; y: number; ancho: number; alto: number; px: number };
  dibujo: Caja;
  nombre: { x: number; y: number; ancho: number; px: number; altoLinea: number; alto: number };
  regla: { x: number; y: number; ancho: number; alto: number };
  rasgos: { x: number; y: number; ancho: number; alto: number; px: number };
  pastilla: Caja & { px: number; padX: number; padSup: number };
};

export function medidas(ancho: number, alto: number, nLineas: number): Medidas {
  const cq = ancho / 100;
  const borde = BORDE_PX * (ancho / ANCHO_PANTALLA);
  const radio = 5.6 * cq;
  const padT = 6.2 * cq;
  const padX = 7 * cq;
  const x = borde + padX;
  const anchoTexto = Math.max(0, ancho - borde * 2 - padX * 2);
  const u = anchoTexto / 100;

  const cejaPx = 2.7 * cq;
  const cejaAlto = cejaPx * LH_CEJA;
  const nombrePx = 11.2 * cq;
  const altoLinea = nombrePx * 0.88;
  const nombreAlto = Math.max(nLineas, 0) * altoLinea;
  const reglaAlto = REGLA_PX * (ancho / ANCHO_PANTALLA);
  const rasgosPx = 3 * cq;
  const rasgosAlto = rasgosPx * LH_RASGOS;
  const pastillaPx = 2.7 * cq;
  const pastillaAlto = pastillaPx * (0.62 + 1 + 0.58);
  const pieAlto =
    nombreAlto +
    3.2 * u +
    reglaAlto +
    2.6 * u +
    rasgosAlto +
    4.5 * u +
    pastillaAlto;

  const techo = borde + padT;
  const piso = alto - borde - 5.6 * cq;
  const dibujoY = techo + cejaAlto + u;
  const nombreY = piso - pieAlto;

  return {
    borde,
    radio,
    ceja: { x, y: techo, ancho: anchoTexto, alto: cejaAlto, px: cejaPx },
    dibujo: {
      x,
      y: dibujoY,
      ancho: anchoTexto,
      alto: Math.max(0, nombreY - 2 * u - dibujoY),
    },
    nombre: { x, y: nombreY, ancho: anchoTexto, px: nombrePx, altoLinea, alto: nombreAlto },
    regla: { x, y: nombreY + nombreAlto + 3.2 * u, ancho: anchoTexto, alto: reglaAlto },
    rasgos: {
      x,
      y: nombreY + nombreAlto + 3.2 * u + reglaAlto + 2.6 * u,
      ancho: anchoTexto,
      alto: rasgosAlto,
      px: rasgosPx,
    },
    pastilla: {
      x,
      y: piso - pastillaAlto,
      ancho: anchoTexto,
      alto: pastillaAlto,
      px: pastillaPx,
      padX: 1.05 * pastillaPx,
      padSup: 0.62 * pastillaPx,
    },
  };
}

function caraDe(id: AlmaId): Cara | null {
  const cara = (cartas as Record<string, Cara>)[id];
  if (!cara?.lineas?.length || !cara.fondo) return null;
  return cara;
}

function emTop(lineaY: number, px: number, altoLinea: number): number {
  return lineaY + (altoLinea - px) / 2;
}

function estrella(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tam: number,
  grados: number,
  tinta: string,
): void {
  ctx.save();
  ctx.translate(x + tam / 2, y + tam / 2);
  ctx.rotate((grados * Math.PI) / 180);
  ctx.scale(tam / 24, tam / 24);
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = tinta;
  for (const angulo of [0, 60, 120]) {
    ctx.save();
    ctx.rotate((angulo * Math.PI) / 180);
    ctx.beginPath();
    ctx.roundRect(-1.7, -10.5, 3.4, 21, 1.7);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function pintarDibujo(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, caja: Caja): void {
  if (!img || caja.ancho <= 0 || caja.alto <= 0 || !img.naturalWidth || !img.naturalHeight) return;
  const escala = Math.min(caja.ancho / img.naturalWidth, caja.alto / img.naturalHeight);
  const w = img.naturalWidth * escala;
  const h = img.naturalHeight * escala;
  ctx.drawImage(img, caja.x + (caja.ancho - w) / 2, caja.y + (caja.alto - h) / 2, w, h);
}

export function dibujarCarta(
  ctx: CanvasRenderingContext2D,
  id: AlmaId,
  imagen: HTMLImageElement | null = null,
): void {
  const cara = caraDe(id);
  if (!cara) return;
  const { ancho, alto } = CARTA;
  const m = medidas(ancho, alto, cara.lineas.length);

  ctx.clearRect(0, 0, ancho, alto);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, ancho, alto, m.radio);
  ctx.fillStyle = cara.fondo;
  ctx.fill();
  ctx.clip();

  for (const s of FRENTE) {
    estrella(ctx, (s.x / 100) * ancho, (s.y / 100) * alto, (s.n / 100) * ancho, s.g, cara.tinta);
  }
  pintarDibujo(ctx, imagen, m.dibujo);

  ctx.fillStyle = cara.tinta;
  ctx.textAlign = "left";
  ctx.font = `500 ${m.ceja.px}px "DM Sans"`;
  ctx.letterSpacing = `${0.16 * m.ceja.px}px`;
  ctx.textBaseline = "top";
  ctx.fillText(
    "Tu alma en Playworld".toLocaleUpperCase("es"),
    m.ceja.x + 0.16 * m.ceja.px,
    emTop(m.ceja.y, m.ceja.px, m.ceja.alto),
  );

  ctx.font = `800 ${m.nombre.px}px Outfit`;
  ctx.letterSpacing = `${-0.045 * m.nombre.px}px`;
  cara.lineas.forEach((linea, i) => {
    const y = m.nombre.y + i * m.nombre.altoLinea;
    ctx.fillText(linea, m.nombre.x, emTop(y, m.nombre.px, m.nombre.altoLinea));
  });

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillRect(m.regla.x, m.regla.y, m.regla.ancho, m.regla.alto);
  ctx.restore();

  ctx.font = `500 ${m.rasgos.px}px "DM Sans"`;
  ctx.letterSpacing = `${-0.01 * m.rasgos.px}px`;
  ctx.fillText(
    cara.rasgos.join("  ·  "),
    m.rasgos.x,
    emTop(m.rasgos.y, m.rasgos.px, m.rasgos.alto),
  );

  ctx.beginPath();
  ctx.roundRect(m.pastilla.x, m.pastilla.y, m.pastilla.ancho, m.pastilla.alto, m.pastilla.alto / 2);
  ctx.fillStyle = cara.pastilla;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${m.pastilla.px}px Outfit`;
  ctx.letterSpacing = `${0.04 * m.pastilla.px}px`;
  ctx.fillText(
    `* ${cara.lema} *`.toLocaleUpperCase("es"),
    m.pastilla.x + m.pastilla.padX,
    m.pastilla.y + m.pastilla.padSup,
  );
  ctx.restore();

  ctx.beginPath();
  ctx.roundRect(
    m.borde / 2,
    m.borde / 2,
    ancho - m.borde,
    alto - m.borde,
    Math.max(0, m.radio - m.borde / 2),
  );
  ctx.strokeStyle = cara.borde;
  ctx.lineWidth = m.borde;
  ctx.stroke();
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

async function fuentesListas(m: Medidas): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all([
    document.fonts.load(`500 ${m.ceja.px}px "DM Sans"`),
    document.fonts.load(`800 ${m.nombre.px}px Outfit`),
    document.fonts.load(`500 ${m.rasgos.px}px "DM Sans"`),
    document.fonts.load(`700 ${m.pastilla.px}px Outfit`),
  ]).catch(() => undefined);
}

export async function lienzoCarta(id: AlmaId): Promise<HTMLCanvasElement | null> {
  const cara = caraDe(id);
  if (!cara) return null;
  const m = medidas(CARTA.ancho, CARTA.alto, cara.lineas.length);
  await fuentesListas(m);
  const imagen = await cargarImagen(`/assets/almas/${id}.png`);
  const canvas = document.createElement("canvas");
  canvas.width = CARTA.ancho;
  canvas.height = CARTA.alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  dibujarCarta(ctx, id, imagen);
  return canvas;
}

export async function descargarCarta(id: AlmaId): Promise<void> {
  const canvas = await lienzoCarta(id);
  if (!canvas) return;
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `playworld-${id}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
