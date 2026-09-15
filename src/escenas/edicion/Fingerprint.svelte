<script lang="ts">
  import type { Track } from "../../datos/tipos";
  import { MOOD_KEYS, clamp, dnaNum, moodStats } from "./ficha";
  import copy from "./edicion.copy.json";

  type Props = { tracks: Track[]; selected: Track | null };
  let { tracks, selected }: Props = $props();

  const ticks = [0, 25, 50, 75, 100];
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

<figure class="fp">
  <div class="chart">
    <p class="axis-y">{copy.fpY}</p>
    <div class="plot">
      {#each rows as row (row.key)}
        <div class="fp-row">
          <span class="fp-label">{row.label}</span>
          <div class="fp-track">
            <span class="fp-mid"></span>
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
      <div class="axis-x" aria-hidden="true">
        <span class="fp-label"></span>
        <div class="scale-wrap">
          <div class="scale">
            {#each ticks as tick (tick)}
              <span class={["tick", tick === 50 && "is-mid"]}>{tick}</span>
            {/each}
          </div>
          <p class="axis-x-label">{copy.fpX}</p>
        </div>
        <span class="fp-val"></span>
      </div>
    </div>
  </div>
  <figcaption class="legend">
    <span><i class="swatch swatch--median"></i>{copy.legendMedian}</span>
    <span><i class="swatch swatch--iqr"></i>{copy.legendIqr}</span>
    <span><i class="swatch swatch--wide"></i>{copy.legendWide}</span>
    <span><i class="swatch swatch--song"></i>{copy.legendSong}</span>
  </figcaption>
</figure>

<style>
  .fp {
    display: grid;
    gap: 18px;
    margin: 0;
  }
  .chart {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr);
    gap: 12px;
    align-items: stretch;
  }
  .axis-y,
  .axis-x-label {
    margin: 0;
    color: rgba(255, 246, 239, 0.42);
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .axis-y {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    align-self: center;
    justify-self: center;
    padding-bottom: 28px;
  }
  .plot {
    display: grid;
    gap: 11px;
  }
  .fp-row,
  .axis-x {
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
  .fp-mid {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    background: rgba(255, 246, 239, 0.16);
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
  .axis-x {
    align-items: start;
  }
  .scale-wrap {
    display: grid;
    gap: 6px;
  }
  .scale {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid rgba(255, 246, 239, 0.28);
    padding-top: 6px;
    color: rgba(255, 246, 239, 0.42);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.08em;
  }
  .tick.is-mid {
    color: rgba(255, 246, 239, 0.62);
  }
  .axis-x-label {
    margin: 0;
    text-align: center;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 22px;
    color: var(--ink-mute);
    font-size: 11px;
  }
  .swatch {
    display: inline-block;
    width: 14px;
    height: 8px;
    margin-right: 6px;
    vertical-align: middle;
    border-radius: 999px;
    background: rgba(255, 176, 138, 0.55);
  }
  .swatch--median {
    width: 2px;
    height: 12px;
    border-radius: 0;
    background: var(--ink);
  }
  .swatch--wide {
    background: rgba(255, 143, 189, 0.72);
  }
  .swatch--song {
    width: 9px;
    height: 9px;
    border: 1.5px solid #140818;
    border-radius: 50%;
    background: #ff9466;
  }
  @media (max-width: 767px) {
    .chart {
      grid-template-columns: 1fr;
    }
    .axis-y {
      writing-mode: horizontal-tb;
      transform: none;
      justify-self: start;
      padding: 0;
    }
    .fp-row,
    .axis-x {
      grid-template-columns: 1fr 36px;
    }
    .fp-label {
      grid-column: 1 / -1;
    }
    .axis-x .fp-label,
    .axis-x .fp-val {
      display: none;
    }
  }
</style>
