<script lang="ts">
  type Card = { year: number; label: string; className: string; art: string | null };
  type Props = { cards: Card[] };
  let { cards }: Props = $props();
</script>

<div class="collage">
  {#each cards as card, i (card.year)}
    <article class={["vidrio shard", card.className]} style:--i={i}>
      <span class="year">{card.year}</span>
      <span class="label">{card.label}</span>
    </article>
  {/each}
</div>

<style>
  .collage {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: min(100%, 520px);
    margin: 0 auto;
  }
  article {
    min-height: 88px;
    padding: 14px;
    display: grid;
    align-content: space-between;
    transform: rotate(calc((var(--i) - 1.5) * 2deg));
  }
  .year {
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(28px, 6vw, 40px);
  }
  .label {
    font-size: 12px;
    color: var(--ink-mute);
  }
  @media (min-width: 1024px) {
    .collage {
      grid-template-columns: repeat(4, 1fr);
    }
  }
</style>
