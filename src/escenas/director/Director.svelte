<script lang="ts">
  import { onMount, tick } from "svelte";
  import { get } from "svelte/store";
  import type { Component } from "svelte";
  import { SvelteMap } from "svelte/reactivity";
  import Home from "../home/Home.svelte";
  import Hook from "../hook/Hook.svelte";
  import Archivo from "../archivo/Archivo.svelte";
  import Edicion from "../edicion/Edicion.svelte";
  import IpodEscena from "../ipod/IpodEscena.svelte";
  import Creacion from "../creacion/Creacion.svelte";
  import Colectiva from "../colectiva/Colectiva.svelte";
  import { currentRuta, hrefOf, initRouter, subscribe, type RutaParsed } from "./router";
  import { crossfade } from "./transiciones";
  import { reduce } from "../../motion/reducedMotion";
  import { parcheRecorrido } from "../../estado/recorrido";
  import { precargarPool } from "../../datos/archivo";

  type Fase = "enter" | "leave" | "live";
  type Capa = { id: number; ruta: RutaParsed; fase: Fase };

  const escenas = {
    home: Home,
    hook: Hook,
    archivo: Archivo,
    edicion: Edicion,
    ipod: IpodEscena,
    creacion: Creacion,
    colectiva: Colectiva,
  } satisfies Record<RutaParsed["name"], Component<{ ruta?: RutaParsed }>>;

  const SCROLL = new Set<RutaParsed["name"]>(["home", "hook", "edicion", "creacion"]);

  let seq = 0;
  let busy = false;
  let capas = $state.raw<Capa[]>([{ id: 0, ruta: currentRuta(), fase: "live" }]);
  const nodos = new SvelteMap<number, HTMLElement>();

  function registrar(el: HTMLElement) {
    const id = Number(el.dataset.capa);
    nodos.set(id, el);
    return () => {
      nodos.delete(id);
    };
  }

  function viva(): Capa | undefined {
    return capas.find((c) => c.fase !== "leave");
  }

  function syncRecorrido(r: RutaParsed): void {
    if (r.name === "archivo" && r.year) parcheRecorrido({ yearHint: r.year });
    if (r.name === "edicion") {
      parcheRecorrido({ edicionAbierta: r.year, yearHint: r.year });
    }
    if (r.name === "archivo" || r.name === "edicion" || r.name === "ipod") {
      void precargarPool();
    }
  }

  async function ir(next: RutaParsed): Promise<void> {
    const actual = viva();
    if (!actual) return;
    if (hrefOf(next) === hrefOf(actual.ruta)) return;
    if (next.name === actual.ruta.name) {
      capas = capas.map((c) => (c.id === actual.id ? { ...c, ruta: next } : c));
      syncRecorrido(next);
      return;
    }
    if (busy) return;
    busy = true;
    const leaveId = actual.id;
    const enterId = ++seq;
    capas = [
      { ...actual, fase: "leave" },
      { id: enterId, ruta: next, fase: "enter" },
    ];
    syncRecorrido(next);
    await tick();
    const leaveEl = nodos.get(leaveId) ?? null;
    const enterEl = nodos.get(enterId);
    try {
      if (enterEl) await crossfade(leaveEl, enterEl, get(reduce));
    } finally {
      capas = capas.filter((c) => c.fase !== "leave").map((c) => ({ ...c, fase: "live" as const }));
      busy = false;
    }
  }

  onMount(() => {
    const actual = viva();
    if (actual) syncRecorrido(actual.ruta);
    const stop = initRouter();
    const unsub = subscribe((next) => {
      void ir(next);
    });
    return () => {
      stop();
      unsub();
    };
  });
</script>

<div class="director">
  {#each capas as capa (capa.id)}
    {const Scene = escenas[capa.ruta.name]}
    <section
      class={[
        "escena-capa",
        capa.fase !== "live" && "will-move",
        capa.fase === "enter" && "is-enter",
        capa.fase === "leave" && "is-leave",
        SCROLL.has(capa.ruta.name) && "is-scroll",
      ]}
      data-capa={capa.id}
      {@attach registrar}
    >
      <Scene ruta={capa.ruta} />
    </section>
  {/each}
</div>

<style>
  .director {
    position: relative;
    height: 100%;
    min-height: 100dvh;
    overflow: hidden;
  }
</style>
