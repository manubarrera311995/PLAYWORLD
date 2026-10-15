<script lang="ts">
  import copy from "./edicion.copy.json";
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
    ontrait: (key: RasgoKey) => void;
  };
  let { porta, art, titulo, subtitulo, meta, filas, yKey, ontrait }: Props = $props();

  const labels = copy.moods as Record<string, string>;
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
  .surco { height: 4px; border-radius: 99px; background: rgba(255, 246, 239, 0.12); overflow: hidden; }
  .surco i { display: block; height: 100%; background: rgba(255, 246, 239, 0.82); }
  .num { font-size: 12px; font-variant-numeric: tabular-nums; text-align: right; color: var(--ink-soft); }
  .barra.is-on {
    margin-inline: -8px;
    padding: 5px 8px;
    border-radius: 8px;
    background: rgba(232, 90, 134, 0.18);
  }
  .barra.is-on .nombre { color: var(--ink); font-size: 12px; }
  .barra.is-on .surco { height: 6px; background: rgba(232, 90, 134, 0.28); }
  .barra.is-on .surco i { background: #e85a86; }
  .barra.is-on .num { color: var(--ink); font-size: 14px; }
</style>
