<script lang="ts">
  import type { RasgoKey } from "./lectura";
  import { round } from "./ficha";
  import copy from "./edicion.copy.json";

  type Fila = { key: RasgoKey; median: number };

  type Props = {
    filas: Fila[];
    rasgo: RasgoKey | string;
    onrasgo: (key: RasgoKey) => void;
  };
  let { filas, rasgo, onrasgo }: Props = $props();

  const labels = copy.moods as Record<string, string>;
  const barras = $derived([...filas].sort((a, b) => b.median - a.median || a.key.localeCompare(b.key)));

  function ancho(median: number): number {
    return Math.max(0, Math.min(100, median));
  }
</script>

<div class="rasgos">
  <figure class="chart">
    <div class="plot" role="group" aria-label={copy.rasgos.aria}>
      {#each barras as fila (fila.key)}
        {@const on = fila.key === rasgo}
        <button
          type="button"
          class={["bar", on && "is-on"]}
          aria-pressed={on}
          onclick={() => onrasgo(fila.key)}
        >
          <span class="name">{labels[fila.key] ?? fila.key}</span>
          <span class="track">
            <span class="fill" style:width={`${ancho(fila.median)}%`}></span>
          </span>
          <span class="val">{round(fila.median)}</span>
        </button>
      {/each}
      <div class="axis" aria-hidden="true">
        <span></span>
        <span class="ticks">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </span>
        <span></span>
      </div>
    </div>
    <figcaption>{copy.rasgos.method}</figcaption>
  </figure>
</div>

<style>
  .chart {
    margin: 0;
    max-width: 760px;
  }
  .plot {
    display: grid;
    gap: 9px;
  }
  .bar,
  .axis {
    display: grid;
    grid-template-columns: 11ch minmax(0, 1fr) 3ch;
    gap: 12px;
    align-items: center;
  }
  .bar {
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .bar:focus-visible {
    outline: 1px solid var(--c1);
    outline-offset: 3px;
  }
  .name,
  .val,
  figcaption {
    font-size: 13px;
    line-height: 1.3;
  }
  .name {
    color: var(--ink-soft);
  }
  .val {
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .val {
    color: var(--ink);
  }
  .track {
    position: relative;
    display: block;
    height: 18px;
    background: rgba(255, 246, 239, 0.08);
  }
  .track::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    background: rgba(255, 246, 239, 0.22);
  }
  .fill {
    position: relative;
    display: block;
    height: 100%;
    background: rgba(255, 246, 239, 0.82);
  }
  .bar.is-on .name,
  .bar.is-on .val {
    color: var(--ink);
  }
  .bar.is-on .fill {
    background: var(--c1);
  }
  .ticks {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid rgba(255, 246, 239, 0.28);
    padding-top: 6px;
    color: rgba(255, 246, 239, 0.42);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.08em;
  }
  figcaption {
    max-width: 62ch;
    margin-top: 14px;
    color: var(--ink-mute);
  }
  @media (max-width: 640px) {
    .bar,
    .axis {
      grid-template-columns: 9.5ch minmax(0, 1fr) 2.6ch;
      gap: 8px;
    }
    .name,
    .val {
      font-size: 12px;
    }
  }
</style>
