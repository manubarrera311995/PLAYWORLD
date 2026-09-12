import p5 from "p5";
import type { Readable } from "svelte/store";
import type { Paleta } from "../datos/tipos";

export type SketchLife = {
  setup(): void;
  draw(): void;
  resize(w: number, h: number): void;
  destroy?(): void;
};

export type Sketch<P> = (p: p5, params: P, paleta: Readable<Paleta>) => SketchLife;

export type Isla = {
  pause(): void;
  resume(): void;
  resize(): void;
  destroy(): void;
};

export function p5Isla<P>(mount: HTMLElement, sketch: Sketch<P>, params: P, paleta: Readable<Paleta>): Isla {
  let life: SketchLife | null = null;
  let debounce: ReturnType<typeof setTimeout> | null = null;

  const instance = new p5((p: p5) => {
    life = sketch(p, params, paleta);
    p.setup = () => {
      const c = p.createCanvas(Math.max(1, mount.clientWidth), Math.max(1, mount.clientHeight));
      c.parent(mount);
      p.pixelDensity(1);
      life?.setup();
    };
    p.draw = () => {
      life?.draw();
    };
  }, mount);

  const observer = new ResizeObserver(() => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      instance.resizeCanvas(w, h);
      life?.resize(w, h);
    }, 120);
  });
  observer.observe(mount);

  return {
    pause() {
      instance.noLoop();
    },
    resume() {
      instance.loop();
    },
    resize() {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      instance.resizeCanvas(w, h);
      life?.resize(w, h);
    },
    destroy() {
      observer.disconnect();
      if (debounce) clearTimeout(debounce);
      life?.destroy?.();
      instance.remove();
    },
  };
}
