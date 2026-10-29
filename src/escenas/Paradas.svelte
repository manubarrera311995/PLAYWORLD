<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { recorrido } from "../estado/recorrido";
  import { navigate, type RutaParsed } from "./director/router";
  import { anioDeParadas, vistaParadas, type ItemParada } from "./paradas";
  import { ensureGsap } from "../motion/gsap";
  import { reduce } from "../motion/reducedMotion";

  type Props = { ruta: RutaParsed };
  type Linea = ReturnType<ReturnType<typeof ensureGsap>["timeline"]>;
  type Contexto = ReturnType<ReturnType<typeof ensureGsap>["context"]>;

  let { ruta }: Props = $props();

  const rec = $derived($recorrido);
  const escena = $derived(ruta.name);
  const vista = $derived(vistaParadas(escena, anioDeParadas(ruta, rec), rec.alma != null));
  const ancho = $derived(`${Math.round(vista.avance * 1000) / 10}%`);
  const crema = $derived(`${Math.round(vista.avance * 1000) / 10}%`);
  const actualNombre = $derived(vista.items.find((item) => item.estado === "actual")?.nombre ?? "");

  let quiereAbrir = $state(false);
  let presente = $state(false);

  let raiz = $state<HTMLElement | undefined>();
  let pistaEl = $state<HTMLElement | undefined>();
  let puntaEl = $state<HTMLElement | undefined>();
  let gozneEl = $state<HTMLButtonElement | undefined>();
  let veloEl = $state<HTMLButtonElement | undefined>();
  let columnaEl = $state<HTMLElement | undefined>();
  let listaEl = $state<HTMLOListElement | undefined>();
  let reglaEl = $state<HTMLElement | undefined>();

  let tl: Linea | null = null;
  let pendiente: string | null = null;
  let contexto: Contexto | null = null;
  let firmaEscena = "";

  function papel(item: ItemParada): "actual" | "arriba" | "abajo" {
    if (item.estado === "actual") return "actual";
    return item.estado === "pasada" ? "arriba" : "abajo";
  }

  function colocarPunta(): void {
    const pista = pistaEl;
    const gozne = gozneEl;
    const punta = puntaEl;
    if (!pista || !gozne || !punta) return;
    if (tl && tl.progress() > 0) return;
    const caja = pista.getBoundingClientRect();
    const gozneCaja = gozne.getBoundingClientRect();
    const tip = vista.avance * caja.width;
    const max = gozneCaja.left - caja.left - punta.offsetWidth - 12;
    punta.style.left = `${Math.max(8, Math.min(tip, max))}px`;
  }

  function vuelo(): { x: number; y: number; scale: number } {
    const punta = puntaEl;
    const destino = listaEl?.querySelector<HTMLElement>("[data-papel='actual'] .nombre");
    if (!punta || !destino) return { x: 0, y: 0, scale: 1 };
    const desde = punta.getBoundingClientRect();
    const hasta = destino.getBoundingClientRect();
    const alto = desde.height || 1;
    return {
      x: hasta.left - desde.left,
      y: hasta.top - desde.top,
      scale: hasta.height / alto,
    };
  }

  function preparar(
    gsap: ReturnType<typeof ensureGsap>,
    els: HTMLElement[],
    yPercent: number,
  ): void {
    if (!els.length) return;
    gsap.killTweensOf(els);
    for (const el of els) el.style.transform = "none";
    gsap.set(els, { y: 0, yPercent, overwrite: "auto" });
  }

  function soltar(): void {
    presente = false;
    const href = pendiente;
    pendiente = null;
    // Al terminar la reversa el playhead está en 0. timeScale(1) sin pausa
    // lo vuelve a colgar del ticker y la apertura se reproduce sola.
    tl?.pause();
    colocarPunta();
    if (href) navigate(href);
  }

  function crearTimeline(): Linea {
    const gsap = ensureGsap();
    const quieto = get(reduce);
    const velo = veloEl;
    const regla = reglaEl;
    const punta = puntaEl;
    const lista = listaEl;
    const columna = columnaEl;
    if (!velo || !regla || !punta || !lista || !columna) {
      return gsap.timeline({ paused: true });
    }

    const arriba = [...lista.querySelectorAll<HTMLElement>("[data-papel='arriba']")];
    const abajo = [...lista.querySelectorAll<HTMLElement>("[data-papel='abajo']")];
    const actual = lista.querySelector<HTMLElement>("[data-papel='actual']");
    let linea!: Linea;

    const armar = () => {
      linea = gsap.timeline({ paused: true, onReverseComplete: soltar });

      if (quieto) {
        gsap.set(regla, { scaleY: 1, transformOrigin: "top center" });
        gsap.set(punta, { x: 0, y: 0, scale: 1, autoAlpha: 1, transformOrigin: "0% 0%" });
        gsap.set(columna, { autoAlpha: 0 });
        gsap.set(velo, { opacity: 0 });
        if (actual) gsap.set(actual, { yPercent: 0, autoAlpha: 1 });
        if (arriba.length) gsap.set(arriba, { yPercent: 0 });
        if (abajo.length) gsap.set(abajo, { yPercent: 0 });
        linea.to(velo, { opacity: 1, duration: 0.2, ease: "power1.out" }, 0);
        linea.to(columna, { autoAlpha: 1, duration: 0.2, ease: "power1.out" }, 0);
        linea.to(punta, { autoAlpha: 0, duration: 0.2, ease: "power1.out" }, 0);
        return;
      }

      gsap.set(columna, { autoAlpha: 1 });
      gsap.set(velo, { opacity: 0 });
      gsap.set(regla, { scaleY: 0, transformOrigin: "top center" });
      gsap.set(punta, { x: 0, y: 0, scale: 1, autoAlpha: 1, transformOrigin: "0% 0%" });
      if (actual) gsap.set(actual, { autoAlpha: 0, y: 0, yPercent: 0 });
      preparar(gsap, arriba, 110);
      preparar(gsap, abajo, -110);
      colocarPunta();
      const destino = vuelo();

      linea.to(velo, { opacity: 1, duration: 0.45, ease: "power2.out" }, 0);
      linea.to(
        regla,
        { scaleY: 1, duration: 0.4, ease: "power4.out", transformOrigin: "top center" },
        0.08,
      );
      linea.to(
        punta,
        {
          x: destino.x,
          y: destino.y,
          scale: destino.scale,
          duration: 0.7,
          ease: "power4.out",
          transformOrigin: "0% 0%",
        },
        0.2,
      );
      linea.set(punta, { autoAlpha: 0, immediateRender: false }, 0.9);
      if (actual) linea.set(actual, { autoAlpha: 1, immediateRender: false }, 0.9);

      const paso = 0.02;
      if (arriba.length) {
        linea.fromTo(
          arriba,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 0.7,
            ease: "power4.out",
            stagger: { each: paso, from: "end" },
            immediateRender: false,
            overwrite: "auto",
          },
          0.2,
        );
      }
      if (abajo.length) {
        linea.fromTo(
          abajo,
          { yPercent: -110 },
          {
            yPercent: 0,
            duration: 0.7,
            ease: "power4.out",
            stagger: { each: paso, from: "start" },
            immediateRender: false,
            overwrite: "auto",
          },
          arriba.length ? 0.24 : 0.2,
        );
      }
    };

    if (contexto) contexto.add(armar);
    else armar();
    tl = linea;
    return linea;
  }

  function asegurar(): Linea | null {
    if (!veloEl || !reglaEl || !puntaEl || !listaEl || !columnaEl) return null;
    if (tl && tl.progress() > 0) return tl;
    tl?.kill();
    tl = null;
    return crearTimeline();
  }

  function abrir(): void {
    pendiente = null;
    const linea = asegurar();
    if (!linea) return;
    quiereAbrir = true;
    presente = true;
    linea.timeScale(1).play();
  }

  function cerrar(href: string | null = null, escala = 1): void {
    if (!quiereAbrir) return;
    quiereAbrir = false;
    if (columnaEl?.contains(document.activeElement)) gozneEl?.focus();
    if (!tl || tl.progress() === 0) {
      pendiente = href;
      soltar();
      return;
    }
    pendiente = href;
    presente = true;
    tl.timeScale(escala).reverse();
  }

  function alternar(): void {
    if (quiereAbrir) cerrar();
    else abrir();
  }

  function elegir(href: string): void {
    if (!quiereAbrir) return;
    cerrar(href, 1.3);
  }

  $effect(() => {
    const firma = `${escena}:${vista.avance}:${actualNombre}`;
    if (firmaEscena && firmaEscena !== firma && (quiereAbrir || presente)) {
      tl?.progress(0, true).kill();
      tl = null;
      quiereAbrir = false;
      presente = false;
      pendiente = null;
    }
    firmaEscena = firma;
  });

  $effect(() => {
    void vista.avance;
    void actualNombre;
    if (!pistaEl || !gozneEl || !puntaEl) return;
    colocarPunta();
    const observar = new ResizeObserver(() => colocarPunta());
    observar.observe(pistaEl);
    void document.fonts?.ready.then(() => colocarPunta());
    return () => observar.disconnect();
  });

  onMount(() => {
    const gsap = ensureGsap();
    if (raiz) contexto = gsap.context(() => undefined, raiz);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || (!quiereAbrir && !presente)) return;
      event.preventDefault();
      cerrar();
    };
    window.addEventListener("keydown", onKey);
    const unsub = reduce.subscribe(() => {
      if (tl && tl.progress() === 0 && !tl.isActive()) {
        tl.kill();
        tl = null;
      }
    });
    return () => {
      window.removeEventListener("keydown", onKey);
      unsub();
      pendiente = null;
      contexto?.revert();
      contexto = null;
      tl = null;
    };
  });
</script>

<div class={["marco", presente && "is-presente"]} bind:this={raiz}>
  <button
    type="button"
    class="velo"
    bind:this={veloEl}
    aria-label="Cerrar recorrido"
    tabindex="-1"
    onclick={() => cerrar()}
  ></button>

  <div class="pista" bind:this={pistaEl} aria-hidden="true">
    <i style:width={ancho}></i>
  </div>

  <span class="punta" bind:this={puntaEl} aria-hidden={presente}>{actualNombre}</span>

  <button
    type="button"
    class="gozne"
    bind:this={gozneEl}
    aria-expanded={quiereAbrir}
    aria-controls="recorrido"
    aria-label="Recorrido"
    onclick={alternar}
  >
    ✱
  </button>

  <nav id="recorrido" class="columna" aria-label="Recorrido" inert={!quiereAbrir} bind:this={columnaEl}>
    <ol bind:this={listaEl}>
      {#each vista.items as item (item.id)}
        <li>
          <span class="mascara">
            <span class="viaje" data-papel={papel(item)}>
              {#if item.estado === "actual"}
                <span class="nombre" aria-current="step">{item.nombre}</span>
              {:else if item.href}
                {@const href = item.href}
                <button type="button" class="nombre" onclick={() => elegir(href)}>{item.nombre}</button>
              {:else}
                <span class={["nombre", item.estado === "futura" && "es-futura"]}>{item.nombre}</span>
              {/if}
            </span>
          </span>
        </li>
      {/each}
    </ol>
    <div class="regla" bind:this={reglaEl} aria-hidden="true">
      <i class="regla__crema" style:height={crema}></i>
    </div>
  </nav>
</div>

<style>
  .marco {
    position: fixed;
    inset: 0;
    z-index: 5;
    pointer-events: none;
  }

  .velo {
    position: absolute;
    inset: 0;
    z-index: 0;
    margin: 0;
    padding: 0;
    border: 0;
    background: rgba(8, 4, 14, 0.62);
    opacity: 0;
    pointer-events: none;
  }

  .marco.is-presente .velo,
  .marco.is-presente .columna {
    pointer-events: auto;
  }

  .pista {
    position: absolute;
    z-index: 2;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(255, 246, 239, 0.28);
  }

  .pista i {
    display: block;
    height: 100%;
    background: var(--ink-title);
  }

  .punta {
    position: absolute;
    z-index: 2;
    top: 12px;
    left: 8px;
    font-family: Outfit, sans-serif;
    font-size: 11px;
    font-weight: 400;
    font-style: normal;
    line-height: 1;
    letter-spacing: 0;
    text-transform: none;
    white-space: nowrap;
    color: var(--ink-title);
    will-change: transform;
  }

  .gozne {
    position: absolute;
    z-index: 3;
    top: 4px;
    right: var(--pad-x);
    display: grid;
    place-items: center;
    width: 36px;
    height: 32px;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-title);
    font-size: 18px;
    line-height: 1;
    pointer-events: auto;
    user-select: none;
  }

  .gozne:focus-visible,
  .nombre:focus-visible {
    outline: 1px solid var(--ink-title);
    outline-offset: 3px;
  }

  .columna {
    position: absolute;
    z-index: 1;
    top: 42px;
    right: calc(var(--pad-x) + 17px);
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 14px;
    font-family: Outfit, sans-serif;
    font-size: clamp(22px, 3vw, 40px);
    font-weight: 400;
    font-style: normal;
    line-height: 1.05;
    letter-spacing: -0.02em;
    text-transform: none;
    color: var(--ink-title);
  }

  ol {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.16em;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .mascara {
    display: block;
    overflow: hidden;
    padding-inline: 8px;
    margin-inline: -8px;
  }

  .viaje {
    display: block;
    will-change: transform;
  }

  .viaje[data-papel="arriba"],
  .viaje[data-papel="abajo"] {
    visibility: hidden;
  }

  .marco.is-presente .viaje[data-papel="arriba"],
  .marco.is-presente .viaje[data-papel="abajo"] {
    visibility: visible;
  }

  .viaje[data-papel="actual"] {
    visibility: hidden;
    opacity: 0;
  }

  .nombre {
    display: block;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    font-style: normal;
    letter-spacing: inherit;
    line-height: inherit;
    text-align: right;
    text-transform: none;
    white-space: nowrap;
  }

  button.nombre {
    transition: transform 0.2s var(--ease-out);
  }

  button.nombre:hover,
  button.nombre:focus-visible {
    transform: translateX(-6px);
  }

  .es-futura {
    opacity: 0.38;
  }

  .regla {
    position: relative;
    flex: none;
    width: 2px;
    align-self: stretch;
    background: rgba(255, 246, 239, 0.28);
    transform: scaleY(0);
    transform-origin: top center;
    will-change: transform;
  }

  .regla__crema {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background: var(--ink-title);
  }

  :global(html.reduce) .columna {
    opacity: 0;
    visibility: hidden;
  }

  :global(html.reduce) .viaje[data-papel="arriba"],
  :global(html.reduce) .viaje[data-papel="abajo"],
  :global(html.reduce) .regla {
    transform: none;
  }

  :global(html.reduce) .viaje[data-papel="actual"] {
    visibility: visible;
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .columna {
      opacity: 0;
      visibility: hidden;
    }

    .viaje[data-papel="arriba"],
    .viaje[data-papel="abajo"],
    .regla {
      transform: none;
    }

    .viaje[data-papel="actual"] {
      visibility: visible;
      opacity: 1;
    }

    button.nombre {
      transition: none;
    }
  }
</style>
