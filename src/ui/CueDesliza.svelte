<script lang="ts">
  type Props = {
    texto: string;
    subir?: boolean;
    bajar?: boolean;
    /** Reserva las dos líneas para que el gesto no salte al cambiar de año. */
    reservar?: boolean;
  };
  let { texto, subir = false, bajar = true, reservar = false }: Props = $props();

  const vaArriba = $derived(subir);
  const vaAbajo = $derived(bajar || !subir);
</script>

<div class={["cue", vaArriba && "is-subir", vaAbajo && "is-bajar"]}>
  <p class="cue__label">{texto}</p>
  <span class="cue__gesto" aria-hidden="true">
    {#if vaArriba || reservar}
      <span class={["cue__linea cue__linea--arriba", !vaArriba && "is-off"]}></span>
    {/if}
    <span class="cue__capsula">
      <span class="cue__punto"></span>
    </span>
    {#if vaAbajo || reservar}
      <span class={["cue__linea cue__linea--abajo", !vaAbajo && "is-off"]}></span>
    {/if}
  </span>
</div>

<style>
  .cue {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    color: var(--ink-mute);
    pointer-events: none;
  }
  .cue__label {
    letter-spacing: 0.46em;
    text-indent: 0.46em;
    text-transform: uppercase;
    font-size: 11px;
    font-weight: 500;
    color: rgba(255, 246, 239, 0.82);
  }
  .cue__gesto {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .cue__capsula {
    position: relative;
    display: block;
    width: 24px;
    height: 42px;
    overflow: hidden;
    border: 1.25px solid rgba(255, 246, 239, 0.86);
    border-radius: 999px;
  }
  .cue__punto {
    position: absolute;
    left: 50%;
    top: 9px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255, 246, 239, 0.96);
    transform: translateX(-50%);
    animation: cue-punto-baja 1.85s var(--ease-soft) infinite;
  }
  .cue.is-subir:not(.is-bajar) .cue__punto {
    top: auto;
    bottom: 9px;
    animation-name: cue-punto-sube;
  }
  .cue.is-subir.is-bajar .cue__punto {
    top: 50%;
    animation: cue-punto-ambos 2.4s ease-in-out infinite;
  }
  .cue__linea {
    display: block;
    width: 1px;
    height: 28px;
  }
  .cue__linea--abajo {
    background: linear-gradient(
      to bottom,
      rgba(255, 246, 239, 0.72) 0%,
      rgba(255, 246, 239, 0) 100%
    );
  }
  .cue__linea--arriba {
    background: linear-gradient(
      to top,
      rgba(255, 246, 239, 0.72) 0%,
      rgba(255, 246, 239, 0) 100%
    );
  }
  .cue__linea.is-off {
    opacity: 0;
  }
  @keyframes cue-punto-baja {
    0% {
      opacity: 0;
      transform: translateX(-50%) translateY(0);
    }
    18% {
      opacity: 1;
    }
    72% {
      opacity: 0.15;
      transform: translateX(-50%) translateY(18px);
    }
    100% {
      opacity: 0;
      transform: translateX(-50%) translateY(18px);
    }
  }
  @keyframes cue-punto-sube {
    0% {
      opacity: 0;
      transform: translateX(-50%) translateY(0);
    }
    18% {
      opacity: 1;
    }
    72% {
      opacity: 0.15;
      transform: translateX(-50%) translateY(-18px);
    }
    100% {
      opacity: 0;
      transform: translateX(-50%) translateY(-18px);
    }
  }
  @keyframes cue-punto-ambos {
    0%,
    100% {
      opacity: 0.95;
      transform: translate(-50%, calc(-50% - 12px));
    }
    50% {
      opacity: 0.7;
      transform: translate(-50%, calc(-50% + 12px));
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .cue {
      display: none;
    }
    .cue__punto {
      animation: none;
    }
  }
</style>
