<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { on } from "svelte/events";
  import copy from "./archivo.copy.json";
  import Sintonizador from "./Sintonizador.svelte";
  import PasoAnio from "./PasoAnio.svelte";
  import Marca from "../../ui/Marca.svelte";
  import Boton from "../../ui/Boton.svelte";
  import { cargarEdiciones } from "../../datos/archivo";
  import type { Edicion } from "../../datos/tipos";
  import { navigate, type RutaParsed } from "../director/router";
  import { viewport } from "../../estado/viewport";
  import { parcheRecorrido, recorrido } from "../../estado/recorrido";

  type Props = { ruta?: RutaParsed };
  let { ruta }: Props = $props();

  let ediciones = $state<Edicion[]>([]);
  const rec = $derived($recorrido);
  const vp = $derived($viewport);
  const years = copy.years;
  const yearFoco = get(recorrido).yearHint;
  const idx = $derived.by(() => {
    const y = (ruta && ruta.name === "archivo" && ruta.year) || rec.yearHint || 2011;
    const i = years.indexOf(y);
    return i >= 0 ? i : 0;
  });
  const year = $derived(years[idx] ?? 2011);
  const ed = $derived(ediciones.find((e) => e.year === year));
  const progreso = $derived(
    `${String(idx + 1).padStart(2, "0")} / ${String(years.length).padStart(2, "0")}`,
  );
  let sintonizo = $state(false);

  onMount(() => {
    void cargarEdiciones().then((e) => (ediciones = e));
  });

  function setYear(y: number): void {
    if (!years.includes(y)) return;
    if (y !== year) sintonizo = true;
    parcheRecorrido({ yearHint: y });
    navigate(`/archivo?y=${y}`, true);
  }

  function paso(dir: number): void {
    const next = years[idx + dir];
    if (next != null) setYear(next);
  }

  function rueda(el: HTMLElement) {
    let acc = 0;
    let last = 0;
    let pid = -1;
    let x0 = 0;
    let y0 = 0;
    const offWheel = on(
      el,
      "wheel",
      (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        e.preventDefault();
        acc += e.deltaY;
        if (Math.abs(acc) < 48) return;
        const dir = acc > 0 ? 1 : -1;
        acc = 0;
        const now = performance.now();
        if (now - last < 200) return;
        last = now;
        paso(dir);
      },
      { passive: false },
    );
    const offDown = on(el, "pointerdown", (e) => {
      const t = e.target as HTMLElement;
      if (t.closest("button, a, .radio")) return;
      pid = e.pointerId;
      x0 = e.clientX;
      y0 = e.clientY;
    });
    const offUp = on(el, "pointerup", (e) => {
      if (e.pointerId !== pid) return;
      pid = -1;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (vp.modo === "compacto") {
        if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
        paso(dx > 0 ? -1 : 1);
        return;
      }
      if (Math.abs(dy) < 48 || Math.abs(dy) < Math.abs(dx)) return;
      paso(dy > 0 ? 1 : -1);
    });
    return () => {
      offWheel();
      offDown();
      offUp();
    };
  }
</script>

<section class="archivo" aria-label="{copy.brand} · {copy.title[0]} {copy.title[1]}" {@attach rueda}>
  <header class="archivo__top">
    <div class="archivo__folio">
      <Marca texto={copy.brand} />
      {#if vp.modo !== "compacto"}
        <p class="archivo__kicker">{copy.title[0]} {copy.title[1]}</p>
      {/if}
    </div>
    <p class="archivo__progreso" aria-live="polite">{progreso}</p>
  </header>

  <div class="archivo__escena">
    <PasoAnio {year} hasDNA={ed?.hasDNA ?? false} tesis={ed?.tesis ?? []}>
      <p class={["archivo__hint", sintonizo && "is-off"]}>{copy.hint}</p>
    </PasoAnio>
  </div>

  <Sintonizador
    {years}
    actual={year}
    dnaYears={ediciones.filter((e) => e.hasDNA).map((e) => e.year)}
    modo={vp.modo}
    foco={yearFoco}
    banda={copy.band}
    pie={copy.caption}
    onchange={setYear}
  />

  <footer>
    <Boton onclick={() => navigate(`/edicion/${year}`)}>{copy.cta}</Boton>
  </footer>
</section>

<style>
  .archivo {
    position: relative;
    height: 100%;
    min-height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr auto auto;
    padding: var(--pad-y) var(--pad-x);
    padding-left: clamp(16px, 5vw, 64px);
    gap: 12px;
  }
  @media (min-width: 768px) {
    .archivo {
      padding-left: clamp(80px, 10vw, 104px);
    }
  }
  .archivo__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    pointer-events: none;
  }
  .archivo__folio {
    display: grid;
    gap: 4px;
  }
  .archivo__kicker {
    font-size: 11px;
    letter-spacing: 0.22em;
    text-indent: 0.22em;
    text-transform: uppercase;
    color: rgba(255, 246, 239, 0.42);
  }
  .archivo__progreso {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 246, 239, 0.55);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .archivo__escena {
    min-height: 0;
    height: 100%;
    display: grid;
  }
  .archivo__hint {
    font-size: 11px;
    letter-spacing: 0.22em;
    text-indent: 0.22em;
    text-transform: uppercase;
    color: rgba(255, 246, 239, 0.45);
    transition: opacity 400ms var(--ease-soft);
  }
  .archivo__hint.is-off {
    opacity: 0;
  }
  footer {
    display: flex;
    justify-content: center;
  }
  @media (prefers-reduced-motion: reduce) {
    .archivo__hint {
      transition: none;
    }
  }
</style>
