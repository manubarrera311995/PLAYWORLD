<script lang="ts">
  import type { Snippet } from "svelte";
  import { fly } from "svelte/transition";
  import { reduce as reduceMotion } from "../../motion/reducedMotion";

  type Props = {
    year: number;
    hasDNA: boolean;
    tesis: string[];
    cifra?: string;
    velo?: boolean;
    children?: Snippet;
  };
  let { year, hasDNA, tesis, cifra = "", velo = false, children }: Props = $props();

  const digits = $derived(String(year).padStart(4, "0").split(""));
  const reduce = $derived($reduceMotion);
  const inYear = $derived(reduce ? { y: 0, duration: 0 } : { y: 18, duration: 720 });
  const inMeta = $derived(reduce ? { y: 0, duration: 0 } : { y: 18, duration: 720, delay: 80 });
</script>

<div class="paso">
  {#key year}
    <div class={["nucleo", velo && "con-velo"]}>
      <h1 class="year tipo-anio" aria-label={String(year)} in:fly={inYear}>
        {#each digits as d, i (i)}
          <span aria-hidden="true">{d}</span>
        {/each}
      </h1>
      <div class="sur" in:fly={inMeta}>
        {#if cifra}
          <p class="cifra">{cifra}</p>
        {/if}
        {#if tesis.length}
          <div class="meta">
            {#each tesis as line (line)}
              <p>{line}</p>
            {/each}
          </div>
        {:else if !hasDNA}
          <p class="meta">Memoria en construcción.</p>
        {/if}
        {@render children?.()}
      </div>
    </div>
  {/key}
</div>

<style>
  .paso {
    position: relative;
    height: 100%;
    min-height: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    overflow: visible;
  }

  .nucleo {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    pointer-events: none;
    transform: translateY(clamp(40px, 7.5vh, 76px));
  }

  /* Velo solo detrás del bloque de texto: el collage sigue libre en los bordes. */
  .nucleo.con-velo::before {
    content: "";
    position: absolute;
    z-index: -1;
    left: 50%;
    top: 46%;
    width: min(1080px, 94vw);
    height: 132%;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      ellipse 68% 60% at 50% 46%,
      rgba(10, 4, 14, 0.82) 0%,
      rgba(10, 4, 14, 0.52) 42%,
      rgba(10, 4, 14, 0) 74%
    );
    pointer-events: none;
  }

  .nucleo.con-velo .year {
    text-shadow: 0 2px 28px rgba(8, 2, 12, 0.55);
  }

  .nucleo.con-velo .cifra {
    color: rgba(255, 246, 239, 0.94);
  }

  .nucleo.con-velo .meta p,
  .nucleo.con-velo p.meta {
    color: rgba(255, 246, 239, 0.94);
  }

  .year {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0;
    font-kerning: none;
    gap: 0.02em;
    font-size: clamp(78px, min(19vw, 28vh), 246px);
  }

  .year span {
    display: block;
    width: 0.82em;
    text-align: center;
  }

  .sur {
    display: grid;
    justify-items: center;
    gap: 10px;
    min-width: 0;
  }

  .meta {
    display: grid;
    gap: 2px;
    max-width: 32ch;
  }

  .cifra {
    margin: 0;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.28em;
    text-indent: 0.28em;
    text-transform: uppercase;
    color: rgba(255, 246, 239, 0.72);
    font-variant-numeric: tabular-nums;
  }

  .meta p,
  p.meta {
    color: rgba(255, 245, 236, 0.8);
    font-size: clamp(12px, 1.15vw, 14px);
    letter-spacing: 0.02em;
    line-height: 1.45;
  }

  @media (max-width: 767px) {
    .year {
      gap: 0.01em;
      font-size: clamp(64px, 19vw, 112px);
    }
    .nucleo {
      gap: 10px;
      transform: translateY(clamp(24px, 5vh, 48px));
    }
  }
</style>
