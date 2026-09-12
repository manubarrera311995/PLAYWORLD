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
  <button class="wheel__btn wheel__prev" type="button" onclick={() => onentrada({ tipo: "paso", delta: -1 })} aria-label="Anterior">‹‹</button>
  <button class="wheel__btn wheel__next" type="button" onclick={() => onentrada({ tipo: "paso", delta: 1 })} aria-label="Siguiente">››</button>
  <button class="wheel__btn wheel__play" type="button" onclick={() => onentrada({ tipo: "select" })} aria-label="Select">▶</button>
  <button class="wheel__center" type="button" onclick={() => onentrada({ tipo: "select" })}>SELECT</button>
</div>

<style>
  .wheel {
    position: relative;
    width: min(100%, 280px);
    aspect-ratio: 1;
    margin: 0 auto;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 40%, #f4eee8 0%, #d8d0c8 55%, #c4bbb2 100%);
    box-shadow:
      0 18px 40px rgba(20, 0, 40, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.7);
  }
  .wheel__ring {
    position: absolute;
    inset: 18%;
    border-radius: 50%;
    cursor: grab;
    touch-action: none;
  }
  .wheel__center {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 34%;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 0;
    background: #ebe4dc;
    color: #6a625c;
    font-size: 9px;
    letter-spacing: 0.12em;
    cursor: pointer;
  }
  .wheel__btn {
    position: absolute;
    border: 0;
    background: transparent;
    color: #6a625c;
    font-size: 10px;
    letter-spacing: 0.08em;
    cursor: pointer;
    font-weight: 500;
  }
  .wheel__menu { top: 10%; left: 50%; transform: translateX(-50%); }
  .wheel__play { bottom: 10%; left: 50%; transform: translateX(-50%); }
  .wheel__prev { left: 8%; top: 50%; transform: translateY(-50%); }
  .wheel__next { right: 8%; top: 50%; transform: translateY(-50%); }
</style>
