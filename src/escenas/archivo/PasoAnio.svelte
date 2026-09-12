<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    year: number;
    hasDNA: boolean;
    tesis: string[];
    children?: Snippet;
  };
  let { year, hasDNA, tesis, children }: Props = $props();

  const digits = $derived(String(year).padStart(4, "0").split(""));
</script>

<div class="paso">
  <h1 class="year" aria-label={String(year)}>
    {#each digits as d, i (i)}
      <span aria-hidden="true">{d}</span>
    {/each}
  </h1>
  <div class="sur">
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

<style>
  .paso {
    height: 100%;
    min-height: 0;
    width: 100%;
    text-align: center;
    display: grid;
    grid-template-rows: 1fr auto 1fr;
    justify-items: center;
    gap: 32px;
  }
  .year {
    display: flex;
    justify-content: center;
    align-items: center;
    grid-row: 2;
    margin: 0;
    height: 0.82em;
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(88px, min(28vw, 34vh), 280px);
    line-height: 1;
    font-kerning: none;
    font-variant-numeric: tabular-nums;
    color: var(--ink-title);
    text-shadow: 0 14px 56px rgba(0, 0, 0, 0.4);
    gap: 0.06em;
  }
  .year span {
    display: block;
    width: 1ch;
    text-align: center;
  }
  .sur {
    grid-row: 3;
    align-self: start;
    display: grid;
    justify-items: center;
    gap: 8px;
    min-width: 0;
  }
  .meta {
    display: grid;
    gap: 2px;
    max-width: 28ch;
  }
  .meta p,
  p.meta {
    color: var(--ink-soft);
    font-size: clamp(13px, 1.3vw, 16px);
    letter-spacing: 0.04em;
    line-height: 1.25;
  }
  @media (max-width: 767px) {
    .paso {
      gap: 24px;
    }
    .year {
      font-size: clamp(72px, 22vw, 128px);
      gap: 0.04em;
    }
  }
</style>
