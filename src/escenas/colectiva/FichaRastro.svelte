<script lang="ts">
  import type { Rastro } from "../../rastros/tipos";
  import { almas } from "../../almas/almas";
  import { cargarPool } from "../../datos/pool";
  import type { Track } from "../../datos/tipos";
  import copy from "./colectiva.copy.json";
  import { viewport } from "../../estado/viewport";
  import { onMount } from "svelte";

  type Props = {
    rastro: Rastro;
    propio: boolean;
    compartidos: string[];
    oncerrar: () => void;
  };
  let { rastro, propio, compartidos, oncerrar }: Props = $props();
  const vp = $derived($viewport);
  let tracks = $state<Track[]>([]);

  onMount(() => {
    void cargarPool().then((pool) => {
      tracks = rastro.trackIds
        .map((id) => pool.find((t) => t.id === id))
        .filter((t): t is Track => Boolean(t));
    });
  });
</script>

<aside class={["ficha", vp.modo === "compacto" ? "is-sheet" : "is-side"]}>
  <button type="button" class="x" onclick={oncerrar} aria-label="Cerrar">×</button>
  <p class="eyebrow">{propio ? copy.tu : rastro.alias ?? copy.alguien}</p>
  <h2>{almas[rastro.almaId].nombre}</h2>
  <ul>
    {#each tracks as t (t.id)}
      <li>{t.artist} — {t.track}</li>
    {/each}
  </ul>
  {#if compartidos.length}
    <p class="comp">{copy.comparten}: {compartidos.join(", ")}</p>
  {/if}
</aside>

<style>
  .ficha {
    background: rgba(16, 8, 24, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 16px;
    color: var(--ink);
    z-index: 4;
  }
  .is-side {
    position: absolute;
    right: 16px;
    top: 90px;
    width: min(320px, 34vw);
    border-radius: 16px;
  }
  .is-sheet {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 16px 16px 0 0;
  }
  .x {
    position: absolute;
    right: 10px;
    top: 8px;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 22px;
    cursor: pointer;
  }
  h2 { font-family: Anton, Impact, sans-serif; font-size: 28px; margin: 6px 0 12px; }
  li { font-size: 13px; margin: 4px 0; }
  .comp { margin-top: 10px; font-size: 13px; color: var(--ink-soft); }
</style>
