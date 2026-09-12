<script lang="ts">
  import type { Track } from "../../datos/tipos";
  import { MOOD_KEYS, clamp, dnaNum, moodStats } from "./ficha";
  import copy from "./edicion.copy.json";

  type Props = { tracks: Track[]; selected: Track | null };
  let { tracks, selected }: Props = $props();

  const rows = $derived.by(() => {
    const labels = copy.moods as Record<string, string>;
    return MOOD_KEYS.map((key) => {
      const stats = moodStats(tracks, key);
      if (!stats) return null;
        const song = selected ? dnaNum(selected, key) : null;
      return {
        key,
        label: labels[key] ?? key,
        stats,
        wide: stats.iqr >= 25,
        song,
      };
    }).filter((row) => row != null);
  });
</script>

<div class="fp">
  {#each rows as row (row.key)}
    <div class="fp-row">
      <span class="fp-label">{row.label}</span>
      <div class="fp-track">
        <span
          class={["fp-iqr", row.wide && "is-wide"]}
          style:left={`${row.stats.p25}%`}
          style:width={`${row.stats.iqr}%`}
        ></span>
        <span class="fp-median" style:left={`${row.stats.median}%`}></span>
        {#if row.song != null}
          <span class="fp-song" style:left={`${clamp(row.song)}%`}></span>
        {/if}
      </div>
      <span class="fp-val">{Math.round(row.stats.median)}</span>
    </div>
  {/each}
</div>
<p class="method">{copy.fingerprintHint}</p>

<style>
  .fp {
    display: grid;
    gap: 11px;
  }
  .fp-row {
    display: grid;
    grid-template-columns: 118px minmax(0, 1fr) 36px;
    align-items: center;
    gap: 12px;
  }
  .fp-label {
    color: var(--ink-soft);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .fp-track {
    position: relative;
    height: 18px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
  }
  .fp-iqr {
    position: absolute;
    top: 4px;
    bottom: 4px;
    border-radius: 999px;
    background: rgba(255, 176, 138, 0.55);
  }
  .fp-iqr.is-wide {
    background: rgba(255, 143, 189, 0.72);
  }
  .fp-median {
    position: absolute;
    top: 1px;
    bottom: 1px;
    width: 2px;
    margin-left: -1px;
    background: var(--ink);
  }
  .fp-song {
    position: absolute;
    top: 50%;
    width: 9px;
    height: 9px;
    margin: -4.5px 0 0 -4.5px;
    border: 1.5px solid #140818;
    border-radius: 50%;
    background: #ff9466;
  }
  .fp-val {
    color: var(--ink-mute);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .method {
    margin-top: 18px;
    max-width: 56ch;
    color: var(--ink-mute);
    font-size: 11px;
    line-height: 1.55;
  }
  @media (max-width: 767px) {
    .fp-row {
      grid-template-columns: 1fr 36px;
    }
    .fp-label {
      grid-column: 1 / -1;
    }
  }
</style>
