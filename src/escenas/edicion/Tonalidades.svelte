<script lang="ts">
  import copy from "./edicion.copy.json";

  type Nota = { note: string; n: number };
  type Props = { notas: Nota[] };
  let { notas }: Props = $props();

  const maxN = $derived(Math.max(...notas.map((nota) => nota.n), 1));
</script>

{#if notas.length}
  <figure class="chart">
    <ul class="plot" aria-label={copy.rasgos.keysAria}>
      {#each notas as nota (nota.note)}
        <li>
          <span class="note">{nota.note}</span>
          <span class="track">
            <span class="fill" style:width={`${Math.max(2, Math.round((100 * nota.n) / maxN))}%`}></span>
          </span>
          <span class="count">{nota.n}</span>
        </li>
      {/each}
    </ul>
    <div class="axis" aria-hidden="true">
      <span></span>
      <span class="ticks">
        <span>0</span>
        <span>{maxN}</span>
      </span>
      <span></span>
    </div>
  </figure>
{/if}

<style>
  .chart {
    margin: 0;
    max-width: 760px;
  }
  .plot {
    list-style: none;
    display: grid;
    gap: 9px;
    margin: 0;
    padding: 0;
  }
  .plot li,
  .axis {
    display: grid;
    grid-template-columns: 3ch minmax(0, 1fr) 4ch;
    gap: 12px;
    align-items: center;
  }
  .note {
    color: var(--ink-soft);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }
  .count {
    color: var(--ink);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .track {
    display: block;
    height: 18px;
    background: rgba(255, 246, 239, 0.08);
  }
  .fill {
    display: block;
    height: 100%;
    background: rgba(255, 246, 239, 0.82);
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
</style>
