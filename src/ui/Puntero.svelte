<script lang="ts">
  import { onMount } from "svelte";
  import { punteroSobreClaro, type CapaFondo } from "./puntero";

  let nodo: HTMLDivElement | undefined = $state();
  let activo = $state(false);

  const TEXTO = "input, textarea, select, [contenteditable='true']";
  const TINTA = "#fff8f1";
  const TINTA_NEGRA = "#141210";

  function capaDe(el: Element): CapaFondo {
    const estilo = getComputedStyle(el);
    return {
      backgroundColor: estilo.backgroundColor,
      backgroundImage: estilo.backgroundImage,
      cubre:
        el instanceof HTMLImageElement ||
        el instanceof HTMLVideoElement ||
        el instanceof HTMLCanvasElement,
    };
  }

  onMount(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const aplicar = () => {
      activo = mq.matches;
    };
    aplicar();
    mq.addEventListener("change", aplicar);

    let punto: { x: number; y: number } | null = null;
    let firma = "";

    const teñir = (forzar = false) => {
      const el = nodo;
      if (!el || !punto) return;
      const pila = document.elementsFromPoint(punto.x, punto.y);
      const siguiente = pila.map((n) => n.getAttribute("class") ?? "").join(">");
      if (!forzar && siguiente === firma) return;
      firma = siguiente;
      el.style.color = punteroSobreClaro(pila.map(capaDe)) ? TINTA_NEGRA : TINTA;
    };

    const mover = (e: PointerEvent) => {
      const el = nodo;
      if (!el || !mq.matches || e.pointerType === "touch") return;
      const sobreTexto = e.target instanceof Element && e.target.closest(TEXTO);
      if (sobreTexto) {
        el.hidden = true;
        return;
      }
      punto = { x: e.clientX, y: e.clientY };
      teñir();
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      el.hidden = false;
    };

    const salir = (e: PointerEvent) => {
      if (!nodo || e.pointerType === "touch") return;
      punto = null;
      firma = "";
      nodo.hidden = true;
    };

    const cambios = new MutationObserver(() => {
      if (!nodo || nodo.hidden || !punto) return;
      teñir(true);
    });
    cambios.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
      subtree: true,
    });

    window.addEventListener("pointermove", mover, { passive: true });
    document.addEventListener("pointerleave", salir);
    return () => {
      cambios.disconnect();
      mq.removeEventListener("change", aplicar);
      window.removeEventListener("pointermove", mover);
      document.removeEventListener("pointerleave", salir);
    };
  });
</script>

{#if activo}
  <div class="puntero" bind:this={nodo} hidden aria-hidden="true">
    <svg viewBox="0 0 32 32">
      <g fill="currentColor" transform="translate(16 16)">
        <rect x="-1.15" y="-11" width="2.3" height="22" rx="1.05" />
        <rect x="-1.15" y="-11" width="2.3" height="22" rx="1.05" transform="rotate(60)" />
        <rect x="-1.15" y="-11" width="2.3" height="22" rx="1.05" transform="rotate(120)" />
      </g>
    </svg>
  </div>
{/if}

<style>
  .puntero {
    position: fixed;
    z-index: 80;
    top: 0;
    left: 0;
    width: 32px;
    height: 32px;
    color: #fff8f1;
    pointer-events: none;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
