<script lang="ts">
  import type { Rastro } from "../../rastros/tipos";
  import { almas } from "../../almas/almas";
  import { tracksPorIds } from "../../datos/archivo";
  import type { Track } from "../../datos/tipos";
  import copy from "./colectiva.copy.json";
  import { viewport } from "../../estado/viewport";

  type Props = {
    rastro: Rastro;
    propio: boolean;
    oncerrar: () => void;
  };
  let { rastro, propio, oncerrar }: Props = $props();
  const vp = $derived($viewport);
  let tracks = $state<Track[]>([]);

  const alma = $derived(almas[rastro.almaId]);
  const tinta = $derived.by(() => {
    const luz = (hex: string) => {
      const n = hex.replace("#", "");
      return (
        0.2126 * Number.parseInt(n.slice(0, 2), 16) +
        0.7152 * Number.parseInt(n.slice(2, 4), 16) +
        0.0722 * Number.parseInt(n.slice(4, 6), 16)
      );
    };
    return luz(alma.paleta.c1) >= luz(alma.paleta.c2) ? alma.paleta.c1 : alma.paleta.c2;
  });

  $effect(() => {
    const ids = rastro.trackIds;
    const actual = rastro.id;
    void tracksPorIds(ids).then((lista) => {
      if (rastro.id !== actual) return;
      tracks = lista;
    });
  });
</script>

<aside
  class={["ficha", "vidrio", vp.modo === "compacto" ? "is-sheet" : "is-side"]}
  style:--alma={tinta}
>
  <button type="button" class="x" onclick={oncerrar} aria-label="Cerrar">×</button>
  <p class="quien">{propio ? copy.tu : rastro.alias ?? copy.alguien}</p>
  <h2>{alma.nombre}</h2>
  <p class="frase">{alma.frase}</p>
  {#if tracks.length}
    <p class="se-llevo">{copy.seLlevo}</p>
    <ol>
      {#each tracks as t, i (t.id)}
        <li>
          <span class="num">0{i + 1}</span>
          <span>
            <span class="artista">{t.artist}</span>
            <span class="titulo">{t.track}</span>
          </span>
        </li>
      {/each}
    </ol>
  {/if}
</aside>

<style>
  .ficha {
    z-index: 4;
    color: var(--ink);
    padding: 22px 22px 18px 26px;
  }
  .ficha::before {
    content: "";
    position: absolute;
    left: 10px;
    top: 22px;
    bottom: 22px;
    width: 2px;
    border-radius: 2px;
    background: var(--alma, #fff6ef);
    z-index: 3;
  }
  .ficha > * { position: relative; z-index: 3; }
  .is-side {
    position: absolute;
    right: 48px;
    top: 50%;
    width: min(320px, 34vw);
    max-height: min(760px, calc(100% - 48px));
    transform: translateY(-50%);
    overflow: auto;
  }
  .is-sheet {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: 62dvh;
    border-radius: 18px 18px 0 0;
    overflow: auto;
    background: linear-gradient(180deg, rgba(62, 24, 58, 0.9), rgba(32, 12, 36, 0.94));
    backdrop-filter: blur(18px) saturate(1.2);
    -webkit-backdrop-filter: blur(18px) saturate(1.2);
  }
  .x {
    position: absolute;
    z-index: 4;
    right: 12px;
    top: 12px;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--ink-mute);
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
  }
  .quien {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  h2 {
    font-family: Anton, Impact, sans-serif;
    font-weight: 400;
    font-size: 34px;
    line-height: 0.95;
    letter-spacing: -0.02em;
    margin: 8px 0 10px;
    max-width: 12ch;
  }
  .frase {
    max-width: 28ch;
    font-size: 14px;
    line-height: 1.4;
    color: var(--ink-soft);
  }
  .se-llevo {
    margin: 18px 0 0;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  ol { list-style: none; }
  li {
    display: grid;
    grid-template-columns: 22px 1fr;
    column-gap: 8px;
    padding: 8px 0 7px;
    border-top: 1px solid rgba(255, 246, 239, 0.14);
  }
  .num {
    padding-top: 3px;
    font-size: 10px;
    letter-spacing: 0.12em;
    color: rgba(255, 246, 239, 0.55);
  }
  .artista, .titulo { display: block; }
  .artista { font-size: 11px; color: var(--ink-mute); }
  .titulo { font-size: 14px; font-weight: 500; letter-spacing: -0.01em; }
</style>
