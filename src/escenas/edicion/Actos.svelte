<script lang="ts">
  import type { DnaKey, Track } from "../../datos/tipos";
  import {
    ACT_METRIC_KEYS,
    clamp,
    dnaNum,
    fill,
    groupActs,
    median,
    values,
  } from "./ficha";
  import copy from "./edicion.copy.json";

  type Props = {
    tracks: Track[];
    selectedAct: string | null;
    onact: (prefix: string) => void;
  };
  let { tracks, selectedAct, onact }: Props = $props();

  let metric = $state<DnaKey>("energy");
  const labels = copy.moods as Record<string, string>;

  const available = $derived(ACT_METRIC_KEYS.filter((key) => values(tracks, key).length));
  const metricSafe = $derived(available.includes(metric) ? metric : available[0] ?? "energy");

  const acts = $derived.by(() =>
    groupActs(tracks)
      .map((act) => ({ ...act, center: median(values(act.songs, metricSafe)) }))
      .filter((act) => act.center != null)
      .sort((a, b) => (b.center ?? 0) - (a.center ?? 0)),
  );
  const songCenter = $derived(median(values(tracks, metricSafe)));
  const actCenter = $derived(median(acts.map((act) => act.center ?? 0)));
  const extremes = $derived(new Set([...acts.slice(0, 2), ...acts.slice(-2)].map((act) => act.prefix)));
  const reading = $derived.by(() => {
    if (songCenter == null || actCenter == null) return "";
    const difference = Math.round(Math.abs(songCenter - actCenter));
    const label = labels[metricSafe] ?? metricSafe;
    if (difference <= 3) return fill(copy.actsSame, { metric: label });
    return fill(copy.actsDiff, {
      n: difference,
      dir: songCenter > actCenter ? copy.above : copy.below,
    });
  });
</script>

<div class="switch" role="group" aria-label="Elegir dimensión">
  {#each available as key (key)}
    <button type="button" class={[metricSafe === key && "is-on"]} onclick={() => (metric = key)}>
      {labels[key] ?? key}
    </button>
  {/each}
</div>

<div class="layout">
  <div class="plot">
    <div class="scale">
      <span>{copy.actsScale}</span>
      <div class="labels"><span>0</span><span>50</span><span>100</span></div>
      <span></span>
    </div>
    {#each acts as act (act.prefix)}
      <button
        type="button"
        class={["row", extremes.has(act.prefix) && "is-extreme", selectedAct === act.prefix && "is-on"]}
        onclick={() => onact(act.prefix)}
      >
        <span class="name" title={act.artist}>{act.artist} · {act.songs.length}</span>
        <div class="bar">
          {#each act.songs as song (song.id)}
            {@const v = dnaNum(song, metricSafe)}
            {#if v != null}
              <span class="tick" style:left={`${clamp(v)}%`}></span>
            {/if}
          {/each}
          {#if songCenter != null}
            <span class="center is-songs" style:left={`${songCenter}%`}></span>
          {/if}
          {#if actCenter != null}
            <span class="center is-acts" style:left={`${actCenter}%`}></span>
          {/if}
          <span class="dot" style:left={`${act.center}%`}></span>
        </div>
        <span class="val">{Math.round(act.center ?? 0)}</span>
      </button>
    {/each}
  </div>
  <aside class="reading">
    <p class="kicker">{copy.actsEyebrow}</p>
    <div class="cmp">
      <div>
        <strong>{songCenter == null ? "—" : Math.round(songCenter)}</strong>
        <span>{copy.songCenter}</span>
      </div>
      <div>
        <strong>{actCenter == null ? "—" : Math.round(actCenter)}</strong>
        <span>{copy.actCenter}</span>
      </div>
    </div>
    <p>{reading}</p>
    <p class="method">{copy.actsHint}</p>
  </aside>
</div>

<style>
  .switch {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 28px;
  }
  .switch button {
    appearance: none;
    border: 1px solid rgba(255, 246, 239, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.04);
    padding: 7px 12px;
    color: var(--ink-soft);
    font-size: 11px;
    cursor: pointer;
  }
  .switch button.is-on,
  .switch button:hover {
    border-color: rgba(255, 246, 239, 0.7);
    background: var(--ink);
    color: #140818;
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.8fr);
    gap: clamp(28px, 4vw, 64px);
    align-items: start;
  }
  .plot {
    display: grid;
    gap: 7px;
  }
  .scale,
  .row {
    display: grid;
    grid-template-columns: minmax(120px, 180px) minmax(0, 1fr) 36px;
    gap: 12px;
    align-items: center;
  }
  .scale {
    color: var(--ink-mute);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .labels {
    display: flex;
    justify-content: space-between;
  }
  .row {
    appearance: none;
    border: 0;
    background: transparent;
    color: inherit;
    min-height: 28px;
    padding: 0;
    text-align: left;
    cursor: pointer;
  }
  .row.is-on .name,
  .row.is-extreme .name {
    color: var(--ink);
  }
  .name {
    overflow: hidden;
    color: var(--ink-soft);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bar {
    position: relative;
    height: 18px;
    background: rgba(255, 255, 255, 0.05);
  }
  .center {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
  }
  .center.is-songs {
    background: rgba(255, 246, 239, 0.35);
  }
  .center.is-acts {
    background: #ff8fbd;
  }
  .dot {
    position: absolute;
    top: 4px;
    width: 10px;
    height: 10px;
    margin-left: -5px;
    border-radius: 50%;
    background: var(--ink);
  }
  .row.is-extreme .dot,
  .row.is-on .dot {
    background: #ff9466;
  }
  .tick {
    position: absolute;
    top: 7px;
    width: 4px;
    height: 4px;
    margin-left: -2px;
    border-radius: 50%;
    background: rgba(255, 176, 138, 0.55);
  }
  .val {
    color: var(--ink-mute);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .reading {
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
  .cmp {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 16px 0 20px;
  }
  .cmp strong {
    display: block;
    font-family: Anton, Impact, sans-serif;
    font-size: 42px;
    font-weight: 400;
    letter-spacing: -0.04em;
  }
  .cmp span,
  .reading p {
    color: var(--ink-soft);
    font-size: 13px;
    line-height: 1.5;
  }
  .method {
    color: var(--ink-mute) !important;
    font-size: 11px !important;
    line-height: 1.55 !important;
  }
  @media (max-width: 980px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>
