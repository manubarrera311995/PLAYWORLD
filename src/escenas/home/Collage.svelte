<script lang="ts">
  import { onMount } from "svelte";
  import { cargarEdiciones, cargarTracks } from "../../datos/archivo";
  import { artUrl } from "../../datos/color";

  type Card = { year: number; label: string; className: string; art: string | null };
  type Props = { cards: Card[] };
  let { cards }: Props = $props();

  let dnaArt = $state.raw<Record<number, string>>({});

  onMount(() => {
    let dead = false;
    void (async () => {
      const eds = await cargarEdiciones();
      if (dead) return;
      const conCollage = eds.filter((e) => e.hasDNA);
      const pares = await Promise.all(
        conCollage.map(async (e) => {
          const tracks = await cargarTracks(e.year);
          const preferido = e.collage[0]?.trackId;
          const t =
            tracks.find((x) => x.id === preferido && x.art) ??
            tracks.find((x) => x.art);
          return [e.year, artUrl(t?.art ?? null, "300")] as const;
        }),
      );
      if (dead) return;
      const next: Record<number, string> = {};
      for (const [y, src] of pares) {
        if (src) next[y] = src;
      }
      dnaArt = next;
    })();
    return () => {
      dead = true;
    };
  });
</script>

<div class="collage">
  {#each cards as card, i (card.year)}
    {@const src = dnaArt[card.year] ?? card.art}
    {@const viva = Boolean(src)}
    <article
      class={["vidrio shard collage__card", card.className, !viva && "is-fantasma"]}
      style:--i={i}
    >
      {#if src}
        <img src={src} alt="" loading="lazy" decoding="async" draggable="false" />
      {/if}
      <div class="meta">
        <span class="year">{card.year}</span>
        {#if card.label}
          <span class="label">{card.label}</span>
        {/if}
      </div>
    </article>
  {/each}
</div>

<style>
  .collage {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
  }
  article {
    position: absolute;
    left: 50%;
    top: 50%;
    width: clamp(88px, 18vw, 156px);
    aspect-ratio: 1;
    padding: 0;
    display: grid;
    align-content: end;
    justify-items: center;
    opacity: 0;
    will-change: transform;
    border-radius: 50%;
    overflow: hidden;
  }
  img {
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.06);
  }
  article::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background: radial-gradient(
      80% 70% at 50% 78%,
      rgba(16, 4, 28, 0.82) 0%,
      rgba(16, 4, 28, 0.2) 55%,
      transparent 72%
    );
  }
  .meta {
    position: relative;
    z-index: 6;
    padding: 0 10px 16px;
    display: grid;
    gap: 2px;
    text-align: center;
    justify-items: center;
  }
  .year {
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(18px, 2.4vw, 26px);
    line-height: 0.9;
    text-shadow: 0 1px 10px rgba(12, 0, 24, 0.55);
  }
  .label {
    font-size: 9px;
    letter-spacing: 0.04em;
    color: var(--ink-soft);
    line-height: 1.15;
  }
  .is-fantasma {
    background: rgba(255, 255, 255, 0.07);
  }
  .is-fantasma::before {
    background: radial-gradient(
      70% 70% at 50% 40%,
      rgba(255, 255, 255, 0.12),
      rgba(18, 0, 36, 0.08) 70%
    );
  }
  .is-fantasma .label {
    color: var(--ink-mute);
  }
  @media (max-width: 767px) {
    article {
      width: clamp(84px, 22vw, 112px);
    }
    .meta {
      padding: 0 6px 12px;
    }
    .year {
      font-size: clamp(11px, 3.2vw, 14px);
    }
    .label {
      display: none;
    }
  }

  :global(.home.is-quieto) .collage {
    position: relative;
    inset: auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    width: min(100%, 640px);
    margin: 0 auto;
    pointer-events: auto;
  }
  :global(.home.is-quieto) article {
    position: relative;
    left: auto;
    top: auto;
    width: auto;
    opacity: 1;
    transform: rotate(calc((var(--i) - 7.5) * 0.6deg));
    will-change: auto;
  }
  :global(.home.is-quieto) .label {
    display: block;
  }
  @media (max-width: 767px) {
    :global(.home.is-quieto) .collage {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .collage {
      position: relative;
      inset: auto;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      width: min(100%, 640px);
      margin: 0 auto;
      pointer-events: auto;
    }
    article {
      position: relative;
      left: auto;
      top: auto;
      width: auto;
      opacity: 1;
      transform: rotate(calc((var(--i) - 7.5) * 0.6deg));
      will-change: auto;
    }
    .label {
      display: block;
    }
    @media (max-width: 767px) {
      .collage {
        grid-template-columns: 1fr 1fr;
      }
    }
  }
</style>
