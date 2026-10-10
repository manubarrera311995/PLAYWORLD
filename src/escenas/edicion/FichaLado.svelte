<script lang="ts">
  import copy from "./edicion.copy.json";
  import { fill } from "./ficha";
  import type { RasgoKey } from "./lectura";

  type Fila = { key: RasgoKey; value: number };

  type Props = {
    porta: boolean;
    art: string | null;
    titulo: string;
    subtitulo: string;
    meta: string;
    filas: readonly Fila[];
    yKey: RasgoKey;
    tempo: number | null;
    menor: string;
    bins: readonly number[];
    marca: number | null;
    ontrait: (key: RasgoKey) => void;
  };
  let { porta, art, titulo, subtitulo, meta, filas, yKey, tempo, menor, bins, marca, ontrait }: Props = $props();

  const labels = copy.moods as Record<string, string>;
  const max = $derived(Math.max(...bins, 1));
  const etiqueta = $derived(labels[yKey] ?? yKey);
</script>

<aside class="panel">
  <div class="cabeza">
    {#if porta}
      <div class="tapa">
        {#if art}<img alt="" src={art} />{/if}
      </div>
    {/if}
    <p class="quien">{titulo}</p>
    <p class="tema">{subtitulo}</p>
    {#if meta}<p class="meta">{meta}</p>{/if}
  </div>
  <div class="cuerpo">
    {#each filas as fila (fila.key)}
      <button
        type="button"
        class={["barra", fila.key === yKey && "is-on"]}
        aria-pressed={fila.key === yKey}
        onclick={() => ontrait(fila.key)}
      >
        <span class="nombre">{labels[fila.key] ?? fila.key}</span>
        <span class="surco"><i style:width="{fila.value}%"></i></span>
        <span class="num">{fila.value}</span>
      </button>
    {/each}
    <div class="linea"><span>{copy.tablero.tempo}</span><span>{tempo ?? "—"} bpm</span></div>
    {#if menor}
      <div class="linea"><span>{copy.stats.minor}</span><span>{menor}</span></div>
    {/if}
    <div class="hist">
      {#each bins as n, i (i)}
        <i style:height="{Math.max(4, Math.round((n / max) * 100))}%"></i>
      {/each}
      {#if marca != null}<i class="aguja" style:left="{marca}%"></i>{/if}
    </div>
    <p class="hist-ley">{fill(copy.tablero.hist, { trait: etiqueta })}</p>
  </div>
</aside>

<style>
  .panel {
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 14px;
    overflow: hidden;
    border-radius: 22px;
    border: 1px solid rgba(255, 246, 239, 0.16);
    background: rgba(16, 8, 14, 0.46);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
  .cabeza { text-align: center; padding-bottom: 8px; }
  .quien { margin: 0; font-size: 13px; color: var(--ink-soft); }
  .tema { margin: 2px 0 0; font-size: 16px; font-weight: 500; letter-spacing: -0.02em; }
  .meta { margin: 4px 0 0; color: var(--ink-mute); font-size: 12px; }
  .tapa {
    width: 74px;
    height: 74px;
    margin: 4px auto 10px;
    border-radius: 50%;
    overflow: hidden;
    background: radial-gradient(circle at 40% 35%, #ffb15a, #d3263e 58%, #3a0a16);
  }
  .tapa img { width: 100%; height: 100%; object-fit: cover; }
  .cuerpo { min-height: 0; overflow: auto; padding-right: 4px; }
  .barra {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr) 28px;
    gap: 8px;
    align-items: center;
    width: 100%;
    margin: 3px 0;
    padding: 2px 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .nombre { font-size: 11px; color: var(--ink-soft); }
  .barra.is-on .nombre { color: var(--ink); }
  .surco { height: 4px; border-radius: 99px; background: rgba(255, 246, 239, 0.12); overflow: hidden; }
  .surco i { display: block; height: 100%; background: rgba(255, 246, 239, 0.82); }
  .barra.is-on .surco i { background: #fff; }
  .num { font-size: 12px; font-variant-numeric: tabular-nums; text-align: right; }
  .linea {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    color: var(--ink-soft);
    font-size: 12px;
  }
  .hist {
    position: relative;
    display: flex;
    align-items: end;
    gap: 3px;
    height: 64px;
    margin-top: 14px;
  }
  .hist i {
    flex: 1;
    display: block;
    background: rgba(255, 246, 239, 0.8);
    border-radius: 2px 2px 0 0;
    min-height: 2px;
  }
  .hist i.aguja {
    position: absolute;
    top: 0;
    bottom: 0;
    flex: none;
    width: 2px;
    min-height: 0;
    background: #e85a86;
    border-radius: 0;
    transform: translateX(-1px);
  }
  .hist-ley {
    margin: 6px 0 0;
    color: var(--ink-mute);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
</style>
