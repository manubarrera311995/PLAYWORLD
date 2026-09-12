import type { EntradaIpod } from "../maquina";

export function bindToque(
  el: HTMLElement,
  emit: (e: EntradaIpod) => void,
): () => void {
  let lastY = 0;
  let lastT = 0;
  let vel = 0;
  let raf = 0;
  let spinning = false;

  const tick = () => {
    if (Math.abs(vel) < 0.4) {
      spinning = false;
      return;
    }
    emit({ tipo: "paso", delta: vel > 0 ? 1 : -1 });
    vel *= 0.86;
    raf = requestAnimationFrame(tick);
  };

  const onDown = (ev: PointerEvent) => {
    lastY = ev.clientY;
    lastT = performance.now();
    vel = 0;
    spinning = false;
    cancelAnimationFrame(raf);
    el.setPointerCapture(ev.pointerId);
  };
  const onMove = (ev: PointerEvent) => {
    const now = performance.now();
    const dy = ev.clientY - lastY;
    const dt = Math.max(1, now - lastT);
    vel = dy / dt * 16;
    lastY = ev.clientY;
    lastT = now;
    if (Math.abs(dy) > 18) {
      emit({ tipo: "paso", delta: dy > 0 ? 1 : -1 });
    }
  };
  const onUp = () => {
    if (Math.abs(vel) > 1.2) {
      spinning = true;
      raf = requestAnimationFrame(tick);
    }
  };
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  return () => {
    cancelAnimationFrame(raf);
    el.removeEventListener("pointerdown", onDown);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerup", onUp);
    void spinning;
  };
}

export function swipeBack(el: HTMLElement, emit: (e: EntradaIpod) => void): () => void {
  let x0 = 0;
  const onDown = (ev: PointerEvent) => {
    x0 = ev.clientX;
  };
  const onUp = (ev: PointerEvent) => {
    if (ev.clientX - x0 > 56) emit({ tipo: "back" });
  };
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointerup", onUp);
  return () => {
    el.removeEventListener("pointerdown", onDown);
    el.removeEventListener("pointerup", onUp);
  };
}
