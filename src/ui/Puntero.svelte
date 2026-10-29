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

    const ocultar = () => {
      punto = null;
      firma = "";
      if (nodo) nodo.hidden = true;
    };

    const colocar = (x: number, y: number) => {
      const el = nodo;
      if (!el) return;
      punto = { x, y };
      teñir();
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      el.hidden = false;
    };

    const mover = (e: PointerEvent) => {
      const el = nodo;
      if (!el || !mq.matches || e.pointerType === "touch") return;
      if (e.target instanceof HTMLIFrameElement) {
        ocultar();
        return;
      }
      const sobreTexto = e.target instanceof Element && e.target.closest(TEXTO);
      if (sobreTexto) {
        el.hidden = true;
        return;
      }
      colocar(e.clientX, e.clientY);
    };

    const salir = (e: PointerEvent) => {
      if (!nodo || e.pointerType === "touch") return;
      ocultar();
    };

    // Spotify vive en un iframe de otro origen: ahí no llegan pointermove
    // y el asterisco se quedaba clavado en el borde. Al entrar se esconde;
    // al salir vuelve al punto por donde el mouse abandona el marco.
    const entrarMarco = (e: PointerEvent) => {
      if (!mq.matches || e.pointerType === "touch") return;
      if (!(e.target instanceof HTMLIFrameElement)) return;
      ocultar();
    };

    const salirMarco = (e: PointerEvent) => {
      if (!nodo || !mq.matches || e.pointerType === "touch") return;
      if (!(e.target instanceof HTMLIFrameElement)) return;
      const destino = e.relatedTarget;
      if (destino instanceof Element && destino.closest(TEXTO)) {
        ocultar();
        return;
      }
      const x = e.clientX;
      const y = e.clientY;
      const bajo = document.elementFromPoint(x, y);
      if (
        !(bajo instanceof Element) ||
        bajo instanceof HTMLIFrameElement ||
        x < 0 ||
        y < 0 ||
        x > window.innerWidth ||
        y > window.innerHeight
      ) {
        ocultar();
        return;
      }
      colocar(x, y);
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
    document.addEventListener("pointerover", entrarMarco, true);
    document.addEventListener("pointerout", salirMarco, true);
    document.addEventListener("pointerleave", salir);
    return () => {
      cambios.disconnect();
      mq.removeEventListener("change", aplicar);
      window.removeEventListener("pointermove", mover);
      document.removeEventListener("pointerover", entrarMarco, true);
      document.removeEventListener("pointerout", salirMarco, true);
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
