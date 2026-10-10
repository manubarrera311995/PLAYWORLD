<script lang="ts">
  import copy from "./edicion.copy.json";
  import { RASGO_KEYS, type RasgoKey } from "./lectura";
  import { PLOT } from "./nube";

  type Punto = {
    id: string;
    x: number;
    y: number;
    color: string;
    on: boolean;
    prefix: string;
    artist: string;
    title: string;
  };

  type Props = {
    puntos: readonly Punto[];
    xKey: RasgoKey;
    yKey: RasgoKey;
    selectedId: string | null;
    hoverPrefix: string | null;
    cruce: { x: number; y: number } | null;
    onx: (key: RasgoKey) => void;
    ony: (key: RasgoKey) => void;
    onsong: (id: string | null) => void;
  };
  let { puntos, xKey, yKey, selectedId, hoverPrefix, cruce, onx, ony, onsong }: Props = $props();

  const labels = copy.moods as Record<string, string>;
  const ticks = [0, 20, 40, 60, 80, 100];
  const vacio = $derived(puntos.length > 0 && puntos.every((punto) => !punto.on));
  const orden = $derived(
    [...puntos].sort((a, b) => rango(a) - rango(b)),
  );

  let tip = $state<{ x: number; y: number; text: string } | null>(null);

  function rango(punto: Punto): number {
    if (punto.id === selectedId) return 4;
    if (!punto.on) return 0;
    if (hoverPrefix && punto.prefix === hoverPrefix) return 3;
    if (hoverPrefix) return 1;
    return 2;
  }

  function clase(punto: Punto): string {
    const names = ["dot"];
    if (!punto.on) names.push("is-off");
    else if (hoverPrefix && punto.prefix !== hoverPrefix) names.push("is-dim");
    if (punto.id === selectedId) names.push("is-sel");
    return names.join(" ");
  }

  function xDe(tick: number): number {
    return PLOT.l + (tick / 100) * (PLOT.w - PLOT.l - PLOT.r);
  }
  function yDe(tick: number): number {
    return PLOT.t + (1 - tick / 100) * (PLOT.h - PLOT.t - PLOT.b);
  }

  function elegir(id: string) {
    onsong(id === selectedId ? null : id);
  }

  function tecla(e: KeyboardEvent, id: string) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    elegir(id);
  }

  function mostrar(e: PointerEvent, punto: Punto) {
    if (!punto.on) return;
    const mark = e.currentTarget as SVGCircleElement;
    const host = mark.ownerSVGElement?.parentElement?.getBoundingClientRect();
    const rect = mark.getBoundingClientRect();
    if (!host) return;
    tip = {
      x: rect.left + rect.width / 2 - host.left,
      y: rect.top - host.top,
      text: `“${punto.title}” — ${punto.artist}`,
    };
  }
</script>

<div class="nube">
  <label class="eje eje-y">
    <select aria-label={copy.tablero.up} value={yKey} onchange={(e) => ony(e.currentTarget.value as RasgoKey)}>
      {#each RASGO_KEYS as key (key)}
        <option value={key}>{labels[key] ?? key}</option>
      {/each}
    </select>
  </label>
  <div class="plot">
    <svg viewBox="0 0 {PLOT.w} {PLOT.h}" role="img" aria-label={copy.tablero.plot}>
      {#each ticks as tick (tick)}
        <line x1={PLOT.l} x2={PLOT.w - PLOT.r} y1={yDe(tick)} y2={yDe(tick)} class="guia" />
        <line y1={PLOT.t} y2={PLOT.h - PLOT.b} x1={xDe(tick)} x2={xDe(tick)} class="guia suave" />
        <text x={xDe(tick)} y={PLOT.h - 12} text-anchor="middle">{tick}</text>
        <text x={PLOT.l - 8} y={yDe(tick) + 4} text-anchor="end">{tick}</text>
      {/each}
      {#if cruce}
        <line x1={cruce.x} x2={cruce.x} y1={PLOT.t} y2={PLOT.h - PLOT.b} class="cruce" />
        <line y1={cruce.y} y2={cruce.y} x1={PLOT.l} x2={PLOT.w - PLOT.r} class="cruce" />
      {/if}
      {#each orden as punto (punto.id)}
        <circle
          role="button"
          tabindex="-1"
          aria-label="{punto.title} — {punto.artist}"
          class={clase(punto)}
          cx={punto.x}
          cy={punto.y}
          r={punto.id === selectedId ? 7 : 4.2}
          fill={punto.color}
          onclick={() => punto.on && elegir(punto.id)}
          onkeydown={(e) => punto.on && tecla(e, punto.id)}
          onpointerenter={(e) => mostrar(e, punto)}
          onpointerleave={() => (tip = null)}
        />
      {/each}
    </svg>
    {#if tip}
      <p class="tip" style:left="{tip.x}px" style:top="{tip.y}px">{tip.text}</p>
    {/if}
    {#if vacio}
      <p class="vacio">{copy.tablero.empty}</p>
    {/if}
  </div>
  <label class="eje eje-x">
    <select aria-label={copy.tablero.down} value={xKey} onchange={(e) => onx(e.currentTarget.value as RasgoKey)}>
      {#each RASGO_KEYS as key (key)}
        <option value={key}>{labels[key] ?? key}</option>
      {/each}
    </select>
  </label>
</div>

<style>
  .nube {
    height: 100%;
    min-height: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 2px 6px;
    padding: 12px 14px 10px;
    border-radius: 22px;
    border: 1px solid rgba(255, 246, 239, 0.16);
    background: rgba(16, 8, 14, 0.62);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
  .eje-y { grid-column: 1; grid-row: 1; display: grid; place-items: center; }
  .eje-x { grid-column: 2; grid-row: 2; display: grid; justify-items: center; }
  .eje select {
    border: 0;
    background: transparent;
    color: var(--ink);
    font: inherit;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
    text-align: center;
  }
  .eje-y select {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
  }
  .plot {
    grid-column: 2;
    grid-row: 1;
    position: relative;
    min-width: 0;
    min-height: 0;
    border-radius: 14px;
    background: rgba(8, 4, 10, 0.42);
  }
  svg { width: 100%; height: 100%; display: block; overflow: visible; }
  text { fill: rgba(255, 246, 239, 0.55); font-size: 11px; font-family: Inter, system-ui, sans-serif; }
  .guia { stroke: rgba(255, 246, 239, 0.14); }
  .guia.suave { stroke: rgba(255, 246, 239, 0.08); }
  .cruce { stroke: rgba(255, 246, 239, 0.28); stroke-dasharray: 3 4; }
  .dot { cursor: pointer; }
  .dot.is-off { opacity: 0.07; pointer-events: none; }
  .dot.is-dim { opacity: 0.22; }
  .dot.is-sel { stroke: #fff6ef; stroke-width: 1.8; }
  .tip {
    position: absolute;
    z-index: 2;
    transform: translate(-50%, -120%);
    margin: 0;
    padding: 6px 10px;
    border-radius: 8px;
    background: rgba(18, 28, 22, 0.92);
    border: 1px solid rgba(255, 246, 239, 0.12);
    font-size: 12px;
    pointer-events: none;
    white-space: nowrap;
  }
  .vacio {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    margin: 0;
    color: var(--ink-mute);
    font-size: 14px;
    pointer-events: none;
  }
</style>
