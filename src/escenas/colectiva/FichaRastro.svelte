<script lang="ts">
  import type { Rastro } from "../../rastros/tipos";
  import { almas, type AlmaId } from "../../almas/almas";
  import { tracksPorIds } from "../../datos/archivo";
  import type { Track } from "../../datos/tipos";
  import copy from "./colectiva.copy.json";
  import cartas from "../creacion/carta.copy.json";
  import { viewport } from "../../estado/viewport";

  type Cara = {
    fondo: string;
    tinta: string;
    pastilla: string;
    caja: string;
    borde: string;
    lineas: string[];
    rasgos: string[];
    lema: string;
  };

  type Props = {
    rastro: Rastro;
    propio: boolean;
    oncerrar: () => void;
  };
  let { rastro, propio, oncerrar }: Props = $props();
  const vp = $derived($viewport);
  let tracks = $state<Track[]>([]);

  const alma = $derived(almas[rastro.almaId]);
  const cara = $derived((cartas as Record<AlmaId, Cara>)[rastro.almaId]);
  const quien = $derived(propio ? copy.tu : rastro.alias ?? copy.alguien);

  const estrellas = [
    { x: 72, y: 4, n: 4.6, g: -8 },
    { x: 4, y: 16, n: 3.2, g: 14 },
    { x: 84, y: 28, n: 3.8, g: 18 },
    { x: 8, y: 42, n: 2.6, g: -16 },
  ];

  $effect(() => {
    const ids = rastro.trackIds;
    const actual = rastro.id;
    void tracksPorIds(ids).then((lista) => {
      if (rastro.id !== actual) return;
      tracks = lista;
    });
  });

  function indice(i: number): string {
    return String(i + 1).padStart(2, "0");
  }
</script>

{#snippet estrella(x: number, y: number, n: number, g: number)}
  <svg
    class="estrella"
    style:left="{x}%"
    style:top="{y}%"
    style:width="{n}%"
    style:transform="rotate({g}deg)"
    viewBox="-12 -12 24 24"
    aria-hidden="true"
  >
    <g fill="currentColor">
      <rect x="-1.7" y="-10.5" width="3.4" height="21" rx="1.7" />
      <rect x="-1.7" y="-10.5" width="3.4" height="21" rx="1.7" transform="rotate(60)" />
      <rect x="-1.7" y="-10.5" width="3.4" height="21" rx="1.7" transform="rotate(120)" />
    </g>
  </svg>
{/snippet}

<aside
  class={["ficha", vp.modo === "compacto" ? "is-sheet" : "is-side"]}
  style:--fondo={cara.fondo}
  style:--tinta={cara.tinta}
  style:--pastilla={cara.pastilla}
  style:--caja={cara.caja}
  style:--borde={cara.borde}
>
  <div class="cara">
    {#each estrellas as s, i (i)}
      {@render estrella(s.x, s.y, s.n, s.g)}
    {/each}
    <div class="tope">
      <p class="ceja">{quien}</p>
      <button type="button" class="x" onclick={oncerrar} aria-label="Cerrar">×</button>
    </div>
    <div class="dibujo">
      <img src="/assets/almas/{alma.id}.png" alt="" />
    </div>
    <h2 class="nombre">
      {#each cara.lineas as linea (linea)}
        <span>{linea}</span>
      {/each}
    </h2>
    <span class="regla" aria-hidden="true"></span>
    <p class="rasgos">{cara.rasgos.join("  ·  ")}</p>
    <p class="pastilla">* {cara.lema} *</p>
    {#if tracks.length}
      <div class="datos">
        <p class="datos-ceja">{copy.seLlevo}</p>
        <ol>
          {#each tracks as t, i (t.id)}
            <li>
              <span class="num">{indice(i)}</span>
              <span>
                <span class="artista">{t.artist}</span>
                <span class="titulo">{t.track}</span>
              </span>
            </li>
          {/each}
        </ol>
      </div>
    {/if}
  </div>
</aside>

<style>
  .ficha {
    z-index: 4;
    overflow: auto;
    color: var(--tinta);
    border: 1.5px solid var(--borde);
    background: var(--fondo);
    box-shadow: 0 18px 40px rgba(20, 0, 40, 0.28);
    container-type: inline-size;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--tinta) 40%, transparent) transparent;
  }

  .cara {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    padding: 7% 7% 6%;
  }

  .cara > :not(.estrella, .tope) {
    position: relative;
    z-index: 1;
  }

  .estrella {
    position: absolute;
    z-index: 0;
    height: auto;
    color: var(--tinta);
    opacity: 0.42;
    pointer-events: none;
  }

  .is-side {
    position: absolute;
    right: var(--pad-x);
    top: 50%;
    width: min(340px, 34vw);
    max-height: min(680px, calc(100% - 160px));
    border-radius: 5.6cqw;
    transform: translateY(-50%);
  }

  .is-sheet {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 12px;
    max-height: min(72dvh, 640px);
    border-radius: 22px;
  }

  .tope {
    position: sticky;
    top: 0;
    z-index: 4;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: -7% -7% 0;
    padding: 5% 4% 2% 7%;
    background: var(--fondo);
  }

  .x {
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
    margin-top: -4px;
    border: 0;
    background: transparent;
    color: var(--tinta);
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
  }

  .x:focus-visible {
    outline: 2px solid var(--tinta);
    outline-offset: 2px;
    border-radius: 999px;
  }

  .ceja,
  .datos-ceja,
  .rasgos {
    font-weight: 500;
  }

  .ceja,
  .datos-ceja {
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .ceja {
    max-width: 16ch;
    padding-top: 4px;
    font-size: clamp(11px, 2.7cqw, 13px);
    line-height: 1.35;
    text-indent: 0.16em;
  }

  .dibujo {
    width: 46%;
    margin: 3% 0 1%;
  }

  .dibujo img {
    display: block;
    width: 100%;
    height: auto;
    max-height: 148px;
    object-fit: contain;
    object-position: left center;
  }

  .nombre span {
    display: block;
    font-family: Outfit, sans-serif;
    font-weight: 800;
    font-size: clamp(32px, 11.2cqw, 46px);
    line-height: 0.88;
    letter-spacing: -0.045em;
  }

  .regla {
    display: block;
    height: 1px;
    margin: 4.2% 0 3%;
    background: currentColor;
    opacity: 0.55;
  }

  .rasgos {
    font-size: clamp(13px, 3cqw, 15px);
    letter-spacing: -0.01em;
  }

  .pastilla {
    align-self: flex-start;
    margin-top: 4.5%;
    padding: 0.62em 1.05em 0.58em;
    border-radius: 999px;
    background: var(--pastilla);
    color: #fff;
    font-family: Outfit, sans-serif;
    font-size: clamp(11px, 2.7cqw, 13px);
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1;
    text-transform: uppercase;
  }

  .datos {
    margin-top: 6%;
    padding: 4.5% 5% 2%;
    border-radius: 4.4cqw;
    background: var(--caja);
    color: #fff;
  }

  .datos-ceja {
    margin-bottom: 0.4em;
    font-size: clamp(10px, 2.15cqw, 12px);
    opacity: 0.72;
  }

  ol {
    list-style: none;
  }

  li {
    display: grid;
    grid-template-columns: 1.7em 1fr;
    column-gap: 0.4em;
    padding: 0.55em 0 0.45em;
    border-top: 1px solid rgba(255, 255, 255, 0.22);
  }

  .num {
    padding-top: 0.28em;
    font-size: clamp(10px, 2.15cqw, 12px);
    font-weight: 500;
    letter-spacing: 0.08em;
    opacity: 0.72;
  }

  .artista,
  .titulo {
    display: block;
  }

  .artista {
    font-size: clamp(11px, 2.5cqw, 13px);
    font-weight: 500;
    opacity: 0.72;
  }

  .titulo {
    margin-top: 0.08em;
    font-family: Outfit, sans-serif;
    font-weight: 700;
    font-size: clamp(14px, 3.35cqw, 16px);
    line-height: 1.15;
    letter-spacing: -0.03em;
  }
</style>
