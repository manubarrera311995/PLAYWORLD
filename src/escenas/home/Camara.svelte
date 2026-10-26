<script lang="ts">
  import { onMount } from "svelte";
  import galeria from "./galeria.json";
  import { PANTALLA } from "./pantalla";

  type Toma = { src: string; fecha: string; alt: string };
  type Props = { grande?: boolean };

  const fotos = galeria as Toma[];

  let { grande = false }: Props = $props();

  let indice = $state(0);
  let sentido = $state(0);
  let clave = $state(0);
  let llena = $state(false);

  const foto = $derived(fotos[indice]);
  const visible = $derived(grande && llena && fotos.length > 1);
  const cuenta = $derived(
    `${String(indice + 1).padStart(2, "0")}/${String(fotos.length).padStart(2, "0")}`,
  );

  function ir(delta: number): void {
    const destino = indice + delta;
    if (destino < 0 || destino >= fotos.length) return;
    sentido = delta;
    indice = destino;
    clave += 1;
  }

  $effect(() => {
    for (const delta of [-1, 1]) {
      const toma = fotos[indice + delta];
      if (!toma) continue;
      const img = new Image();
      img.src = toma.src;
    }
  });

  onMount(() => {
    const home = document.querySelector(".home");
    if (!home) return;
    const sync = (): void => {
      llena = home.classList.contains("is-llena") || home.classList.contains("is-quieto");
    };
    const obs = new MutationObserver(sync);
    obs.observe(home, { attributes: true, attributeFilter: ["class"] });
    sync();
    return () => obs.disconnect();
  });
</script>

{#if foto}
  <div class="objeto" class:is-grande={grande}>
    <span class="cuerpo">
      <span class="pantalla" style:left={PANTALLA.left} style:top={PANTALLA.top} style:width={PANTALLA.width} style:height={PANTALLA.height}>
        {#key clave}
          <img
            class="foto"
            class:entra-der={sentido > 0}
            class:entra-izq={sentido < 0}
            src={foto.src}
            alt={foto.alt}
            draggable="false"
          />
        {/key}
      </span>
      <img class="carcasa" src="/assets/home/camara/carcasa.png" alt="" draggable="false" />
      {#if visible}
        <span
          class="pasos"
          style:left={PANTALLA.left}
          style:top={PANTALLA.top}
          style:width={PANTALLA.width}
          style:height={PANTALLA.height}
        >
          <button
            class="paso paso--prev"
            type="button"
            aria-label="Foto anterior"
            disabled={indice === 0}
            onclick={() => ir(-1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14.8 5.2 8 12l6.8 6.8" />
            </svg>
          </button>
          <button
            class="paso paso--next"
            type="button"
            aria-label="Foto siguiente"
            disabled={indice === fotos.length - 1}
            onclick={() => ir(1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9.2 5.2 16 12l-6.8 6.8" />
            </svg>
          </button>
          <span class="cuenta">{cuenta}</span>
        </span>
      {/if}
    </span>
  </div>
{/if}

<style>
  .objeto {
    display: grid;
    justify-items: center;
    width: min(46%, 220px);
    flex: none;
    margin: 0;
    padding: 0;
    pointer-events: none;
  }
  .objeto.is-grande {
    width: 100%;
  }
  .objeto.is-grande .cuerpo {
    filter: drop-shadow(0 24px 40px rgba(6, 3, 10, 0.42));
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
  .foto {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
  }
  .foto.entra-der {
    animation: desde-der 320ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .foto.entra-izq {
    animation: desde-izq 320ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .pasos {
    position: absolute;
    z-index: 3;
    container-type: size;
    pointer-events: none;
  }
  .paso {
    position: absolute;
    top: 50%;
    z-index: 1;
    display: grid;
    place-items: center;
    width: clamp(26px, 22cqmin, 54px);
    aspect-ratio: 1;
    margin: 0;
    padding: 0;
    border: 1.5px solid rgba(255, 177, 74, 0.92);
    border-radius: 50%;
    background: rgba(8, 4, 2, 0.62);
    color: #ffb14a;
    pointer-events: auto;
    cursor: pointer;
    transform: translateY(-50%);
    box-shadow: 0 0 16px rgba(255, 160, 40, 0.28);
  }
  .paso--prev {
    left: 5%;
    animation: invita-izq 1.7s ease-in-out infinite;
  }
  .paso--next {
    right: 5%;
    animation: invita-der 1.7s ease-in-out infinite;
  }
  .paso svg {
    width: 56%;
    height: 56%;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .paso:hover {
    background: rgba(20, 8, 2, 0.82);
  }
  .paso:focus-visible {
    outline: 2px solid #ffb14a;
    outline-offset: 2px;
  }
  .paso:disabled {
    opacity: 0.32;
    cursor: default;
    animation: none;
    box-shadow: none;
  }
  .cuenta {
    position: absolute;
    right: 6%;
    bottom: 6%;
    color: #ffb14a;
    font-variant-numeric: tabular-nums;
    font-size: clamp(8px, 9cqh, 14px);
    letter-spacing: 0.06em;
    line-height: 1;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85);
    pointer-events: none;
  }
  .carcasa {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    user-select: none;
  }

  @keyframes desde-der {
    from {
      transform: translateX(14%);
      opacity: 0.35;
    }
    to {
      transform: none;
      opacity: 1;
    }
  }
  @keyframes desde-izq {
    from {
      transform: translateX(-14%);
      opacity: 0.35;
    }
    to {
      transform: none;
      opacity: 1;
    }
  }
  @keyframes invita-der {
    0%,
    100% {
      transform: translateY(-50%) translateX(0);
    }
    50% {
      transform: translateY(-50%) translateX(4px);
    }
  }
  @keyframes invita-izq {
    0%,
    100% {
      transform: translateY(-50%) translateX(0);
    }
    50% {
      transform: translateY(-50%) translateX(-4px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .foto.entra-der,
    .foto.entra-izq,
    .paso--prev,
    .paso--next {
      animation: none;
    }
  }
</style>
