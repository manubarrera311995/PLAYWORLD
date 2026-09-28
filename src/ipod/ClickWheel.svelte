<script lang="ts">
  import { bindRueda } from "./entrada/rueda";
  import { bindToque } from "./entrada/toque";
  import type { EntradaIpod } from "./maquina";

  type Props = {
    modo: "rueda" | "toque";
    indice: number;
    total: number;
    onentrada: (e: EntradaIpod) => void;
  };

  let { modo, indice, total, onentrada }: Props = $props();

  const anillo = (el: HTMLElement) =>
    modo === "toque" ? bindToque(el, onentrada) : bindRueda(el, onentrada);
</script>

<div class="wheel">
  <div
    class="wheel__ring"
    {@attach anillo}
    role="slider"
    tabindex="0"
    aria-valuemin={0}
    aria-valuemax={Math.max(0, total - 1)}
    aria-valuenow={indice}
    aria-label="Click wheel"
  ></div>
  <button class="wheel__btn wheel__menu" type="button" onclick={() => onentrada({ tipo: "back" })}>MENU</button>
  <button class="wheel__btn wheel__prev" type="button" onclick={() => onentrada({ tipo: "paso", delta: -1 })} aria-label="Anterior">
    <span aria-hidden="true">◄◄</span>
  </button>
  <button class="wheel__btn wheel__next" type="button" onclick={() => onentrada({ tipo: "paso", delta: 1 })} aria-label="Siguiente">
    <span aria-hidden="true">►►</span>
  </button>
  <button class="wheel__btn wheel__play" type="button" onclick={() => onentrada({ tipo: "select" })} aria-label="Reproducir">
    <span aria-hidden="true">▶❚</span>
  </button>
  <button class="wheel__center" type="button" onclick={() => onentrada({ tipo: "select" })} aria-label="Seleccionar"></button>
</div>

<style>
  .wheel {
    position: relative;
    height: 90%;
    width: auto;
    max-width: 78%;
    aspect-ratio: 1;
    border-radius: 50%;
    background:
      radial-gradient(circle at 50% 38%, #ffffff 0%, #f6f6f4 46%, #e4e4e1 78%, #cfcfcc 100%);
    box-shadow:
      inset 0 2px 2px rgba(255, 255, 255, 0.95),
      inset 0 -8px 14px rgba(0, 0, 0, 0.08),
      0 10px 16px rgba(0, 0, 0, 0.14),
      0 1px 0 rgba(255, 255, 255, 0.8);
  }
  .wheel::before {
    content: "";
    position: absolute;
    inset: 6.5%;
    border-radius: 50%;
    pointer-events: none;
    box-shadow:
      inset 0 0 0 1px rgba(0, 0, 0, 0.08),
      inset 0 3px 5px rgba(0, 0, 0, 0.05),
      0 1px 0 rgba(255, 255, 255, 0.7);
  }
  .wheel__ring {
    position: absolute;
    inset: 4%;
    border-radius: 50%;
    cursor: grab;
    touch-action: none;
    z-index: 1;
  }
  .wheel__center {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 2;
    transform: translate(-50%, -50%);
    width: 36%;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 0;
    padding: 0;
    cursor: pointer;
    background:
      radial-gradient(circle at 50% 36%, #ffffff 0%, #f3f3f1 55%, #d9d9d6 100%);
    box-shadow:
      inset 0 2px 3px rgba(255, 255, 255, 0.9),
      inset 0 -4px 8px rgba(0, 0, 0, 0.14),
      0 1px 2px rgba(0, 0, 0, 0.18);
  }
  .wheel__center:active {
    background: radial-gradient(circle at 50% 58%, #ececea 0%, #d2d2cf 100%);
  }
  .wheel__btn {
    position: absolute;
    z-index: 2;
    border: 0;
    background: transparent;
    color: #8a8682;
    font-family: Inter, Helvetica, Arial, sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.14em;
    cursor: pointer;
    padding: 6px;
    line-height: 1;
  }
  .wheel__btn:active { color: #5c5956; }
  .wheel__menu { top: 7%; left: 50%; transform: translateX(-50%); font-size: 9px; }
  .wheel__play { bottom: 7%; left: 50%; transform: translateX(-50%); letter-spacing: 0; font-size: 11px; }
  .wheel__prev { left: 6%; top: 50%; transform: translateY(-50%); letter-spacing: -0.08em; }
  .wheel__next { right: 6%; top: 50%; transform: translateY(-50%); letter-spacing: -0.08em; }
  .wheel__btn:focus-visible,
  .wheel__center:focus-visible,
  .wheel__ring:focus-visible {
    outline: 2px solid #1c62d6;
    outline-offset: 2px;
  }
</style>
