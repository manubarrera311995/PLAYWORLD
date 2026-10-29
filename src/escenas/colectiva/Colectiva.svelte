<script lang="ts">
  import { onMount } from "svelte";
  import copy from "./colectiva.copy.json";
  import Marca from "../../ui/Marca.svelte";
  import Asterisco from "../../ui/Asterisco.svelte";
  import Grafo from "./Grafo.svelte";
  import FichaRastro from "./FichaRastro.svelte";
  import { hidratar, rastros, reintentarPendientes } from "../../rastros/store";
  import { recorrido } from "../../estado/recorrido";
  import { ALMA_IDS, almas, type AlmaId } from "../../almas/almas";
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

  function tintaDe(id: AlmaId): string {
    const { c1, c2 } = almas[id].paleta;
    const luz = (hex: string) => {
      const n = hex.replace("#", "");
      return (
        0.2126 * Number.parseInt(n.slice(0, 2), 16) +
        0.7152 * Number.parseInt(n.slice(2, 4), 16) +
        0.0722 * Number.parseInt(n.slice(4, 6), 16)
      );
    };
    return luz(c1) >= luz(c2) ? c1 : c2;
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

<section class={["colectiva", ficha && "con-ficha"]}>
  <header>
    <div class="tope">
      <Marca texto={copy.brand} />
      <Asterisco />
    </div>
    <h1>{copy.title}</h1>
    <p class="sentir">{copy.sentir}</p>
    <p class="invitacion">{copy.invitacion}</p>
    <div class="filtros" role="group" aria-label="Filtrar por alma">
      {#each ALMA_IDS as id (id)}
        <button
          type="button"
          class={["filtro", filtro === id && "is-on", filtro !== "all" && filtro !== id && "is-off"]}
          style:color={filtro === id ? tintaDe(id) : undefined}
          aria-pressed={filtro === id}
          onclick={() => ponerFiltro(id)}
        >
          {almas[id].corto}
        </button>
      {/each}
      {#if mia}
        <button
          type="button"
          class={["filtro", filtro === mia && "is-on"]}
          aria-pressed={filtro === mia}
          onclick={() => ponerFiltro(mia)}
        >
          {copy.filtroMia}
        </button>
      {/if}
      {#if filtro !== "all"}
        <button type="button" class="todas" onclick={() => (filtro = "all")}>{copy.filtroTodas}</button>
      {/if}
    </div>
    {#if store.sinSenal}
      <p class="aviso">{copy.avisoSenal}</p>
    {/if}
  </header>

  <div class="cielo">
    <Grafo
      rastros={store.items}
      {propioId}
      {filtro}
      {foco}
      onrastro={(id) => (foco = id)}
    />
  </div>

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
        <span>{linea}</span>
      {/each}
    </p>
    <button type="button" class="cta" onclick={() => navigate("/archivo")}>{copy.ctaAnio}</button>
  </footer>
</section>

<style>
  .colectiva {
    --marca-ancla: 52px;
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 100dvh;
    overflow: hidden;
    padding: 52px var(--pad-x) 20px;
    gap: clamp(28px, 4.6vh, 56px);
  }

  header {
    flex: 0 1 auto;
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: min(100%, 440px);
    scrollbar-width: none;
  }
  header::-webkit-scrollbar {
    display: none;
  }

  .cielo {
    position: relative;
    flex: 1 1 auto;
    min-height: 104px;
    overflow: hidden;
  }

  .tope {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  h1 {
    max-width: 14ch;
    margin-top: clamp(22px, 3vh, 36px);
    font-family: Outfit, sans-serif;
    font-weight: 400;
    font-size: clamp(34px, 8vw, 44px);
    line-height: 1.04;
    letter-spacing: -0.03em;
    color: var(--ink-title);
    text-wrap: balance;
  }

  .sentir {
    max-width: 34ch;
    margin-top: clamp(20px, 2.8vh, 32px);
    font-size: 15px;
    font-weight: 400;
    line-height: 1.5;
    letter-spacing: -0.01em;
    color: var(--ink-soft);
    text-wrap: pretty;
  }

  .invitacion {
    max-width: 36ch;
    margin-top: clamp(14px, 2vh, 20px);
    font-size: 13px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--ink-mute);
    text-wrap: pretty;
  }

  .filtros {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 20px;
    max-width: 40ch;
    margin-top: clamp(28px, 3.6vh, 44px);
  }

  .filtros button {
    border: 0;
    background: transparent;
    padding: 2px 0;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.01em;
    color: rgba(255, 246, 239, 0.74);
    text-decoration: none;
    cursor: pointer;
  }

  .filtros button:hover,
  .filtros button:focus-visible {
    color: var(--ink);
  }

  .filtros button.is-on {
    color: var(--ink-title);
    text-decoration: underline;
    text-underline-offset: 5px;
    text-decoration-thickness: 1px;
  }

  .filtros button.is-off {
    opacity: 0.35;
  }

  .filtros button:focus-visible,
  .cta:focus-visible {
    outline: 1px solid var(--ink);
    outline-offset: 4px;
  }

  .aviso {
    max-width: 36ch;
    margin-top: 18px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--ink-mute);
  }

  footer {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    width: 100%;
  }

  .con-ficha footer {
    visibility: hidden;
  }

  .cierre {
    display: flex;
    flex-direction: column;
    gap: 0.7em;
    max-width: 46ch;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    line-height: 1.35;
    color: rgba(255, 246, 239, 0.62);
  }

  .cierre span {
    display: block;
  }

  .cta {
    border: 0;
    background: transparent;
    padding: 0;
    font: inherit;
    font-size: 13px;
    letter-spacing: 0.02em;
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 5px;
    text-decoration-thickness: 1px;
    cursor: pointer;
  }

  .cta:hover {
    color: var(--ink-title);
  }

  @media (min-width: 1024px) {
    .colectiva {
      display: grid;
      grid-template-columns: min(400px, 32vw) minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr) auto;
      column-gap: clamp(32px, 4vw, 72px);
      row-gap: clamp(32px, 4vh, 48px);
      align-items: stretch;
      --marca-ancla: calc(var(--pad-y) + 36px);
      padding-top: calc(var(--pad-y) + 36px);
      padding-bottom: 28px;
    }

    header {
      grid-column: 1;
      grid-row: 1;
      align-self: stretch;
      width: auto;
      max-width: none;
      overflow: auto;
    }

    .cielo {
      grid-column: 2;
      grid-row: 1;
      min-height: 0;
    }

    h1 {
      font-size: clamp(40px, 3.2vw, 56px);
      line-height: 1.02;
    }

    footer {
      grid-column: 1 / -1;
      grid-row: 2;
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
      gap: 48px;
    }

    .con-ficha footer {
      visibility: visible;
    }

    .cierre {
      font-size: 12px;
      letter-spacing: 0.16em;
      gap: 0.75em;
    }

    .cta {
      flex: 0 0 auto;
      text-align: right;
    }
  }
</style>
