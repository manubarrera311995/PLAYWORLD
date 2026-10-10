<script lang="ts">
  import { onMount } from "svelte";
  import copy from "./colectiva.copy.json";
  import Marca from "../../ui/Marca.svelte";
  import Asterisco from "../../ui/Asterisco.svelte";
  import Grafo from "./Grafo.svelte";
  import FichaRastro from "./FichaRastro.svelte";
  import { hidratar, rastros, reintentarPendientes } from "../../rastros/store";
  import { recorrido } from "../../estado/recorrido";
  import type { AlmaId } from "../../almas/almas";
  import type { RutaParsed } from "../director/router";
  import { navigate } from "../director/router";

  type Props = { ruta?: RutaParsed };
  let { ruta: _ruta }: Props = $props();

  const rec = $derived($recorrido);
  const store = $derived($rastros);
  let filtro = $state<AlmaId | "all">("all");
  let foco = $state<string | null>(null);

  const mia = $derived(rec.alma?.principal ?? null);
  const ficha = $derived(store.items.find((r) => r.id === foco) ?? null);
  const propioId = $derived(store.propio?.id ?? rec.rastroPropio?.id ?? null);
  const cierreLineas = copy.cierre.split(/(?<=\.)\s+/);

  function ponerFiltro(id: AlmaId | "all"): void {
    filtro = filtro === id ? "all" : id;
    if (filtro !== "all" && ficha && ficha.almaId !== filtro) foco = null;
  }

  onMount(() => {
    void hidratar();
    void reintentarPendientes();
    const tick = setInterval(() => {
      if (document.visibilityState === "visible") void hidratar();
    }, 30_000);
    const vis = () => {
      if (document.visibilityState === "hidden") clearInterval(tick);
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", vis);
    };
  });
</script>

<section class="colectiva">
  <div class="cielo">
    <Grafo
      rastros={store.items}
      {propioId}
      {filtro}
      {foco}
      onrastro={(id) => (foco = id)}
      onfiltro={ponerFiltro}
    />
  </div>

  <header>
    <div class="tope">
      <Marca texto={copy.brand} />
      <Asterisco />
    </div>
    <p class="eyebrow">{copy.parada}</p>
    <p class="eyebrow">{copy.kicker}</p>
    <h1 class="tipo-seccion">{copy.title}</h1>
    <p class="bajada">{copy.bajada}</p>
    <div class="filtros">
      {#if mia}
        <button type="button" class={["filtro", filtro === mia && "is-on"]} onclick={() => ponerFiltro(mia)}>
          {copy.filtroMia}
        </button>
      {/if}
      {#if filtro !== "all"}
        <button type="button" onclick={() => (filtro = "all")}>{copy.filtroTodas}</button>
      {/if}
    </div>
    {#if store.sinSenal}
      <p class="aviso">{copy.avisoSenal}</p>
    {/if}
  </header>

  {#if ficha}
    <FichaRastro
      rastro={ficha}
      propio={ficha.id === propioId}
      oncerrar={() => (foco = null)}
    />
  {/if}

  <footer>
    <p class="cierre">
      {#each cierreLineas as linea (linea)}
        {linea}<br />
      {/each}
    </p>
    <button type="button" onclick={() => navigate("/archivo")}>{copy.ctaAnio}</button>
  </footer>
</section>

<style>
  .colectiva {
    position: relative;
    height: 100%;
    min-height: 100dvh;
    overflow: hidden;
  }
  .cielo {
    position: absolute;
    inset: 0;
  }
  header {
    position: absolute;
    z-index: 2;
    left: var(--pad-x);
    top: 16px;
    width: min(280px, 52vw);
    max-height: calc(100% - 148px);
    overflow: auto;
    display: grid;
    gap: 6px;
    pointer-events: auto;
  }
  .tope { display: flex; align-items: center; gap: 10px; }
  h1 {
    max-width: 10ch;
    font-size: clamp(28px, 5vw, 44px);
  }
  .bajada {
    max-width: 34ch;
    font-size: 15px;
    line-height: 1.4;
    color: var(--ink-soft);
  }
  .filtros { display: flex; flex-wrap: wrap; gap: 8px 16px; }
  .filtros button {
    pointer-events: auto;
    border: 0;
    background: transparent;
    padding: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--ink-soft);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .filtros button.is-on { color: var(--ink-title); }
  .aviso {
    max-width: 36ch;
    font-size: 13px;
    line-height: 1.4;
    color: var(--ink-mute);
  }
  footer {
    position: absolute;
    z-index: 2;
    left: var(--pad-x);
    bottom: 16px;
    width: min(280px, 52vw);
    display: grid;
    gap: 8px;
    pointer-events: none;
  }
  .cierre {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    line-height: 1.7;
    color: rgba(255, 246, 239, 0.78);
  }
  footer button {
    pointer-events: auto;
    justify-self: start;
    border: 0;
    background: transparent;
    padding: 0;
    font: inherit;
    font-size: 13px;
    letter-spacing: 0.04em;
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 4px;
    cursor: pointer;
  }

  @media (min-width: 1024px) {
    .colectiva { display: block; }
    .cielo { position: absolute; inset: 0; min-height: 0; }
    header {
      top: var(--pad-y);
      width: min(300px, 28vw);
      max-height: none;
      gap: 12px;
      overflow: visible;
      pointer-events: none;
    }
    h1 {
      max-width: 9ch;
      font-size: clamp(28px, 5vw, 56px);
    }
    footer {
      position: absolute;
      left: var(--pad-x);
      bottom: 28px;
      width: min(360px, 32vw);
      gap: 14px;
      padding: 0;
    }
  }
</style>
