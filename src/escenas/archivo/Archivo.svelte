<script lang="ts">
  import { onMount } from "svelte";
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
  const idx = $derived.by(() => {
    const y = (ruta && ruta.name === "archivo" && ruta.year) || rec.yearHint || 2013;
    const i = years.indexOf(y);
    return i >= 0 ? i : 0;
  });
  const year = $derived(years[idx] ?? 2013);
  const ed = $derived(ediciones.find((e) => e.year === year));

  onMount(() => {
    void cargarEdiciones().then((e) => (ediciones = e));
  });

  function setYear(y: number): void {
    if (!years.includes(y)) return;
    parcheRecorrido({ yearHint: y });
    navigate(`/archivo?y=${y}`, true);
  }

  function rueda(el: HTMLElement) {
    let acc = 0;
    let last = 0;
    return on(
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
        const next = years[idx + dir];
        if (next != null) setYear(next);
      },
      { passive: false },
    );
  }
</script>

<section class="archivo" {@attach rueda}>
  <header>
    <Marca texto={copy.brand} />
    <h1 class="tipo-seccion">{copy.title[0]}<br />{copy.title[1]}</h1>
    <p class="tipo-pie">{copy.hint}</p>
  </header>
  <PasoAnio {year} hasDNA={ed?.hasDNA ?? false} tesis={ed?.tesis ?? []} />
  <Sintonizador
    {years}
    actual={year}
    dnaYears={ediciones.filter((e) => e.hasDNA).map((e) => e.year)}
    modo={vp.modo}
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
    gap: 16px;
  }
  @media (min-width: 1024px) {
    .archivo {
      padding-left: 88px;
    }
  }
  header { text-align: center; display: grid; gap: 10px; justify-items: center; }
  footer { display: flex; justify-content: center; }
</style>
