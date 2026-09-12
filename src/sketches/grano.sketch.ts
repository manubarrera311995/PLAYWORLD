import type p5 from "p5";
import { get, type Readable } from "svelte/store";
import type { Paleta } from "../datos/tipos";
import { reduce } from "../motion/reducedMotion";
import { viewport } from "../estado/viewport";
import type { Sketch } from "./p5Isla";

type GranoParams = { fps?: number };

type Motita = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  shade: number;
  size: number;
};

type Estela = { x: number; y: number; life: number };

export const granoSketch: Sketch<GranoParams> = (p: p5, params, paleta: Readable<Paleta>) => {
  const tile = 128;
  const speck = 2;
  const cell = tile * speck;
  const maxMotitas = 360;
  const maxEstela = 72;
  const vidaEstela = 78;
  let buffer: p5.Graphics | null = null;
  let pattern: CanvasPattern | null = null;
  let stamp: HTMLCanvasElement | null = null;
  let stampCtx: CanvasRenderingContext2D | null = null;
  let acc = 0;
  let frozen = false;
  let ox = 0;
  let oy = 0;

  let tx = 0;
  let ty = 0;
  let hx = 0;
  let hy = 0;
  let visto = false;
  let activo = false;
  const motitas: Motita[] = [];
  const estela: Estela[] = [];
  const drop: Array<() => void> = [];

  const fpsOf = () => {
    const modo = get(viewport).modo;
    return params.fps ?? (modo === "compacto" ? 12 : 16);
  };

  const paintTile = (full = false) => {
    if (!buffer) return;
    const pal = get(paleta);
    const dens = pal.granoDensidad;
    const vel = pal.granoVelocidad;
    const mid = 128;
    const amp = 42 + dens * 68;
    const mutar = full ? 1 : 0.1 + vel * 0.18;

    buffer.loadPixels();
    for (let i = 0; i < buffer.pixels.length; i += 4) {
      if (!full && p.random() >= mutar) continue;
      const n = mid + (p.random() * 2 - 1) * amp;
      buffer.pixels[i] = n;
      buffer.pixels[i + 1] = n;
      buffer.pixels[i + 2] = n;
      buffer.pixels[i + 3] = 235;
    }
    buffer.updatePixels();
    const ctx = p.drawingContext as CanvasRenderingContext2D;
    pattern = ctx.createPattern(buffer.elt, "repeat");
  };

  const blit = () => {
    if (!pattern) return;
    const ctx = p.drawingContext as CanvasRenderingContext2D;
    const wrapX = ((ox % cell) + cell) % cell;
    const wrapY = ((oy % cell) + cell) % cell;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, p.width, p.height);
    ctx.translate(-wrapX, -wrapY);
    ctx.scale(speck, speck);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, (p.width + cell) / speck, (p.height + cell) / speck);
    ctx.restore();
  };

  const ensureStamp = () => {
    if (!stamp) {
      stamp = document.createElement("canvas");
      stampCtx = stamp.getContext("2d", { alpha: true });
    }
    if (!stamp || !stampCtx) return null;
    if (stamp.width !== p.width || stamp.height !== p.height) {
      stamp.width = Math.max(1, p.width);
      stamp.height = Math.max(1, p.height);
    }
    return stampCtx;
  };

  const deformar = (dx: number, dy: number, spd: number) => {
    if (!visto) return;
    const ctx = p.drawingContext as CanvasRenderingContext2D;
    const sctx = ensureStamp();
    if (!sctx || !stamp) return;
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.clearRect(0, 0, stamp.width, stamp.height);
    sctx.drawImage(ctx.canvas, 0, 0);

    const energia = Math.min(1, 0.28 + spd * 0.12);
    const rx = 54 + energia * 42 + spd * 3;
    const ry = 76 + energia * 52 + spd * 5;
    const ang = spd > 0.2 ? Math.atan2(dy, dx) : 0;
    const inv = spd > 0.2 ? 1 / spd : 0;
    const nx = dx * inv;
    const ny = dy * inv;
    const push = 6 + spd * 1.1;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(hx, hy);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.scale(1.1, 1.16);
    ctx.rotate(-ang);
    ctx.translate(-hx, -hy);
    ctx.drawImage(stamp, -nx * push, -ny * push);
    ctx.restore();
  };

  const nacer = (x: number, y: number, vx: number, vy: number, vida: number, tam: number) => {
    if (motitas.length >= maxMotitas) motitas.shift();
    motitas.push({
      x,
      y,
      vx,
      vy,
      life: vida,
      max: vida,
      shade: p.random() > 0.5 ? 40 + p.random(50) : 180 + p.random(50),
      size: tam,
    });
  };

  const esparcir = (x: number, y: number, energia: number, atrasX: number, atrasY: number) => {
    const pal = get(paleta);
    const n = Math.min(12, 3 + Math.floor(energia * (8 + pal.granoVelocidad * 6)));
    for (let i = 0; i < n; i++) {
      const lado = p.random() > 0.5 ? 1 : -1;
      const spread = 0.55 + p.random() * 1.2;
      nacer(
        x + (p.random() - 0.5) * 28,
        y + (p.random() - 0.5) * 28,
        atrasX * (0.25 + p.random() * 0.7) + -atrasY * lado * spread + (p.random() - 0.5) * 0.45,
        atrasY * (0.25 + p.random() * 0.7) + atrasX * lado * spread + (p.random() - 0.5) * 0.45,
        52 + p.random() * 40,
        speck + (p.random() > 0.75 ? speck : 0),
      );
    }
  };

  const rociar = (ctx: CanvasRenderingContext2D, x: number, y: number, radio: number, cuenta: number, alfa: number) => {
    for (let i = 0; i < cuenta; i++) {
      const a = p.random() * Math.PI * 2;
      const r = radio * p.random() ** 0.88;
      const n = p.random() > 0.5 ? 36 + p.random(50) : 185 + p.random(50);
      ctx.globalAlpha = alfa * (0.4 + p.random() * 0.5);
      ctx.fillStyle = `rgb(${n},${n},${n})`;
      const s = speck + (p.random() > 0.8 ? speck : 0);
      ctx.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r, s, s);
    }
  };

  const pintarEstela = () => {
    if (!visto) return;
    const ctx = p.drawingContext as CanvasRenderingContext2D;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const len = estela.length;
    for (let i = len - 1; i >= 0; i--) {
      const pt = estela[i];
      const t = 1 - pt.life / vidaEstela;
      rociar(ctx, pt.x, pt.y, 16 + t * 64, Math.floor(8 + (1 - t) * 16), 0.28 * (pt.life / vidaEstela));
    }

    for (let i = motitas.length - 1; i >= 0; i--) {
      const m = motitas[i];
      m.x += m.vx;
      m.y += m.vy;
      m.vx *= 0.97;
      m.vy *= 0.97;
      m.life -= 1;
      if (m.life <= 0) {
        motitas.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = 0.18 + (m.life / m.max) * 0.42;
      ctx.fillStyle = `rgb(${m.shade},${m.shade},${m.shade})`;
      ctx.fillRect(m.x, m.y, m.size, m.size);
    }

    ctx.restore();
  };

  const onPuntero = (ev: PointerEvent) => {
    tx = ev.clientX;
    ty = ev.clientY;
    activo = true;
    if (!visto) {
      hx = tx;
      hy = ty;
      visto = true;
    }
  };

  const onSale = () => {
    activo = false;
  };

  return {
    setup() {
      buffer = p.createGraphics(tile, tile);
      buffer.pixelDensity(1);
      p.noStroke();
      p.noSmooth();
      paintTile(true);
      if (get(reduce)) {
        frozen = true;
        p.noLoop();
        blit();
        return;
      }
      window.addEventListener("pointermove", onPuntero, { passive: true });
      window.addEventListener("pointerdown", onPuntero, { passive: true });
      document.addEventListener("mouseleave", onSale);
      window.addEventListener("blur", onSale);
      drop.push(() => {
        window.removeEventListener("pointermove", onPuntero);
        window.removeEventListener("pointerdown", onPuntero);
        document.removeEventListener("mouseleave", onSale);
        window.removeEventListener("blur", onSale);
      });
    },
    draw() {
      if (!buffer) return;
      if (frozen) {
        blit();
        return;
      }
      const pal = get(paleta);
      const dt = Math.min(p.deltaTime, 48) / 16.67;
      ox += pal.granoVelocidad * 1.6 * dt;
      oy += pal.granoVelocidad * 1.0 * dt;

      acc += p.deltaTime;
      const interval = 1000 / fpsOf();
      if (acc >= interval) {
        acc %= interval;
        paintTile(false);
      }
      blit();

      let dx = 0;
      let dy = 0;
      let spd = 0;
      if (visto) {
        const hx0 = hx;
        const hy0 = hy;
        const k = 1 - Math.pow(0.9, dt);
        hx += (tx - hx) * k;
        hy += (ty - hy) * k;
        dx = hx - hx0;
        dy = hy - hy0;
        spd = Math.hypot(dx, dy);
        if (activo) {
          const ultimo = estela[0];
          const salto = ultimo ? Math.hypot(tx - ultimo.x, ty - ultimo.y) : 99;
          if (salto > 1.2) {
            estela.unshift({ x: tx, y: ty, life: vidaEstela });
            if (estela.length > maxEstela) estela.pop();
          }
        }
        for (let i = estela.length - 1; i >= 0; i--) {
          estela[i].life -= 0.55;
          if (estela[i].life <= 0) estela.splice(i, 1);
        }
        if (activo && spd > 0.2) {
          const inv = 1 / spd;
          esparcir(hx, hy, Math.min(1.1, spd * 0.22), -dx * inv, -dy * inv);
        }
      }

      deformar(dx, dy, spd);
      pintarEstela();
    },
    resize() {
      blit();
    },
    destroy() {
      for (const fn of drop) fn();
      drop.length = 0;
      motitas.length = 0;
      estela.length = 0;
      buffer?.remove();
      buffer = null;
      pattern = null;
      stamp = null;
      stampCtx = null;
    },
  };
};
