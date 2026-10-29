<script lang="ts">
  import { untrack } from "svelte";
  import type { Track } from "../../datos/tipos";
  import { artUrl } from "../../datos/color";
  import copy from "../ipod.copy.json";
  import { abrirPreview, ALTO_PREVIEW, type MandoSpotify } from "../spotify";

  type Props = {
    track: Track;
    metida: boolean;
    llena: boolean;
    fija?: boolean;
    onmeter: () => void;
    onmando: (mando: MandoSpotify | null) => void;
  };
  let { track, metida, llena, fija = false, onmeter, onmando }: Props = $props();
  const art = $derived(artUrl(track.art, "300"));

  let slot = $state<HTMLDivElement | null>(null);
  let listoDe = $state<string | null>(null);
  let falloDe = $state<string | null>(null);
  const listo = $derived(listoDe === track.spotifyId);
  const fallo = $derived(falloDe === track.spotifyId);

  $effect(() => {
    const el = slot;
    const id = track.spotifyId;
    if (!el || !id) return;
    const avisar = untrack(() => onmando);
    const cerrar = abrirPreview(
      el,
      id,
      (mando) => {
        listoDe = id;
        avisar(mando);
      },
      () => {
        falloDe = id;
      },
    );
    return () => {
      cerrar();
      avisar(null);
    };
  });
</script>

<div class="cancion">
  {#if art}
    <img src={art} alt="" width="72" height="72" />
  {/if}
  <div class="meta">
    <p class="art">{track.artist}</p>
    <h2>{track.track}</h2>
    <p class="y">{track.year}</p>
  </div>
  {#if !track.spotifyId}
    <p class="nota">{copy.sinPreview}</p>
  {:else if fallo}
    <p class="nota">{copy.previewFallo}</p>
  {:else}
    <div class="preview" class:listo style="--alto: {ALTO_PREVIEW}px" aria-busy={!listo}>
      <div class="slot" bind:this={slot}></div>
      {#if !listo}
        <div class="carga" role="status">
          <span class="carga__txt">{copy.cargando}</span>
          <span class="carga__pista" aria-hidden="true">
            <span class="carga__carro"></span>
          </span>
        </div>
      {/if}
    </div>
  {/if}
  <button type="button" onclick={onmeter} disabled={fija || (!metida && llena)}>
    {fija ? copy.teclas.centro.metida : metida ? copy.quitar : llena ? copy.lleno : copy.meter}
  </button>
</div>

<style>
  .cancion {
    box-sizing: border-box;
    height: 100%;
    min-height: 100%;
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    grid-template-rows: auto auto auto;
    grid-template-areas:
      "art meta"
      "play play"
      "btn btn";
    align-content: start;
    align-items: center;
    gap: 8px;
    padding: 10px 8px 8px;
    color: #111;
    font-family: "DM Sans", Helvetica, Arial, sans-serif;
  }
  .meta { grid-area: meta; min-width: 0; }
  h2 {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
  }
  .art, .y, .nota {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: #4a4a4a;
  }
  .nota { grid-area: play; align-self: start; white-space: normal; }
  .preview {
    position: relative;
    grid-area: play;
    width: 100%;
    height: var(--alto, 80px);
    min-height: var(--alto, 80px);
    overflow: hidden;
    border-radius: 4px;
    align-self: start;
    background: #f4f4f4;
    box-shadow: inset 0 0 0 1px #c6c6c6;
  }
  .preview:not(.listo) :global(iframe) {
    position: absolute;
    inset: 0;
    width: 100% !important;
    height: var(--alto, 80px) !important;
    opacity: 0;
    pointer-events: none;
  }
  .preview.listo :global(iframe) {
    display: block;
    width: 100% !important;
    height: var(--alto, 80px) !important;
    border: 0;
    opacity: 1;
    transition: opacity 280ms ease;
  }
  .carga {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    padding: 8px 10px;
    background: linear-gradient(180deg, #f7f7f7 0%, #e4e4e4 100%);
  }
  .carga__txt {
    font-size: 12px;
    letter-spacing: 0.04em;
    color: #3a3a3a;
  }
  .carga__pista {
    position: relative;
    height: 8px;
    border-radius: 999px;
    overflow: hidden;
    background: linear-gradient(180deg, #c6c6c6, #efefef);
    box-shadow:
      inset 0 1px 2px rgba(0, 0, 0, 0.32),
      0 1px 0 rgba(255, 255, 255, 0.85);
  }
  .carga__carro {
    position: absolute;
    top: 0;
    left: 0;
    width: 42%;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(180deg, #8ec4ff 0%, #2d78e8 46%, #1c62d6 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
    animation: ipod-carga-slider 1.15s ease-in-out infinite;
  }
  @keyframes ipod-carga-slider {
    0% { transform: translateX(-8%); }
    100% { transform: translateX(155%); }
  }
  @media (prefers-reduced-motion: reduce) {
    .carga__carro {
      animation: none;
      width: 58%;
    }
    .preview.listo :global(iframe) { transition: none; }
  }
  button {
    grid-area: btn;
    width: 100%;
    border: 0;
    background: linear-gradient(180deg, #6aafff 0%, #2d78e8 42%, #1c62d6 100%);
    color: #fff;
    padding: 7px 12px;
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
  }
  button:disabled {
    background: #d5d5d5;
    color: #6e6e6e;
    cursor: default;
  }
  .cancion:not(:has(img)) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "meta"
      "play"
      "btn";
  }
  img {
    grid-area: art;
    width: 72px;
    height: 72px;
    object-fit: cover;
    border-radius: 2px;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.18);
  }
</style>
