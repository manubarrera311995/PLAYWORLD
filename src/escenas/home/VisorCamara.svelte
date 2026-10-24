<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import rollo from "./rollo.json";
  import { PANTALLA } from "./pantalla";
  import { reduce } from "../../motion/reducedMotion";

  type Props = { oncerrar: () => void };
  let { oncerrar }: Props = $props();

  const fotos = rollo;
  let indice = $state(0);
  let dx = $state(0);
  let arrastrando = $state(false);
  let saltar = $state(false);
  let animando = false;
  let sentido = 0;
  let origenX = 0;
  let origenY = 0;
  let visor = $state<HTMLDivElement | null>(null);
  let pantalla = $state<HTMLDivElement | null>(null);

  const foto = $derived(fotos[indice]);
  const previa = $derived(fotos[indice - 1] ?? null);
  const siguiente = $derived(fotos[indice + 1] ?? null);
  const cuenta = $derived(
    `${String(indice + 1).padStart(2, "0")}/${String(fotos.length).padStart(2, "0")}`,
  );
  const sello = $derived(foto ? foto.fecha.replaceAll("-", ".") : "");

  function asentar(): void {
    if (!animando) return;
    saltar = true;
    indice = Math.min(fotos.length - 1, Math.max(0, indice + sentido));
    dx = 0;
    animando = false;
    sentido = 0;
    requestAnimationFrame(() => {
      saltar = false;
    });
  }

  function ir(dir: number): void {
    if (animando || !foto) return;
    const destino = indice + dir;
    if (destino < 0 || destino >= fotos.length) {
      dx = 0;
      return;
    }
    if (get(reduce)) {
      indice = destino;
      dx = 0;
      return;
    }
    const celda = pantalla?.clientWidth ?? 0;
    if (celda < 2) {
      indice = destino;
      return;
    }
    sentido = dir;
    arrastrando = false;
    animando = true;
    dx = dir > 0 ? -celda : celda;
    window.setTimeout(asentar, 340);
  }

  function abajo(e: PointerEvent): void {
    if (animando || e.button !== 0) return;
    arrastrando = true;
    origenX = e.clientX;
    origenY = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function mover(e: PointerEvent): void {
    if (!arrastrando) return;
    let d = e.clientX - origenX;
    const enTope = (indice === 0 && d > 0) || (indice === fotos.length - 1 && d < 0);
    if (enTope) d *= 0.28;
    dx = d;
  }

  function soltar(e: PointerEvent): void {
    if (!arrastrando) return;
    arrastrando = false;
    const d = e.clientX - origenX;
    const vertical = Math.abs(e.clientY - origenY) > Math.abs(d);
    const celda = pantalla?.clientWidth ?? 1;
    const umbral = Math.min(72, celda * 0.18);
    if (!vertical && d <= -umbral) ir(1);
    else if (!vertical && d >= umbral) ir(-1);
    else dx = 0;
  }

  function alTerminar(e: TransitionEvent): void {
    if (e.propertyName !== "transform" || e.target !== e.currentTarget) return;
    asentar();
  }

  function tecla(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      e.preventDefault();
      oncerrar();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      ir(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      ir(-1);
    }
  }

  function rueda(nodo: HTMLElement): () => void {
    let ultimo = 0;
    const fn = (e: WheelEvent) => {
      e.preventDefault();
      const ahora = performance.now();
      if (ahora - ultimo < 320 || animando) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 8) return;
      ultimo = ahora;
      ir(delta > 0 ? 1 : -1);
    };
    nodo.addEventListener("wheel", fn, { passive: false });
    return () => nodo.removeEventListener("wheel", fn);
  }

  function trabar(): () => void {
    const scroller = document.querySelector<HTMLElement>(".escena-capa.is-scroll");
    if (!scroller) return () => undefined;
    const previo = scroller.style.overflow;
    scroller.style.overflow = "hidden";
    return () => {
      scroller.style.overflow = previo;
    };
  }

  onMount(() => {
    visor?.focus();
    const soltarScroll = trabar();
    window.addEventListener("keydown", tecla);
    return () => {
      window.removeEventListener("keydown", tecla);
      soltarScroll();
    };
  });
</script>

<div
  class="visor"
  role="dialog"
  aria-modal="true"
  aria-label={foto ? `Cámara. ${foto.alt}. ${cuenta}` : "Cámara"}
  tabindex="-1"
  bind:this={visor}
  {@attach rueda}
  onkeydown={tecla}
  onclick={(e) => {
    if (e.currentTarget === e.target) oncerrar();
  }}
>
  <div class="cuerpo">
    <div
      class="pantalla"
      role="group"
      aria-label="Desliza para cambiar de foto"
      bind:this={pantalla}
      style:left={PANTALLA.left}
      style:top={PANTALLA.top}
      style:width={PANTALLA.width}
      style:height={PANTALLA.height}
      onpointerdown={abajo}
      onpointermove={mover}
      onpointerup={soltar}
      onpointercancel={soltar}
    >
      <div
        class="tira"
        class:is-suelta={arrastrando || saltar}
        style:--dx="{dx}px"
        ontransitionend={alTerminar}
      >
        <span class="celda">
          {#if previa}
            <img src={previa.src} alt="" draggable="false" />
          {/if}
        </span>
        <span class="celda">
          {#if foto}
            <img src={foto.src} alt={foto.alt} draggable="false" />
          {/if}
        </span>
        <span class="celda">
          {#if siguiente}
            <img src={siguiente.src} alt="" draggable="false" />
          {/if}
        </span>
      </div>
      <span class="marca marca--cuenta">{cuenta}</span>
      <span class="marca marca--sello">{sello}</span>
    </div>
    <img class="carcasa" src="/assets/home/camara/carcasa.png" alt="" draggable="false" />
  </div>
  <button class="soltar" type="button" onclick={(e) => { e.stopPropagation(); oncerrar(); }}>
    Soltar
  </button>
</div>

<style>
  .visor {
    position: fixed;
    inset: 0;
    z-index: 7;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 18px 16px 16px;
    background: rgba(6, 3, 10, 0.78);
    touch-action: none;
  }
  .visor:focus {
    outline: none;
  }
  .cuerpo {
    position: relative;
    width: min(96vw, calc(82dvh * 1.4994));
    aspect-ratio: 2552 / 1702;
    filter: drop-shadow(0 28px 36px rgba(0, 0, 0, 0.48));
  }
  .pantalla {
    position: absolute;
    z-index: 0;
    overflow: hidden;
    background: #000;
    touch-action: none;
    container-type: size;
  }
  .tira {
    display: flex;
    width: 300%;
    height: 100%;
    transform: translateX(calc(-33.333333% + var(--dx, 0px)));
    transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .tira.is-suelta {
    transition: none;
  }
  .celda {
    display: grid;
    place-items: center;
    width: 33.333333%;
    height: 100%;
    flex: none;
    background: #000;
  }
  .celda img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
  }
  .marca {
    position: absolute;
    z-index: 1;
    color: #ffb14a;
    font-variant-numeric: tabular-nums;
    font-size: clamp(9px, 8cqh, 15px);
    letter-spacing: 0.04em;
    line-height: 1;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85);
    pointer-events: none;
  }
  .marca--cuenta {
    top: 7%;
    right: 5%;
  }
  .marca--sello {
    right: 5%;
    bottom: 6%;
  }
  .carcasa {
    position: absolute;
    inset: 0;
    z-index: 2;
    width: 100%;
    height: 100%;
    pointer-events: none;
    user-select: none;
  }
  .soltar {
    border: 0;
    background: none;
    padding: 8px 4px;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.44em;
    text-indent: 0.44em;
    text-transform: uppercase;
    color: rgba(255, 246, 239, 0.72);
  }
  .soltar:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    .tira {
      transition: none;
    }
  }
</style>
