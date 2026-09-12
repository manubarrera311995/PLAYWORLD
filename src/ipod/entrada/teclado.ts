import type { EntradaIpod } from "../maquina";

export function bindTeclado(emit: (e: EntradaIpod) => void): () => void {
  const on = (ev: KeyboardEvent) => {
    const t = ev.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    if (ev.key === "ArrowDown" || ev.key === "ArrowRight") {
      ev.preventDefault();
      emit({ tipo: "paso", delta: 1 });
    } else if (ev.key === "ArrowUp" || ev.key === "ArrowLeft") {
      ev.preventDefault();
      emit({ tipo: "paso", delta: -1 });
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      emit({ tipo: "select" });
    } else if (ev.key === "Escape" || ev.key === "Backspace") {
      ev.preventDefault();
      emit({ tipo: "back" });
    }
  };
  window.addEventListener("keydown", on);
  return () => window.removeEventListener("keydown", on);
}
