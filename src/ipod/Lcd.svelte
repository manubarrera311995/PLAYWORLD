<script lang="ts">
  import type { Snippet } from "svelte";
  import { swipeBack } from "./entrada/toque";
  import type { EntradaIpod } from "./maquina";

  type Props = {
    titulo: string;
    n: number;
    capacidad: number;
    onentrada: (e: EntradaIpod) => void;
    children?: Snippet;
  };

  let { titulo, n, capacidad, onentrada, children }: Props = $props();

  const cuerpo = (el: HTMLElement) => swipeBack(el, onentrada);
</script>

<div class="lcd">
  <div class="lcd__bar">
    <span class="lcd__eq" aria-hidden="true"></span>
    <span class="lcd__titulo">{titulo}</span>
    <span class="lcd__count">{n}/{capacidad}</span>
  </div>
  <div class="lcd__body" {@attach cuerpo}>
    {@render children?.()}
  </div>
  <div class="lcd__glass" aria-hidden="true"></div>
</div>

<style>
  .lcd {
    position: relative;
    width: 100%;
    height: 100%;
    min-width: 0;
    overflow: hidden;
    color: #111;
    background: #f3f3f3;
    font-family: Inter, Helvetica, Arial, sans-serif;
  }
  .lcd__bar {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    padding: 4px 8px;
    color: #1a1a1a;
    background: linear-gradient(180deg, #f7f7f7 0%, #d5d5d5 100%);
    border-bottom: 1px solid #bdbdbd;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.04em;
  }
  .lcd__titulo {
    max-width: 18ch;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
    font-weight: 500;
  }
  .lcd__count {
    justify-self: end;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.06em;
  }
  .lcd__body {
    position: relative;
    z-index: 1;
    height: calc(100% - 28px);
    min-width: 0;
    overflow: auto;
    padding: 0 0 8px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.65), transparent 18px),
      #f4f4f4;
  }
  .lcd__glass {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(
      118deg,
      rgba(255, 255, 255, 0.42) 0%,
      rgba(255, 255, 255, 0.08) 16%,
      transparent 38%
    );
  }
</style>
