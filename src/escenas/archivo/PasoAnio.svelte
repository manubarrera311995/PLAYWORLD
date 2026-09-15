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
    <div class="year-slot" in:fly={inYear}>
      <h1 class="year" aria-label={String(year)}>
        {#each digits as d, i (i)}
          <span aria-hidden="true">{d}</span>
        {/each}
      </h1>
    </div>
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
  {/key}
</div>

<style>
  .paso {
    --year-size: clamp(88px, min(22vw, 32vh), 280px);
    position: relative;
    height: 100%;
    min-height: 0;
    width: 100%;
    text-align: center;
    overflow: hidden;
  }

  .year-slot {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
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
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    z-index: 2;
    display: grid;
    justify-items: center;
    gap: 10px;
    min-width: 0;
    padding-top: calc(var(--year-size) * 0.48);
    pointer-events: none;
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
    .sur {
      padding-top: calc(var(--year-size) * 0.52);
    }
  }
</style>
