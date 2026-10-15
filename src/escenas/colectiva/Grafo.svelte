<script lang="ts">
  import { paleta } from "../../sketches/paleta";
  import { p5Isla, type Isla } from "../../sketches/p5Isla";
  import { grafoSketch, type GrafoParams } from "../../sketches/grafo.sketch";
  import { layoutGrafo, type LayoutGrafo } from "./layout";
  import type { Rastro } from "../../rastros/tipos";
  import type { AlmaId } from "../../almas/almas";
  import { cargarPool } from "../../datos/pool";
  import { artUrl } from "../../datos/color";

  type Props = {
    rastros: Rastro[];
    propioId: string | null;
    filtro: AlmaId | "all";
    foco: string | null;
    onrastro: (id: string) => void;
  };
  let { rastros, propioId, filtro, foco, onrastro }: Props = $props();

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
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
