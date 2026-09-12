<script lang="ts">
  type Props = { year: number; hasDNA: boolean; tesis: string[] };
  let { year, hasDNA, tesis }: Props = $props();
</script>

<div class="paso">
  <p class="year">{year}</p>
  {#if tesis.length}
    {#each tesis as line (line)}
      <p>{line}</p>
    {/each}
  {:else if !hasDNA}
    <p>Memoria en construcción.</p>
  {/if}
</div>

<style>
  .paso { text-align: center; }
  .year {
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(64px, 18vw, 160px);
    line-height: 0.9;
    letter-spacing: -0.03em;
  }
  p + p { margin-top: 6px; color: var(--ink-soft); }
</style>
