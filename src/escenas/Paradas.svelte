<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { recorrido } from "../estado/recorrido";
  import { navigate, type RutaParsed } from "./director/router";
  import { anioDeParadas, vistaParadas, type ItemParada } from "./paradas";
  import { enPregunta, pedirPregunta } from "./home/ancla";
  import { ensureGsap } from "../motion/gsap";
  import { reduce } from "../motion/reducedMotion";

  type Props = { ruta: RutaParsed };
  type Linea = ReturnType<ReturnType<typeof ensureGsap>["timeline"]>;
  type Contexto = ReturnType<ReturnType<typeof ensureGsap>["context"]>;

  let { ruta }: Props = $props();

  const rec = $derived($recorrido);
  const escena = $derived(ruta.name);
  const vista = $derived(
    vistaParadas(escena, anioDeParadas(ruta, rec), rec.alma != null, escena === "home" && $enPregunta),
  );
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

  function tinta(el: HTMLElement): DOMRect {
    const rango = document.createRange();
    rango.selectNodeContents(el);
    const rects = rango.getClientRects();
    return rects.length ? rects[0] : el.getBoundingClientRect();
  }

  function vuelo(): { x: number; y: number; scale: number } {
    const punta = puntaEl;
    const destino = listaEl?.querySelector<HTMLElement>("[data-papel='actual'] .nombre");
    if (!punta || !destino) return { x: 0, y: 0, scale: 1 };
    const base = punta.getBoundingClientRect();
    const desde = tinta(punta);
    const hasta = tinta(destino);
    const desdeSize = parseFloat(getComputedStyle(punta).fontSize) || desde.height || 1;
    const hastaSize = parseFloat(getComputedStyle(destino).fontSize) || hasta.height || 1;
    const scale = hastaSize / desdeSize;
    // El nombre está alineado a la derecha dentro de una caja más ancha.
    // La escala sale de la esquina del elemento, así que se descuenta el
    // margen entre esa esquina y la tinta.
    const dx = desde.left - base.left;
    const dy = desde.top - base.top;
    return {
      x: hasta.left - base.left - dx * scale,
      y: hasta.top - base.top - dy * scale,
      scale,
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
    // autoAlpha deja opacity y visibility en línea. Si se quedan, tapan el
    // visibility:hidden del CSS y los nombres siguen pintados al cerrar.
    const gsap = ensureGsap();
    const viajes = listaEl ? [...listaEl.querySelectorAll<HTMLElement>(".viaje")] : [];
    if (viajes.length) gsap.set(viajes, { clearProps: "opacity,visibility,transform" });
    if (puntaEl) gsap.set(puntaEl, { clearProps: "opacity,visibility,transform" });
    if (reglaEl) gsap.set(reglaEl, { clearProps: "transform" });
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
      // La parada actual guarda autoAlpha en el nodo. Al cambiar de escena
      // ese nodo se reutiliza y, si no se limpia, la parada queda invisible.
      const restos = [...arriba, ...abajo];
      if (restos.length) gsap.set(restos, { clearProps: "opacity,visibility" });

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
      preparar(gsap, arriba, 48);
      preparar(gsap, abajo, -48);
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
          duration: 0.82,
          ease: "power3.inOut",
          transformOrigin: "0% 0%",
        },
        0.16,
      );
      linea.to(punta, { autoAlpha: 0, duration: 0.2, ease: "power1.inOut" }, 0.82);
      if (actual) linea.to(actual, { autoAlpha: 1, duration: 0.2, ease: "power1.inOut" }, 0.82);

      const paso = 0.02;
      if (arriba.length) {
        linea.fromTo(
          arriba,
          { yPercent: 48, autoAlpha: 0 },
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: 0.8,
            ease: "power3.out",
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
          { yPercent: -48, autoAlpha: 0 },
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: 0.8,
            ease: "power3.out",
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
    if (href === "/#pregunta") {
      pedirPregunta();
      cerrar("/", 1.3);
      return;
    }
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
    <span class="gozne__marca" aria-hidden="true">
      <svg viewBox="0 0 48 48" width="48" height="48">
        <g stroke="currentColor" stroke-width="7" stroke-linecap="round">
          <path d="M24 8v32M10.1 16l27.8 16M10.1 32l27.8-16" />
        </g>
      </svg>
    </span>
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

  <p class="colofon">
    Creado por: Manuela Barrera Nieto.<br />
    Maestría en Humanidades Digitales.<br />
    Universidad de Los Andes, 2026.<br />
    Todos los derechos reservados.
  </p>
</div>

<style>
  .marco {
    --gozne-top: 32px;
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
    background: rgba(18, 8, 22, 0.28);
    opacity: 0;
    pointer-events: none;
  }

  .marco.is-presente .velo {
    backdrop-filter: blur(64px) saturate(1.6);
    -webkit-backdrop-filter: blur(64px) saturate(1.6);
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
    top: 10px;
    left: 8px;
    font-family: Outfit, sans-serif;
    font-size: 17px;
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
    top: var(--gozne-top);
    right: var(--pad-x);
    display: grid;
    place-items: center;
    width: 64px;
    height: 60px;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-title);
    font-size: 48px;
    line-height: 1;
    pointer-events: auto;
    user-select: none;
  }

  .gozne__marca {
    display: block;
    transform-origin: center;
    animation: palpite 1.7s var(--ease-soft) infinite;
  }

  .gozne__marca svg {
    display: block;
  }

  @keyframes palpite {
    0%,
    58%,
    100% {
      transform: scale(1);
    }

    14% {
      transform: scale(1.16);
    }

    28% {
      transform: scale(1);
    }

    42% {
      transform: scale(1.08);
    }
  }

  .gozne:focus-visible,
  .nombre:focus-visible {
    outline: 1px solid var(--ink-title);
    outline-offset: 3px;
  }

  .columna {
    position: absolute;
    z-index: 1;
    top: calc(60px + var(--gozne-top));
    right: calc(var(--pad-x) + 31px);
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 26px;
    font-family: Outfit, sans-serif;
    font-size: clamp(22px, min(5vh, 7.4vw), 56px);
    font-weight: 400;
    font-style: normal;
    line-height: 1;
    letter-spacing: 0;
    text-transform: none;
    color: var(--ink-title);
  }

  ol {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.06em;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .mascara {
    display: block;
    overflow: hidden;
    width: 100%;
    padding: 0.16em 0.2em 0.28em;
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

  .colofon {
    position: absolute;
    z-index: 1;
    left: var(--pad-x);
    bottom: clamp(20px, 4vh, 40px);
    max-width: 32ch;
    margin: 0;
    padding: 14px 16px 16px;
    border: 1px solid rgba(255, 248, 241, 0.38);
    font-family: Outfit, sans-serif;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.45;
    letter-spacing: 0;
    text-align: left;
    color: var(--ink-title);
    opacity: 0;
    pointer-events: none;
  }

  .marco.is-presente .colofon {
    opacity: 1;
  }

  :global(html.reduce) .gozne__marca {
    animation: none;
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
    .gozne__marca {
      animation: none;
    }

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
