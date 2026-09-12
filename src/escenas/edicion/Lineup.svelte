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
      {@const art = artUrl(cover?.art ?? null, "64")}
      {@const on = selectedAct === acto.prefix}
      <button
        type="button"
        class={["card", on && "is-on", selectedAct && !on && "is-dim"]}
        aria-pressed={on}
        title={acto.artist}
        onclick={() => onact(acto.prefix)}
      >
        {#if art}
          <img src={art} alt="" loading="lazy" decoding="async" />
        {:else}
          <div class="fallback">{acto.artist}</div>
        {/if}
        <span>{acto.artist}</span>
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
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: 10px 8px;
    margin-top: 12px;
  }
  .card {
    appearance: none;
    border: 1px solid transparent;
    padding: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .card img,
  .fallback {
    display: block;
    aspect-ratio: 1;
    width: 100%;
    object-fit: cover;
    background: rgba(255, 255, 255, 0.08);
  }
  .fallback {
    display: grid;
    place-items: center;
    color: var(--ink-mute);
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: center;
  }
  .card span {
    display: block;
    margin-top: 6px;
    overflow: hidden;
    color: var(--ink-mute);
    font-size: 10px;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .card.is-on {
    border-color: #ff9466;
  }
  .card.is-on span {
    color: var(--ink);
  }
  .card.is-dim img,
  .card.is-dim .fallback {
    opacity: 0.28;
  }
  .method {
    margin-top: 18px;
    max-width: 56ch;
    color: var(--ink-mute);
    font-size: 11px;
    line-height: 1.55;
  }
</style>
