<script lang="ts">
  import type { Track } from "../../datos/tipos";
  import { artUrl } from "../../datos/color";
  import { DELTA_KEYS, clusterOf, dnaNum, fill, moodStats } from "./ficha";
  import copy from "./edicion.copy.json";

  type Props = { tracks: Track[]; selected: Track | null; year: number };
  let { tracks, selected, year }: Props = $props();

  const labels = copy.moods as Record<string, string>;
  const art = $derived(artUrl(selected?.art ?? null, "300"));
  const rows = $derived.by(() => {
    if (!selected) return [];
    return DELTA_KEYS.map((key) => {
      const stats = moodStats(tracks, key);
      const value = dnaNum(selected, key);
      if (!stats || value == null) return null;
      const delta = value - stats.median;
      const width = Math.min(50, Math.abs(delta) / 2);
      return {
        key,
        label: labels[key] ?? key,
        delta,
        width,
        left: delta >= 0 ? 50 : 50 - width,
      };
    }).filter((row) => row != null);
  });
  const meta = $derived(
    selected
      ? [selected.dna.keyNote, selected.dna.scale, clusterOf(selected)].filter(Boolean).join(" · ")
      : "",
  );
</script>

<aside class="panel">
  <p class="kicker">{copy.songEyebrow}</p>
  {#if !selected}
    <p class="empty">{copy.songEmpty}</p>
  {:else}
    <div class="head">
      {#if art}
        <img class="art" src={art} alt="" />
      {:else}
        <div class="art"></div>
      {/if}
      <div>
        <p>{selected.artist || "Artista sin identificar"}</p>
        <h3>{selected.track || selected.id}</h3>
        <p>{meta}</p>
      </div>
    </div>
    <div class="delta">
      {#each rows as row (row.key)}
        <div class="delta-row">
          <span>{row.label}</span>
          <div class="track">
            <span
              class={["bar", row.delta >= 0 ? "is-pos" : "is-neg"]}
              style:left={`${row.left}%`}
              style:width={`${row.width}%`}
            ></span>
          </div>
          <strong>{row.delta >= 0 ? "+" : ""}{Math.round(row.delta)}</strong>
        </div>
      {/each}
    </div>
    <p class="method">{fill(copy.deltaHint, { year })}</p>
  {/if}
</aside>

<style>
  .panel {
    grid-area: panel;
    min-height: 420px;
    padding: 22px;
    border: 1px solid rgba(255, 246, 239, 0.14);
    background: rgba(9, 2, 18, 0.28);
  }
  .kicker {
    color: var(--ink-mute);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.23em;
    text-transform: uppercase;
  }
  .empty {
    margin-top: 12px;
    color: var(--ink-mute);
    font-size: 14px;
    line-height: 1.5;
  }
  .head {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 14px;
    margin: 12px 0 20px;
  }
  .art {
    width: 72px;
    height: 72px;
    object-fit: cover;
    background: rgba(255, 255, 255, 0.08);
  }
  h3 {
    font-size: 18px;
    letter-spacing: -0.03em;
    line-height: 1.15;
  }
  .head p {
    color: var(--ink-mute);
    font-size: 12px;
  }
  .delta {
    display: grid;
    gap: 9px;
  }
  .delta-row {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr) 36px;
    gap: 10px;
    align-items: center;
  }
  .delta-row span:first-child {
    color: var(--ink-mute);
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .track {
    position: relative;
    height: 10px;
    background: rgba(255, 255, 255, 0.06);
  }
  .track::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    background: rgba(255, 246, 239, 0.35);
  }
  .bar {
    position: absolute;
    top: 0;
    bottom: 0;
  }
  .bar.is-pos {
    background: #ffb08a;
  }
  .bar.is-neg {
    background: #ff8fbd;
  }
  .delta-row strong {
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .method {
    margin-top: 18px;
    color: var(--ink-mute);
    font-size: 11px;
    line-height: 1.55;
  }
</style>
