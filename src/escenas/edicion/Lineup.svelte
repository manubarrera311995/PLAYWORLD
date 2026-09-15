<script lang="ts">
  import type { Acto } from "./ficha";
  import { artUrl } from "../../datos/color";

  type Props = {
    actos: Acto[];
    selectedAct: string | null;
    note: string;
    cartel: string;
    onact: (prefix: string) => void;
  };
  let { actos, selectedAct, note, cartel, onact }: Props = $props();
</script>

<div class="wrap">
  <p class="kicker">{cartel}</p>
  <div class="lineup">
    {#each actos as acto (acto.prefix)}
      {@const cover = acto.songs.find((s) => s.art) ?? acto.songs[0]}
      {@const art = artUrl(cover?.art ?? null, "300")}
      {@const on = selectedAct === acto.prefix}
      <button
        type="button"
        class={["card", on && "is-on", selectedAct && !on && "is-dim"]}
        aria-pressed={on}
        title={acto.artist}
        onclick={() => onact(acto.prefix)}
      >
        <span class="cover">
          {#if art}
            <img src={art} alt="" loading="lazy" decoding="async" />
          {:else}
            <span class="fallback">{acto.artist}</span>
          {/if}
        </span>
        <span class="name">{acto.artist}</span>
      </button>
    {/each}
  </div>
  <p class="method">{note}</p>
</div>

<style>
  .kicker {
    color: var(--ink-mute);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.23em;
    text-transform: uppercase;
  }
  .lineup {
    isolation: isolate;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
    gap: 16px 12px;
    margin-top: 12px;
    padding: 10px 6px 4px;
    overflow: visible;
  }
  .card {
    appearance: none;
    position: relative;
    z-index: 0;
    border: 0;
    padding: 0;
    background: transparent;
    color: inherit;
    text-align: center;
    cursor: pointer;
  }
  .card::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    z-index: -1;
    aspect-ratio: 1;
    border-radius: 50%;
    pointer-events: none;
    background: radial-gradient(
      circle,
      rgba(255, 246, 239, 0.42) 28%,
      rgba(255, 246, 239, 0.12) 58%,
      transparent 74%
    );
    filter: blur(10px);
    transform: scale(1.22);
    opacity: 0;
    transition: opacity 1.2s cubic-bezier(0.33, 0, 0.2, 1);
  }
  .cover,
  .fallback {
    display: block;
    aspect-ratio: 1;
    width: 100%;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 1px transparent;
    transition:
      transform 1.2s cubic-bezier(0.33, 0, 0.2, 1),
      opacity 1.2s cubic-bezier(0.33, 0, 0.2, 1),
      filter 1.2s cubic-bezier(0.33, 0, 0.2, 1),
      box-shadow 1.2s cubic-bezier(0.33, 0, 0.2, 1);
  }
  .cover {
    position: relative;
  }
  .cover img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.06);
  }
  .cover::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(
      80% 70% at 50% 78%,
      rgba(16, 4, 28, 0.55) 0%,
      rgba(16, 4, 28, 0.12) 55%,
      transparent 72%
    );
  }
  .fallback {
    display: grid;
    place-items: center;
    padding: 8px;
    color: var(--ink-mute);
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: center;
  }
  .name {
    display: block;
    margin-top: 8px;
    overflow: hidden;
    color: var(--ink-mute);
    font-size: 10px;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition:
      color 1.2s cubic-bezier(0.33, 0, 0.2, 1),
      opacity 1.2s cubic-bezier(0.33, 0, 0.2, 1);
  }
  .card.is-on {
    z-index: 1;
  }
  .card.is-on::before {
    opacity: 1;
  }
  .card.is-on .cover {
    box-shadow:
      0 0 0 1px rgba(255, 246, 239, 0.28),
      0 0 18px rgba(255, 246, 239, 0.22);
  }
  .card.is-on .name {
    color: var(--ink);
  }
  .card.is-dim .cover,
  .card.is-dim .fallback {
    opacity: 0.42;
    filter: brightness(0.7) saturate(0.85);
  }
  .card.is-dim .name {
    opacity: 0.5;
  }
  .method {
    margin-top: 18px;
    max-width: 56ch;
    color: var(--ink-mute);
    font-size: 11px;
    line-height: 1.55;
  }

  @media (hover: hover) and (pointer: fine) {
    .lineup:has(.card:is(:hover, :focus-visible)) .card:not(:hover, :focus-visible) {
      z-index: 0;
    }
    .lineup:has(.card:is(:hover, :focus-visible)) .card:not(:hover, :focus-visible)::before {
      opacity: 0;
    }
    .lineup:has(.card:is(:hover, :focus-visible)) .card:not(:hover, :focus-visible) .cover,
    .lineup:has(.card:is(:hover, :focus-visible)) .card:not(:hover, :focus-visible) .fallback {
      opacity: 0.4;
      filter: brightness(0.68) saturate(0.8);
    }
    .lineup:has(.card:is(:hover, :focus-visible)) .card:not(:hover, :focus-visible) .name {
      opacity: 0.4;
    }
    .lineup:has(.card:is(:hover, :focus-visible)) .card:is(:hover, :focus-visible) {
      z-index: 2;
    }
    .lineup:has(.card:is(:hover, :focus-visible)) .card:is(:hover, :focus-visible)::before {
      opacity: 1;
    }
    .lineup:has(.card:is(:hover, :focus-visible)) .card:is(:hover, :focus-visible) .cover {
      opacity: 1;
      filter: none;
      transform: scale(1.02);
      box-shadow:
        0 0 0 1px rgba(255, 246, 239, 0.32),
        0 0 22px rgba(255, 246, 239, 0.26);
    }
    .lineup:has(.card:is(:hover, :focus-visible)) .card:is(:hover, :focus-visible) .name {
      opacity: 1;
      color: var(--ink);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cover,
    .fallback,
    .name,
    .card::before {
      transition: none;
    }
    .lineup:has(.card:is(:hover, :focus-visible)) .card:is(:hover, :focus-visible) .cover {
      transform: none;
    }
  }
</style>
