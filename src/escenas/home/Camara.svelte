<script lang="ts">
  import { mount, unmount, onDestroy } from "svelte";
  import rollo from "./rollo.json";
  import { PANTALLA } from "./pantalla";
  import VisorCamara from "./VisorCamara.svelte";

  type Props = { grande?: boolean };
  let { grande = false }: Props = $props();

  const primera = rollo[0];
  let boton = $state<HTMLButtonElement | null>(null);
  let vista: ReturnType<typeof mount> | null = null;

  function cerrar(): void {
    const actual = vista;
    vista = null;
    if (actual) unmount(actual);
    boton?.focus();
  }

  function abrir(): void {
    if (vista || !primera) return;
    const mundo = document.querySelector(".mundo");
    if (!mundo) return;
    vista = mount(VisorCamara, {
      target: mundo,
      props: { oncerrar: cerrar },
    });
  }

  onDestroy(() => {
    if (vista) unmount(vista);
    vista = null;
  });
</script>

{#if primera}
  <button
    class="objeto camara"
    class:is-grande={grande}
    type="button"
    bind:this={boton}
    aria-label={grande ? "Ver galería" : "Abrir la cámara"}
    onclick={abrir}
  >
    <span class="cuerpo">
      <span
        class="pantalla"
        style:left={PANTALLA.left}
        style:top={PANTALLA.top}
        style:width={PANTALLA.width}
        style:height={PANTALLA.height}
      >
        <img src={primera.src} alt="" draggable="false" />
      </span>
      <img class="carcasa" src="/assets/home/camara/carcasa.png" alt="" draggable="false" />
    </span>
    {#if grande}
      <span class="rotulo">Ver galería</span>
    {/if}
  </button>
{/if}

<style>
  .objeto {
    appearance: none;
    display: grid;
    justify-items: center;
    gap: 12px;
    width: min(46%, 220px);
    flex: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    pointer-events: auto;
  }
  .objeto.is-grande {
    width: 100%;
  }
  .objeto.is-grande .cuerpo {
    filter: drop-shadow(0 24px 40px rgba(6, 3, 10, 0.42));
  }
  .objeto.is-grande .rotulo {
    font-size: clamp(12px, 1.5vw, 16px);
  }
  .rotulo {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.44em;
    text-indent: 0.44em;
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  .objeto:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 4px;
  }
  .cuerpo {
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 2552 / 1702;
  }
  .pantalla {
    position: absolute;
    overflow: hidden;
    background: #000;
  }
  .pantalla img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    user-select: none;
  }
  .carcasa {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    user-select: none;
  }
</style>
