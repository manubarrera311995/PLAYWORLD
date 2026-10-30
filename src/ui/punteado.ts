const cache = new Map<string, string>();

function azar(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Pastilla lisa con un halo de puntos por fuera.
 * `ancho` y `alto` son el tamaño del cuerpo, halo incluido.
 * El sólido ocupa el centro; hacia afuera los puntos se achican y se ralean.
 */
export function mascaraPunteada(ancho: number, alto: number, halo = 18): string | null {
  const w = Math.round(ancho);
  const h = Math.round(alto);
  const margen = Math.round(halo);
  const innerW = w - margen * 2;
  const innerH = h - margen * 2;
  if (innerW < 8 || innerH < 8) return null;

  const dpr = 3;
  const W = Math.round(w * dpr);
  const H = Math.round(h * dpr);
  const clave = `${W}x${H}x${margen}`;
  const previa = cache.get(clave);
  if (previa) return previa;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d");
  if (!g) return null;
  const img = g.createImageData(W, H);
  const data = img.data;

  const ox = margen * dpr;
  const oy = margen * dpr;
  const pillW = innerW * dpr;
  const pillH = innerH * dpr;
  const radioP = pillH / 2;
  const haloPx = margen * dpr;
  const solido = 4 * dpr;
  const paso = 2.7 * dpr;
  const dy = paso * Math.sin(Math.PI / 3);

  function distAt(x: number, y: number): number {
    const px = x - ox;
    const py = y - oy;
    const cx = Math.min(Math.max(px, radioP), pillW - radioP);
    const cy = radioP;
    return radioP - Math.hypot(px - cx, py - cy);
  }

  const celdas = new Map<string, { ccx: number; ccy: number; radio: number }>();
  function celda(x: number, y: number): { ccx: number; ccy: number; radio: number } {
    const row = Math.floor(y / dy);
    const shift = row & 1 ? paso * 0.5 : 0;
    const col = Math.floor((x - shift) / paso);
    const id = `${row}:${col}`;
    const hecha = celdas.get(id);
    if (hecha) return hecha;
    const ccx = col * paso + paso * 0.5 + shift;
    const ccy = row * dy + dy * 0.5;
    const dist = distAt(ccx, ccy);
    const t = Math.max(0, Math.min(1, (dist + haloPx) / (solido + haloPx)));
    const ruido = 0.9 + azar(row * 47 + col * 13) * 0.2;
    let radio = Math.pow(t, 1.05) * 1.85 * dpr * ruido;
    if (t < 0.38 && azar(row * 19 + col * 7) > 0.15 + t * 2.1) radio = 0;
    const punto = { ccx, ccy, radio };
    celdas.set(id, punto);
    return punto;
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dist = distAt(x + 0.5, y + 0.5);
      let alpha = 0;
      if (dist >= solido) alpha = 255;
      else if (dist > -haloPx) {
        const c = celda(x + 0.5, y + 0.5);
        if (c.radio > 0.42 * dpr && Math.hypot(x + 0.5 - c.ccx, y + 0.5 - c.ccy) <= c.radio) {
          alpha = 255;
        }
      }
      const i = (y * W + x) * 4;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = alpha;
    }
  }

  g.putImageData(img, 0, 0);
  const url = canvas.toDataURL();
  cache.set(clave, url);
  return url;
}
