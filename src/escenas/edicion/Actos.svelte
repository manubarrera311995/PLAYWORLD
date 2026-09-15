<script lang="ts">
  import type { DnaKey, Track } from "../../datos/tipos";
  import { PAD, VIEW_H, columnasDe, yDe } from "./actos";
  import { ACT_METRIC_KEYS, dnaNum, fill, groupActs, median, values } from "./ficha";
  import copy from "./edicion.copy.json";

  type Tip = { x: number; y: number; artist: string; n: number; center: number };

  type Props = {
    tracks: Track[];
    selectedAct: string | null;
    onact: (prefix: string) => void;
  };
  let { tracks, selectedAct, onact }: Props = $props();

  let metric = $state<DnaKey>("energy");
  let frameW = $state(1200);
  let hover = $state<string | null>(null);
  let tip = $state<Tip | null>(null);
  const labels = copy.moods as Record<string, string>;
  const ticks = [100, 75, 50, 25, 0];

  const available = $derived(ACT_METRIC_KEYS.filter((key) => values(tracks, key).length));
  const metricSafe = $derived(available.includes(metric) ? metric : available[0] ?? "energy");

  const acts = $derived.by(() =>
    groupActs(tracks)
      .map((act) => ({
        prefix: act.prefix,
        artist: act.artist,
        center: median(values(act.songs, metricSafe)) ?? 0,
        songs: act.songs.flatMap((song) => {
          const v = dnaNum(song, metricSafe);
          return v == null ? [] : [{ id: song.id, v }];
        }),
      }))
      .filter((act) => act.songs.length)
      .sort((a, b) => b.center - a.center),
  );
  const songCenter = $derived(median(values(tracks, metricSafe)));
  const actCenter = $derived(median(acts.map((act) => act.center)));
  const extremes = $derived(new Set([...acts.slice(0, 2), ...acts.slice(-2)].map((act) => act.prefix)));
  const plot = $derived(columnasDe(acts, frameW));
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

  function medir(nodo: HTMLElement) {
    const sync = () => {
      const next = Math.round(nodo.clientWidth);
      if (next > 0) frameW = next;
    };
    const ro = new ResizeObserver(sync);
    ro.observe(nodo);
    sync();
    return () => ro.disconnect();
  }

  function showTip(e: PointerEvent, col: { artist: string; n: number; center: number }): void {
    const shell = (e.currentTarget as SVGElement).closest("[data-shell]");
    if (!shell) return;
    const box = shell.getBoundingClientRect();
    tip = {
      x: e.clientX - box.left,
      y: e.clientY - box.top,
      artist: col.artist,
      n: col.n,
      center: col.center,
    };
  }

  function leave(): void {
    hover = null;
    tip = null;
  }

  function corto(name: string, dense: boolean): string {
    const max = dense ? 14 : 22;
    return name.length > max ? `${name.slice(0, max - 1)}…` : name;
  }
</script>

<div class="switch" role="group" aria-label="Elegir dimensión">
  {#each available as key (key)}
    <button type="button" class={[metricSafe === key && "is-on"]} onclick={() => (metric = key)}>
      {labels[key] ?? key}
    </button>
  {/each}
</div>

<div class="reading">
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
</div>

<div class="frame" data-shell {@attach medir}>
  <div class="scroll">
    <svg
      class="chart"
      viewBox={`0 0 ${plot.geo.width} ${plot.geo.height}`}
      preserveAspectRatio="none"
      width={plot.geo.width}
      height={VIEW_H}
      role="group"
      aria-label={`${copy.chapters.actos.title}. ${labels[metricSafe] ?? metricSafe}`}
      onpointerleave={leave}
    >
      {#each ticks as tick (tick)}
        <line
          class={["grid", tick === 50 && "is-mid"]}
          x1={PAD.left}
          x2={plot.geo.width - PAD.right}
          y1={yDe(tick)}
          y2={yDe(tick)}
        />
        <text class="axis" x={PAD.left - 8} y={yDe(tick) + 4} text-anchor="end">{tick}</text>
      {/each}
      {#if songCenter != null}
        <line class="ref is-songs" x1={PAD.left} x2={plot.geo.width - PAD.right} y1={yDe(songCenter)} y2={yDe(songCenter)} />
      {/if}
      {#if actCenter != null}
        <line class="ref is-acts" x1={PAD.left} x2={plot.geo.width - PAD.right} y1={yDe(actCenter)} y2={yDe(actCenter)} />
      {/if}
      {#each plot.cols as col (col.prefix)}
        {@const on = selectedAct === col.prefix}
        {@const hot = hover === col.prefix}
        {@const extreme = extremes.has(col.prefix)}
        {@const dim = Boolean(selectedAct) && !on}
        {@const named = !plot.geo.dense || extreme || on || hot}
        <g class={["col", on && "is-on", hot && "is-hot", extreme && "is-extreme", dim && "is-dim"]}>
          <rect
            class="hit"
            x={col.x - plot.geo.col / 2}
            y={PAD.top}
            width={plot.geo.col}
            height={plot.geo.plotH + PAD.bottom}
            tabindex="0"
            role="button"
            aria-pressed={on}
            aria-label={`${col.artist}, ${col.n} canciones, mediana ${Math.round(col.center)}`}
            onpointerenter={(e) => {
              hover = col.prefix;
              showTip(e, col);
            }}
            onpointermove={(e) => showTip(e, col)}
            onpointerleave={() => {
              if (hover === col.prefix) leave();
            }}
            onclick={() => onact(col.prefix)}
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onact(col.prefix);
              }
            }}
          />
          {#if hot || on}
            <line class="guide" x1={col.x} x2={col.x} y1={PAD.top} y2={PAD.top + plot.geo.plotH} />
          {/if}
          {#each col.songs as song (song.id)}
            <circle class="tick" cx={song.x} cy={song.y} r="2.3" />
          {/each}
          <circle class="dot" cx={col.x} cy={col.y} r={on || extreme ? 5.2 : 4.2} />
          {#if named}
            <text
              class="name"
              x={col.x}
              y={PAD.top + plot.geo.plotH + 10}
              text-anchor="end"
              transform={`rotate(-68 ${col.x} ${PAD.top + plot.geo.plotH + 10})`}
            >{corto(col.artist, plot.geo.dense)}</text>
          {/if}
        </g>
      {/each}
    </svg>
  </div>
  {#if tip}
    <div class="tooltip" style:left={`${tip.x}px`} style:top={`${tip.y}px`}>
      <strong>{tip.artist}</strong>
      <span>{tip.n} · {Math.round(tip.center)}</span>
    </div>
  {/if}
</div>

<p class="legend">
  <span><i class="swatch swatch--tick"></i>{copy.legendActSong}</span>
  <span><i class="swatch swatch--dot"></i>{copy.legendActMedian}</span>
  <span><i class="swatch swatch--songs"></i>{copy.songCenter}</span>
  <span><i class="swatch swatch--acts"></i>{copy.actCenter}</span>
  <span class="method">{copy.actsHint}</span>
</p>

<style>
  .switch {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 22px;
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
  .reading {
    display: grid;
    grid-template-columns: auto minmax(220px, 0.4fr) minmax(0, 1fr);
    gap: 18px 32px;
    align-items: end;
    margin-bottom: 22px;
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
  }
  .cmp strong {
    display: block;
    font-family: Anton, Impact, sans-serif;
    font-size: 42px;
    font-weight: 400;
    letter-spacing: -0.04em;
  }
  .cmp span,
  .reading > p {
    color: var(--ink-soft);
    font-size: 13px;
    line-height: 1.5;
  }
  .frame {
    position: relative;
    height: min(64dvh, 680px);
    min-height: 380px;
    border: 1px solid rgba(255, 246, 239, 0.14);
    background: rgba(9, 2, 18, 0.35);
  }
  .scroll {
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .chart {
    display: block;
    height: 100%;
    min-width: 100%;
  }
  .grid {
    stroke: rgba(255, 246, 239, 0.08);
    stroke-width: 1;
  }
  .grid.is-mid {
    stroke: rgba(255, 246, 239, 0.16);
    stroke-dasharray: 4 6;
  }
  .axis {
    fill: rgba(255, 246, 239, 0.42);
    font-family: Inter, system-ui, sans-serif;
    font-size: 11px;
    letter-spacing: 0.08em;
  }
  .ref {
    stroke-width: 1.4;
  }
  .ref.is-songs {
    stroke: rgba(255, 246, 239, 0.42);
  }
  .ref.is-acts {
    stroke: #ff8fbd;
  }
  .hit {
    fill: transparent;
    cursor: pointer;
  }
  .hit:focus-visible {
    outline: 1px solid #ff9466;
    outline-offset: -2px;
  }
  .guide {
    stroke: rgba(255, 246, 239, 0.22);
    stroke-width: 1;
  }
  .tick {
    fill: rgba(255, 176, 138, 0.62);
    pointer-events: none;
  }
  .dot {
    fill: var(--ink);
    pointer-events: none;
  }
  .col.is-extreme .dot,
  .col.is-on .dot,
  .col.is-hot .dot {
    fill: #ff9466;
  }
  .col.is-dim {
    opacity: 0.16;
  }
  .col.is-on,
  .col.is-hot {
    opacity: 1;
  }
  .name {
    fill: var(--ink-soft);
    font-family: Inter, system-ui, sans-serif;
    font-size: 11px;
    pointer-events: none;
  }
  .col.is-on .name,
  .col.is-extreme .name,
  .col.is-hot .name {
    fill: var(--ink);
  }
  .tooltip {
    position: absolute;
    z-index: 3;
    transform: translate(-10px, -120%);
    min-width: 140px;
    padding: 8px 10px;
    border: 1px solid rgba(255, 246, 239, 0.14);
    background: rgba(16, 6, 22, 0.92);
    pointer-events: none;
  }
  .tooltip strong,
  .tooltip span {
    display: block;
  }
  .tooltip strong {
    font-size: 12px;
  }
  .tooltip span {
    color: var(--ink-mute);
    font-size: 11px;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 22px;
    align-items: center;
    margin-top: 16px;
    color: var(--ink-mute);
    font-size: 11px;
  }
  .method {
    margin-left: auto;
    max-width: 62ch;
    text-align: right;
    line-height: 1.45;
  }
  .swatch {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 6px;
    border-radius: 50%;
    background: var(--ink);
    vertical-align: middle;
  }
  .swatch--tick {
    background: rgba(255, 176, 138, 0.7);
  }
  .swatch--dot {
    background: #ff9466;
  }
  .swatch--songs {
    width: 14px;
    height: 2px;
    border-radius: 0;
    background: rgba(255, 246, 239, 0.7);
  }
  .swatch--acts {
    width: 14px;
    height: 2px;
    border-radius: 0;
    background: #ff8fbd;
  }
  @media (max-width: 980px) {
    .reading {
      grid-template-columns: 1fr;
    }
    .method {
      width: 100%;
      margin-left: 0;
      text-align: left;
    }
  }
</style>
