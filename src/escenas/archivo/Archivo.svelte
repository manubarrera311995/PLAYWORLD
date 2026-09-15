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
  import { formatN } from "./curva";
  import { navigate, type RutaParsed } from "../director/router";
  import { viewport } from "../../estado/viewport";
  import { parcheRecorrido, recorrido } from "../../estado/recorrido";
  import { ensureGsap } from "../../motion/gsap";
  import { reduce as reduceMotion } from "../../motion/reducedMotion";

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
  const conteos = $derived(
    Object.fromEntries(ediciones.map((e) => [e.year, e.conteo])) as Record<number, number>,
  );
  const cifra = $derived.by(() => {
    const n = ed?.conteo ?? 0;
    if (n <= 0) return "";
    const num = formatN(n);
    const tpl = n === 1 ? copy.songOne : copy.songs;
    return tpl.replace("{n}", num);
  });
  const progreso = $derived(
    `${String(idx + 1).padStart(2, "0")} / ${String(years.length).padStart(2, "0")}`,
  );
  const reduce = $derived($reduceMotion);

  onMount(() => {
    void cargarEdiciones().then((e) => (ediciones = e));
  });

  function setYear(y: number): void {
    if (!years.includes(y)) return;
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

  function montar(el: HTMLElement) {
    const stopRueda = rueda(el);
    const gsap = ensureGsap();
    const ctx = gsap.context(() => {
      if (reduce) return;
      gsap.from("[data-chrome]", {
        y: 14,
        autoAlpha: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power2.out",
      });
    }, el);
    return () => {
      stopRueda();
      ctx.revert();
    };
  }
</script>

<section
  class="archivo"
  aria-label="{copy.brand} · {copy.title[0]} {copy.title[1]}. {copy.hint}"
  {@attach montar}
>
  <div class="archivo__cielo" aria-hidden="true"></div>

  <header class="archivo__top" data-chrome>
    <div class="archivo__folio">
      <Marca texto={copy.brand} />
      <p class="archivo__kicker">{copy.title[0]} {copy.title[1]}</p>
    </div>
    <p class="archivo__progreso" aria-live="polite">{progreso}</p>
  </header>

  <div class="archivo__escena">
    <PasoAnio
      {year}
      {years}
      hasDNA={ed?.hasDNA ?? false}
      tesis={ed?.tesis ?? []}
      {cifra}
    />
  </div>

  <Sintonizador
    {years}
    actual={year}
    dnaYears={ediciones.filter((e) => e.hasDNA).map((e) => e.year)}
    {conteos}
    modo={vp.modo}
    foco={yearFoco}
    onchange={setYear}
  />

  <footer data-chrome>
    <Boton onclick={() => navigate(`/edicion/${year}`)}>{copy.cta}</Boton>
  </footer>
</section>

<style>
  .archivo {
    position: relative;
    height: 100%;
    min-height: 100dvh;
    overflow: hidden;
    display: grid;
    grid-template-rows: auto 1fr auto auto;
    padding: var(--pad-y) var(--pad-x);
    padding-left: clamp(16px, 5vw, 64px);
    gap: 8px;
  }

  .archivo__cielo {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(90% 80% at 0% 0%, rgba(240, 120, 16, 0.42) 0%, transparent 58%),
      radial-gradient(70% 75% at 100% 85%, rgba(18, 0, 40, 0.28) 0%, transparent 52%);
  }

  @media (min-width: 768px) {
    .archivo {
      grid-template-rows: auto 1fr auto;
      padding-left: clamp(80px, 9vw, 104px);
    }
  }

  .archivo__top {
    position: relative;
    z-index: 3;
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
    font-size: 10px;
    letter-spacing: 0.28em;
    text-indent: 0.28em;
    text-transform: uppercase;
    color: rgba(255, 246, 239, 0.42);
  }

  .archivo__progreso {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255, 246, 239, 0.55);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    font-family: ui-monospace, "Cascadia Mono", "Segoe UI Mono", monospace;
  }

  .archivo__escena {
    position: relative;
    z-index: 1;
    min-height: 0;
    height: 100%;
    display: grid;
  }

  footer {
    position: relative;
    z-index: 3;
    display: flex;
    justify-content: center;
    padding-bottom: 4px;
  }

  footer :global(.boton) {
    background: transparent;
    border-color: rgba(255, 246, 239, 0.72);
    color: var(--ink-title);
    padding: 11px 28px;
    letter-spacing: 0.22em;
    text-indent: 0.22em;
  }

  footer :global(.boton:hover) {
    background: rgba(255, 246, 239, 0.08);
  }

  @media (min-width: 768px) {
    footer {
      position: absolute;
      left: 0;
      right: 0;
      bottom: var(--pad-y);
    }
  }
</style>
