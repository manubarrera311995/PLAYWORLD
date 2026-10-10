<script lang="ts">
  import { paleta } from "../../sketches/paleta";
  import { p5Isla, type Isla } from "../../sketches/p5Isla";
  import { grafoSketch, type GrafoParams } from "../../sketches/grafo.sketch";
  import { layoutGrafo, type LayoutGrafo } from "./layout";
  import type { Rastro } from "../../rastros/tipos";
  import { ALMA_IDS, almas, type AlmaId } from "../../almas/almas";
  import { cargarPool } from "../../datos/pool";
  import { artUrl } from "../../datos/color";

  type Props = {
    rastros: Rastro[];
    propioId: string | null;
    filtro: AlmaId | "all";
    foco: string | null;
    onrastro: (id: string) => void;
    onfiltro: (id: AlmaId) => void;
  };
  let { rastros, propioId, filtro, foco, onrastro, onfiltro }: Props = $props();

  let mountEl: HTMLElement | undefined = $state();
  let isla: Isla | null = null;
  let layout = $state<LayoutGrafo | null>(null);
  const params: GrafoParams = {
    nodos: [],
    hilos: [],
    filtro: null,
    foco: null,
    onrastro: (id) => onrastro(id),
  };

  async function compute(el: HTMLElement, items: Rastro[], propio: string | null): Promise<void> {
    const pool = await cargarPool();
    if (mountEl !== el) return;
    const artDe = (id: string) => {
      const t = pool.find((x) => x.id === id);
      return artUrl(t?.art ?? null, "64");
    };
    layout = layoutGrafo(items, el.clientWidth, el.clientHeight, propio, artDe);
    params.nodos = layout.nodos;
    params.hilos = layout.hilos;
  }

  const stage = (el: HTMLElement) => {
    mountEl = el;
    void compute(el, rastros, propioId).then(() => {
      if (mountEl !== el) return;
      isla = p5Isla(el, grafoSketch, params, paleta);
    });
    const ro = new ResizeObserver(() => {
      if (el.clientWidth > 1) void compute(el, rastros, propioId);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      isla?.destroy();
      isla = null;
      mountEl = undefined;
    };
  };

  $effect(() => {
    params.filtro = filtro === "all" ? null : filtro;
    params.foco = foco;
    params.onrastro = onrastro;
  });

  $effect(() => {
    const items = rastros;
    const propio = propioId;
    if (mountEl && items.length) void compute(mountEl, items, propio);
  });
</script>

<div class="grafo">
  <div class="lienzo" {@attach stage}></div>
  {#if layout}
    <div class="nombres">
      {#each ALMA_IDS as id (id)}
        {@const c = layout.centros[id]}
        <button
          type="button"
          class={["constelacion", filtro !== "all" && filtro !== id && "is-off", filtro === id && "is-on"]}
          style:left="{c.x}px"
          style:top="{c.y}px"
          onclick={() => onfiltro(id)}
        >
          {almas[id].corto}
        </button>
      {/each}
    </div>
  {/if}
</div>
<ul class="sr-only">
  {#each rastros as r (r.id)}
    <li>{r.alias ?? "alguien"} · {r.almaId}</li>
  {/each}
</ul>

<style>
  .grafo {
    position: absolute;
    inset: 0;
  }
  .lienzo {
    position: absolute;
    inset: 0;
    touch-action: none;
  }
  .nombres {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .constelacion {
    position: absolute;
    transform: translate(-50%, calc(-100% - 18px));
    max-width: 14ch;
    border: 0;
    background: transparent;
    padding: 0;
    color: rgba(255, 246, 239, 0.78);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    text-align: center;
    line-height: 1.35;
    cursor: pointer;
    pointer-events: auto;
  }
  .constelacion.is-off { opacity: 0.28; }
  .constelacion.is-on { color: #fff8f1; }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
