import type { EntradaIpod } from "../maquina";

const STEP = 18;

export function bindRueda(
  el: HTMLElement,
  emit: (e: EntradaIpod) => void,
): () => void {
  let last = 0;
  let acc = 0;
  let down = false;
  const center = () => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  const ang = (x: number, y: number) => {
    const c = center();
    return (Math.atan2(y - c.y, x - c.x) * 180) / Math.PI;
  };
  const onDown = (ev: PointerEvent) => {
    down = true;
    el.setPointerCapture(ev.pointerId);
    last = ang(ev.clientX, ev.clientY);
    acc = 0;
  };
  const onMove = (ev: PointerEvent) => {
    if (!down) return;
    const a = ang(ev.clientX, ev.clientY);
    let d = a - last;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    last = a;
    acc += d;
    while (acc >= STEP) {
      acc -= STEP;
      emit({ tipo: "paso", delta: 1 });
    }
    while (acc <= -STEP) {
      acc += STEP;
      emit({ tipo: "paso", delta: -1 });
    }
  };
  const onUp = () => {
    down = false;
  };
  const onWheel = (ev: WheelEvent) => {
    ev.preventDefault();
    emit({ tipo: "paso", delta: ev.deltaY > 0 ? 1 : -1 });
  };
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
  el.addEventListener("wheel", onWheel, { passive: false });
  return () => {
    el.removeEventListener("pointerdown", onDown);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerup", onUp);
    el.removeEventListener("pointercancel", onUp);
    el.removeEventListener("wheel", onWheel);
  };
}
