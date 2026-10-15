<script lang="ts">
  import copy from "./edicion.copy.json";
  import { fill } from "./ficha";
  import type { RasgoKey } from "./lectura";

  type Card = { key: RasgoKey; median: number; bins: number[] };

  type Props = {
    cards: readonly Card[];
    yKey: RasgoKey;
  };
  let { cards, yKey }: Props = $props();

  const labels = copy.moods as Record<string, string>;
  const nombres = copy.rasgos.groups;
  const activa = $derived(cards.find((card) => card.key === yKey) ?? null);
  const nombre = $derived(activa ? (labels[activa.key] ?? activa.key) : "");
  const grupos = $derived(
    nombres.map((grupo, i) => ({
      label: grupo.label,
      range: grupo.range,
      n: (activa?.bins[i * 2] ?? 0) + (activa?.bins[i * 2 + 1] ?? 0),
    })),
  );
  const max = $derived(Math.max(...grupos.map((grupo) => grupo.n), 1));
  const medio = $derived(Math.round(max / 2));

  let tip = $state<{ x: number; y: number; text: string } | null>(null);

  function cuenta(n: number): string {
    return n === 1 ? copy.tablero.one : fill(copy.tablero.many, { n });
  }

  function mostrar(e: PointerEvent, n: number) {
    const host = (e.currentTarget as HTMLElement).closest(".barras")?.getBoundingClientRect();
    if (!host) return;
    tip = {
      x: e.clientX - host.left,
      y: e.clientY - host.top,
      text: cuenta(n),
    };
  }
</script>

<div class="vista">
  {#if !activa}
    <p class="vacio">{copy.tablero.empty}</p>
  {:else}
    <p class="intro">{copy.tablero.rasgosHint}</p>
    <figure class="chart" aria-label={fill(copy.rasgos.chartAria, { trait: nombre })}>
      <div class="y-nombre">{copy.rasgos.y}</div>
      <div class="cuerpo">
        <div class="lienzo">
          <div class="marcas" aria-hidden="true">
            <span>{max}</span>
            {#if medio > 0 && medio < max}<span>{medio}</span>{:else}<span></span>{/if}
            <span>0</span>
          </div>
          <div class="barras">
            <i class="guia"></i>
            {#each grupos as grupo (grupo.label)}
              <div
                class="col"
                onpointerenter={(e) => mostrar(e, grupo.n)}
                onpointermove={(e) => mostrar(e, grupo.n)}
                onpointerleave={() => (tip = null)}
              >
                <span class="track">
                  <i style:height={`${Math.round((100 * grupo.n) / max)}%`}></i>
                </span>
              </div>
            {/each}
            {#if tip}
              <p class="tip" style:left="{tip.x}px" style:top="{tip.y}px">{tip.text}</p>
            {/if}
          </div>
        </div>
        <div class="eje-x" aria-hidden="true">
          <span></span>
          <div class="grupos">
            {#each grupos as grupo (grupo.label)}
              <span class="grupo">
                <span class="nivel">{grupo.label}</span>
                <span class="rango">{grupo.range}</span>
              </span>
            {/each}
          </div>
        </div>
        <div class="leyenda-x" aria-hidden="true">
          <span></span>
          <span>{copy.rasgos.x}</span>
        </div>
      </div>
    </figure>
  {/if}
</div>

<style>
  .vista {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .intro { margin: 0; color: var(--ink-mute); font-size: 12px; }
  .vacio { margin: auto; color: var(--ink-mute); font-size: 14px; }
  .chart {
    flex: 1;
    min-height: 0;
    margin: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 10px;
  }
  .y-nombre {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    align-self: center;
    color: var(--ink-mute);
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .cuerpo {
    min-height: 0;
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto auto;
    gap: 8px;
  }
  .lienzo {
    min-height: 0;
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
  }
  .marcas {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
    padding-right: 8px;
    color: rgba(255, 246, 239, 0.42);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.08em;
  }
  .barras {
    position: relative;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px;
    min-height: 0;
    border-bottom: 1px solid rgba(255, 246, 239, 0.28);
    border-left: 1px solid rgba(255, 246, 239, 0.28);
  }
  .guia {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    border-top: 1px solid rgba(255, 246, 239, 0.14);
    pointer-events: none;
  }
  .col { min-width: 0; min-height: 0; }
  .col:hover .track i { background: #fff; }
  .tip {
    position: absolute;
    z-index: 2;
    transform: translate(-50%, calc(-100% - 12px));
    margin: 0;
    padding: 6px 10px;
    border-radius: 8px;
    background: rgba(18, 8, 14, 0.92);
    border: 1px solid rgba(255, 246, 239, 0.16);
    color: var(--ink);
    font-size: 12px;
    pointer-events: none;
    white-space: nowrap;
  }
  .track {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    height: 100%;
  }
  .track i {
    display: block;
    width: 58%;
    background: rgba(255, 246, 239, 0.88);
  }
  .eje-x {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
  }
  .grupos {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px;
  }
  .grupo {
    display: grid;
    gap: 2px;
    text-align: center;
  }
  .nivel {
    color: var(--ink-soft);
    font-size: 12px;
  }
  .rango {
    color: rgba(255, 246, 239, 0.42);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
  }
  .leyenda-x {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
  }
  .leyenda-x span:last-child {
    color: var(--ink-mute);
    font-size: 11px;
    letter-spacing: 0.14em;
    text-align: center;
    text-transform: uppercase;
  }
</style>
