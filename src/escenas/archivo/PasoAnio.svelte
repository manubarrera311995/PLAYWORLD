<script lang="ts">
  import type { Snippet } from "svelte";
  import { fly } from "svelte/transition";
  import { reduce as reduceMotion } from "../../motion/reducedMotion";
  import Onda from "./Onda.svelte";

  type Props = {
    year: number;
    years?: number[];
    hasDNA: boolean;
    tesis: string[];
    cifra?: string;
    children?: Snippet;
  };
  let { year, years = [], hasDNA, tesis, cifra = "", children }: Props = $props();

  const digits = $derived(String(year).padStart(4, "0").split(""));
  const reduce = $derived($reduceMotion);
  const inYear = $derived(reduce ? { y: 0, duration: 0 } : { y: 18, duration: 720 });
  const inMeta = $derived(reduce ? { y: 0, duration: 0 } : { y: 18, duration: 720, delay: 80 });
</script>

<div class="paso">
  <Onda {year} {years} />
  {#key year}
    <div class="nucleo">
      <h1 class="year" aria-label={String(year)} in:fly={inYear}>
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
    --year-size: clamp(88px, min(22vw, 32vh), 280px);
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

  .year {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0;
    font-family: Anton, Impact, sans-serif;
    font-size: var(--year-size);
    line-height: 0.82;
    font-kerning: none;
    font-variant-numeric: tabular-nums;
    color: var(--ink-title);
    letter-spacing: -0.02em;
    gap: 0.02em;
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
    .paso {
      --year-size: clamp(72px, 22vw, 128px);
    }
    .year {
      gap: 0.01em;
    }
    .nucleo {
      gap: 10px;
      transform: translateY(clamp(24px, 5vh, 48px));
    }
  }
</style>
