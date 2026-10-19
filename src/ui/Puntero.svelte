<script lang="ts">
  import { onMount } from "svelte";

  let nodo: HTMLDivElement | undefined = $state();
  let activo = $state(false);

  const TEXTO = "input, textarea, select, [contenteditable='true']";

  onMount(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const aplicar = () => {
      activo = mq.matches;
    };
    aplicar();
    mq.addEventListener("change", aplicar);

    const mover = (e: PointerEvent) => {
      const el = nodo;
      if (!el || !mq.matches || e.pointerType === "touch") return;
      const sobreTexto = e.target instanceof Element && e.target.closest(TEXTO);
      if (sobreTexto) {
        el.hidden = true;
        return;
      }
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      el.hidden = false;
    };

    const salir = (e: PointerEvent) => {
      if (!nodo || e.pointerType === "touch") return;
      nodo.hidden = true;
    };

    window.addEventListener("pointermove", mover, { passive: true });
    document.addEventListener("pointerleave", salir);
    return () => {
      mq.removeEventListener("change", aplicar);
      window.removeEventListener("pointermove", mover);
      document.removeEventListener("pointerleave", salir);
    };
  });
</script>

{#if activo}
  <div class="puntero" bind:this={nodo} hidden aria-hidden="true">
    <svg viewBox="0 0 32 32">
      <g fill="#fff8f1" transform="translate(16 16)">
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
    pointer-events: none;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
