<script lang="ts">
  import { bindRueda } from "./entrada/rueda";
  import { bindToque } from "./entrada/toque";
  import type { EntradaIpod } from "./maquina";

  type Leyenda = { menu: string; prev: string; next: string; centro: string; play: string };

  type Props = {
    modo: "rueda" | "toque";
    indice: number;
    total: number;
    onentrada: (e: EntradaIpod) => void;
    leyenda: Leyenda;
  };

  let { modo, indice, total, onentrada, leyenda }: Props = $props();

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
  <button
    class="wheel__btn wheel__menu"
    type="button"
    aria-label={`MENU, ${leyenda.menu}`}
    onclick={() => onentrada({ tipo: "back" })}
  >
    MENU
    <span class="flota" aria-hidden="true">{leyenda.menu}</span>
  </button>
  <button
    class="wheel__btn wheel__prev"
    type="button"
    aria-label={leyenda.prev}
    onclick={() => onentrada({ tipo: "paso", delta: -1 })}
  >
    <span aria-hidden="true">◄◄</span>
    <span class="flota" aria-hidden="true">{leyenda.prev}</span>
  </button>
  <button
    class="wheel__btn wheel__next"
    type="button"
    aria-label={leyenda.next}
    onclick={() => onentrada({ tipo: "paso", delta: 1 })}
  >
    <span aria-hidden="true">►►</span>
    <span class="flota" aria-hidden="true">{leyenda.next}</span>
  </button>
  <button
    class="wheel__btn wheel__play"
    type="button"
    aria-label={leyenda.play}
    onclick={() => onentrada({ tipo: "play" })}
  >
    <span aria-hidden="true">▶❚</span>
    <span class="flota" aria-hidden="true">{leyenda.play}</span>
  </button>
  <button
    class="wheel__center"
    type="button"
    aria-label={leyenda.centro}
    onclick={() => onentrada({ tipo: "select" })}
  >
    <span class="flota" aria-hidden="true">{leyenda.centro}</span>
  </button>
</div>

<style>
  .wheel {
    position: relative;
    width: min(78cqw, 90cqh);
    height: min(78cqw, 90cqh);
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
  @media (hover: hover) and (pointer: fine) {
    .wheel__btn:hover { color: #3a3836; }
  }
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
  @media (hover: hover) and (pointer: fine) {
    .wheel__center:hover {
      box-shadow:
        inset 0 2px 3px rgba(255, 255, 255, 0.9),
        inset 0 -4px 8px rgba(0, 0, 0, 0.14),
        0 0 0 1px rgba(28, 98, 214, 0.35);
    }
  }
  .flota {
    position: absolute;
    z-index: 3;
    pointer-events: none;
    opacity: 0;
    padding: 4px 8px 5px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.96);
    color: #2c2a28;
    font-family: Inter, Helvetica, Arial, sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.04em;
    line-height: 1;
    white-space: nowrap;
    box-shadow:
      0 8px 18px rgba(16, 10, 24, 0.12),
      0 0 0 1px rgba(0, 0, 0, 0.05);
    transition: opacity 0.16s ease;
  }
  .flota::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 4px;
    margin-right: 6px;
    border-radius: 50%;
    background: #1c62d6;
    transform: translateY(-1px);
  }
  .wheel__menu .flota {
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
  }
  .wheel__prev .flota {
    left: 0;
    bottom: calc(100% + 6px);
    top: auto;
    transform: none;
  }
  .wheel__next .flota {
    right: 0;
    bottom: calc(100% + 6px);
    top: auto;
    transform: none;
  }
  .wheel__play .flota {
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
  }
  .wheel__center .flota {
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
  }
  .wheel__btn:focus-visible .flota,
  .wheel__center:focus-visible .flota {
    opacity: 1;
  }
  @media (hover: hover) and (pointer: fine) {
    .wheel__btn:hover .flota,
    .wheel__center:hover .flota {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .flota { transition: none; }
  }
</style>
