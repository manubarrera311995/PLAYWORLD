<script lang="ts">
  import { onMount } from "svelte";
  import copy from "./colectiva.copy.json";
  import Marca from "../../ui/Marca.svelte";
  import FiltroAlmas from "./FiltroAlmas.svelte";
  import Grafo from "./Grafo.svelte";
  import FichaRastro from "./FichaRastro.svelte";
  import { hidratar, rastros, reintentarPendientes } from "../../rastros/store";
  import { recorrido } from "../../estado/recorrido";
  import type { AlmaId } from "../../almas/almas";
  import type { RutaParsed } from "../director/router";
  import { cargarPool } from "../../datos/pool";

  type Props = { ruta?: RutaParsed };
  let { ruta: _ruta }: Props = $props();

  const rec = $derived($recorrido);
  const store = $derived($rastros);
  let filtro = $state<AlmaId | "all">("all");
  let foco = $state<string | null>(null);
  let nombres = $state<Record<string, string>>({});

  const ficha = $derived(store.items.find((r) => r.id === foco) ?? null);
  const compartidos = $derived.by(() => {
    if (!ficha || !rec.seleccion) return [];
    const ids = ficha.trackIds.filter((id) => rec.seleccion?.trackIds.includes(id));
    return ids.map((id) => nombres[id] ?? id);
  });

  onMount(() => {
    if (rec.alma) filtro = rec.alma.principal;
    void hidratar();
    void reintentarPendientes();
    void cargarPool().then((pool) => {
      nombres = Object.fromEntries(pool.map((t) => [t.id, `${t.track}`]));
    });
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
  <header>
    <Marca texto={copy.brand} />
    <h1 class="tipo-seccion">{copy.title}</h1>
    <p class="eyebrow">{copy.kicker}</p>
    <FiltroAlmas actual={filtro} mia={rec.alma?.principal ?? null} onchange={(id) => (filtro = id)} />
  </header>
  <div class="stage">
    <Grafo
      rastros={store.items}
      propioId={store.propio?.id ?? rec.rastroPropio?.id ?? null}
      {filtro}
      onrastro={(id) => (foco = id)}
    />
    {#if ficha}
      <FichaRastro
        rastro={ficha}
        propio={ficha.id === (store.propio?.id ?? rec.rastroPropio?.id)}
        {compartidos}
        oncerrar={() => (foco = null)}
      />
    {/if}
  </div>
  {#if store.sinSenal}
    <p class="aviso">{copy.avisoSenal}</p>
  {/if}
</section>

<style>
  .colectiva {
    height: 100%;
    min-height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    padding: var(--pad-y) var(--pad-x) 12px;
    gap: 8px;
  }
  header { display: grid; gap: 8px; position: relative; z-index: 2; }
  .stage { position: relative; min-height: 0; }
  .aviso { font-size: 12px; color: var(--ink-mute); text-align: center; }
</style>
