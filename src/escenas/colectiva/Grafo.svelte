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
    onrastro: (id: string) => void;
  };
  let { rastros, propioId, filtro, onrastro }: Props = $props();

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

  async function compute(el: HTMLElement): Promise<void> {
    const pool = await cargarPool();
    const artDe = (id: string) => {
      const t = pool.find((x) => x.id === id);
      return artUrl(t?.art ?? null, "64");
    };
    layout = layoutGrafo(rastros, el.clientWidth, el.clientHeight, propioId, artDe);
    params.nodos = layout.nodos;
    params.hilos = layout.hilos;
    params.filtro = filtro === "all" ? null : filtro;
    params.onrastro = onrastro;
  }

  const stage = (el: HTMLElement) => {
    mountEl = el;
    void compute(el).then(() => {
      isla = p5Isla(el, grafoSketch, params, paleta);
    });
    return () => {
      isla?.destroy();
      isla = null;
      mountEl = undefined;
    };
  };

  $effect(() => {
    params.filtro = filtro === "all" ? null : filtro;
    params.onrastro = onrastro;
    if (mountEl && rastros.length) void compute(mountEl);
  });
</script>

<div class="grafo" {@attach stage}></div>
<ul class="sr-only">
  {#each rastros as r (r.id)}
    <li>{r.alias ?? "alguien"} · {r.almaId}</li>
  {/each}
</ul>

<style>
  .grafo {
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
