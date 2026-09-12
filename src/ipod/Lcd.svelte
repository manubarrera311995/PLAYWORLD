<script lang="ts">
  import type { Snippet } from "svelte";
  import { lcdFondoSketch } from "../sketches/lcdFondo.sketch";
  import { p5Isla } from "../sketches/p5Isla";
  import { paleta } from "../sketches/paleta";
  import { swipeBack } from "./entrada/toque";
  import type { EntradaIpod } from "./maquina";

  type Props = {
    n: number;
    capacidad: number;
    onentrada: (e: EntradaIpod) => void;
    children?: Snippet;
  };

  let { n, capacidad, onentrada, children }: Props = $props();

  const fondo = (el: HTMLElement) => {
    const isla = p5Isla(el, lcdFondoSketch, {}, paleta);
    return () => isla.destroy();
  };

  const cuerpo = (el: HTMLElement) => swipeBack(el, onentrada);
</script>

<div class="lcd">
  <div class="lcd__bg" {@attach fondo} aria-hidden="true"></div>
  <div class="lcd__bar">
    <span>PLAYWORLD</span>
    <span>{n} / {capacidad}</span>
  </div>
  <div class="lcd__body" {@attach cuerpo}>
    {@render children?.()}
  </div>
</div>

<style>
  .lcd {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 8px;
    overflow: hidden;
    color: #1a2218;
    background: #9aae86;
    box-shadow: inset 0 0 0 3px #6e7c5e, 0 8px 24px rgba(0, 0, 0, 0.25);
  }
  .lcd__bg {
    position: absolute;
    inset: 0;
    opacity: 0.35;
    mix-blend-mode: multiply;
  }
  .lcd__bar,
  .lcd__body {
    position: relative;
    z-index: 1;
  }
  .lcd__bar {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 6px 8px;
    background: rgba(20, 32, 16, 0.2);
  }
  .lcd__body {
    height: calc(100% - 28px);
    overflow: auto;
    padding: 6px 8px 10px;
  }
</style>
