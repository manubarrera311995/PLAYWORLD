<script lang="ts">
  import type { DnaKey, Track } from "../../datos/tipos";
  import type { Fila, GeoActos } from "./actos";
  import { REF_EPS, filasDe, repartoDe, xDe } from "./actos";
  import { ACT_METRIC_KEYS, dnaNum, fill, groupActs, median, values } from "./ficha";
  import copy from "./edicion.copy.json";

  type Tip = { x: number; y: number; artist: string; meta: string; delta: string; thin: boolean };

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
  const ticks = [0, 50, 100];

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
  const plot = $derived(filasDe(acts, frameW));

  /**
   * Una sola referencia manda: la mediana del año. El centro por artista solo
   * se dibuja cuando las dos formas de contar discrepan de verdad; si no, dos
   * líneas a tres puntos de distancia se leen como un trazo doble roto.
   */
  const ref = $derived.by(() => {
    if (songCenter == null) return null;
    // El delta se cuenta desde la línea del año, que es la referencia rotulada.
    const gap = actCenter == null ? 0 : actCenter - songCenter;
    return {
      xs: xDe(songCenter, plot.geo),
      xa: actCenter == null ? 0 : xDe(actCenter, plot.geo),
      split: actCenter != null && Math.abs(gap) > REF_EPS,
      songs: Math.round(songCenter),
      acts: actCenter == null ? 0 : Math.round(actCenter),
      delta: Math.round(Math.abs(gap)),
      dir: gap > 0 ? "+" : "−",
    };
  });

  const reparto = $derived(repartoDe(acts.map((act) => act.center), songCenter));

  /**
   * Las dos formas de contar el centro bajan a la letra pequeña: son una nota
   * de método, no el titular. En el archivo coinciden casi siempre.
   */
  const centersNote = $derived.by(() => {
    if (songCenter == null || actCenter == null) return "";
    const head = fill(copy.actsCenters, { songs: Math.round(songCenter), acts: Math.round(actCenter) });
    const difference = Math.round(Math.abs(songCenter - actCenter));
    const tail =
      difference <= REF_EPS
        ? copy.actsSame
        : fill(copy.actsDiff, { n: difference, dir: songCenter > actCenter ? copy.above : copy.below });
    return `${head} ${tail}`;
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

  /** Etiqueta pegada a la línea, hacia el lado donde queda sitio. */
  function anclaje(x: number, geo: GeoActos): { anchor: "start" | "end"; x: number } {
    const room = geo.left + geo.plotW - x;
    return room > 160 ? { anchor: "start", x: x + 8 } : { anchor: "end", x: x - 8 };
  }

  function showTip(e: PointerEvent, row: Fila): void {
    const shell = (e.currentTarget as SVGElement).closest("[data-shell]");
    if (!shell) return;
    const box = shell.getBoundingClientRect();
    const diff = songCenter == null ? null : Math.round(row.center - songCenter);
    tip = {
      x: e.clientX - box.left,
      y: e.clientY - box.top,
      artist: row.artist,
      meta: fill(copy.actsTip, { n: row.n, v: Math.round(row.center) }),
      delta: diff == null || diff === 0 ? "" : fill(copy.actsTipDelta, { sign: diff > 0 ? "+" : "−", d: Math.abs(diff) }),
      thin: row.thin,
    };
  }

  function leave(): void {
    hover = null;
    tip = null;
  }

  function corto(name: string, max: number): string {
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
  <div class="cifra">
    <strong>
      {reparto ? reparto.n : "—"}
      {#if reparto}<span>{fill(copy.actsShareOf, { total: reparto.total })}</span>{/if}
    </strong>
    <span>{copy.actsShare}</span>
  </div>
</div>

<div class="frame" data-shell {@attach medir}>
  <svg
    class="chart"
    viewBox={`0 0 ${plot.geo.width} ${plot.geo.height}`}
    width={plot.geo.width}
    height={plot.geo.height}
    role="group"
    aria-label={`${copy.chapters.actos.title}. ${labels[metricSafe] ?? metricSafe}`}
    onpointerleave={leave}
  >
    <text class="axis-title" x="16" y={plot.geo.top - 18}>{(labels[metricSafe] ?? metricSafe).toUpperCase()} · 0–100</text>
    {#each ticks as tick, i (tick)}
      <line
        class={["grid", tick === 50 && "is-mid"]}
        x1={xDe(tick, plot.geo)}
        x2={xDe(tick, plot.geo)}
        y1={plot.geo.top - 10}
        y2={plot.geo.bottom + 8}
      />
      <text
        class="axis"
        x={xDe(tick, plot.geo)}
        y={plot.geo.top - 18}
        text-anchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
      >{tick}</text>
    {/each}

    {#if ref}
      {@const tagYear = anclaje(ref.xs, plot.geo)}
      {#if ref.split}
        {@const tagActs = anclaje(ref.xa, plot.geo)}
        <rect
          class="band"
          x={Math.min(ref.xs, ref.xa)}
          y={plot.geo.top - 10}
          width={Math.abs(ref.xs - ref.xa)}
          height={plot.geo.bottom + 18 - plot.geo.top}
        />
        <line class="ref is-acts" x1={ref.xa} x2={ref.xa} y1={plot.geo.top - 10} y2={plot.geo.bottom + 8} />
        <text class="flag is-acts" x={tagActs.x} y={plot.geo.bottom + 28} text-anchor={tagActs.anchor}>{copy.actsRefActs} · {ref.acts} ({ref.dir}{ref.delta})</text>
      {/if}
      <line class="ref is-songs" x1={ref.xs} x2={ref.xs} y1={plot.geo.top - 10} y2={plot.geo.bottom + 8} />
      <text class="flag" x={tagYear.x} y={plot.geo.top - 38} text-anchor={tagYear.anchor}>{copy.actsRefYear} · {ref.songs}</text>
    {/if}

    {#each plot.rows as row (row.prefix)}
      {@const on = selectedAct === row.prefix}
      {@const hot = hover === row.prefix}
      {@const dim = Boolean(selectedAct) && !on}
      <g class={["row", on && "is-on", hot && "is-hot", row.thin && "is-thin", dim && "is-dim"]}>
        <line class="rail" x1={plot.geo.left} x2={plot.geo.left + plot.geo.plotW} y1={row.y} y2={row.y} />
        {#if on || hot}
          <rect
            class="focus"
            x="0"
            y={row.y - plot.geo.rowH / 2}
            width={plot.geo.width}
            height={plot.geo.rowH}
          />
          <line class="iqr" x1={row.lo} x2={row.hi} y1={row.y} y2={row.y} />
        {/if}
        {#each row.songs as song (song.id)}
          <circle class="tick" cx={song.x} cy={song.y} r="2.3" />
        {/each}
        <circle class="dot" cx={row.cx} cy={row.y} r={on || hot ? 5.4 : 4.2} />
        <text class="name" x={plot.geo.left - 42} y={row.y + 4} text-anchor="end">
          {corto(row.artist, plot.geo.maxChars)}
        </text>
        <text class="n" x={plot.geo.left - 14} y={row.y + 4} text-anchor="end">{row.n}</text>
        <text class="val" x={plot.geo.left + plot.geo.plotW + 12} y={row.y + 4}>{Math.round(row.center)}</text>
        <rect
          class="hit"
          x="0"
          y={row.y - plot.geo.rowH / 2}
          width={plot.geo.width}
          height={plot.geo.rowH}
          tabindex="0"
          role="button"
          aria-pressed={on}
          aria-label={`${row.artist}, ${row.n} canciones, mediana ${Math.round(row.center)}`}
          onpointerenter={(e) => {
            hover = row.prefix;
            showTip(e, row);
          }}
          onpointermove={(e) => showTip(e, row)}
          onpointerleave={() => {
            if (hover === row.prefix) leave();
          }}
          onclick={() => onact(row.prefix)}
          onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onact(row.prefix);
            }
          }}
        />
      </g>
    {/each}
  </svg>
  {#if tip}
    <div class="tooltip" style:left={`${tip.x}px`} style:top={`${tip.y}px`}>
      <strong>{tip.artist}</strong>
      <span>{tip.meta}</span>
      {#if tip.delta}<span>{tip.delta}</span>{/if}
      {#if tip.thin}<span class="warn">{copy.actsTipThin}</span>{/if}
    </div>
  {/if}
</div>

<p class="legend">
  <span><i class="swatch swatch--tick"></i>{copy.legendActSong}</span>
  <span><i class="swatch swatch--dot"></i>{copy.legendActMedian}</span>
  <span><i class="swatch swatch--iqr"></i>{copy.legendActIqr}</span>
  <span class="method">{copy.actsHint} {centersNote}</span>
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
    display: flex;
    align-items: end;
    gap: 32px;
    margin-bottom: 22px;
  }
  .kicker {
    color: var(--ink-mute);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.23em;
    text-transform: uppercase;
  }
  /* Una sola cifra en el capítulo, así que se lleva el tamaño entero. */
  .cifra strong {
    display: block;
    font-family: Anton, Impact, sans-serif;
    font-size: 52px;
    font-weight: 400;
    letter-spacing: -0.04em;
    line-height: 1;
  }
  .cifra > span {
    display: block;
    margin-top: 6px;
    color: var(--ink-soft);
    font-size: 13px;
    line-height: 1.5;
  }
  .cifra strong span {
    margin-left: 4px;
    color: var(--ink-mute);
    font-family: Inter, system-ui, sans-serif;
    font-size: 13px;
    letter-spacing: 0;
  }
  /*
   * Scrim opaco: la aurora del fondo cambia de luminancia a lo ancho y con un
   * velo al 35% el mismo punto se leía distinto a la izquierda que a la
   * derecha. Aquí el dato manda y el degradado queda fuera del marco.
   */
  .frame {
    position: relative;
    border: 1px solid rgba(255, 246, 239, 0.14);
    background: rgba(9, 2, 18, 0.66);
    backdrop-filter: blur(7px);
    -webkit-backdrop-filter: blur(7px);
  }
  .chart {
    display: block;
    width: 100%;
    height: auto;
  }
  .grid {
    stroke: rgba(255, 246, 239, 0.09);
    stroke-width: 1;
  }
  .grid.is-mid {
    stroke: rgba(255, 246, 239, 0.14);
    stroke-dasharray: 3 7;
  }
  .axis,
  .axis-title {
    fill: rgba(255, 246, 239, 0.42);
    font-family: Inter, system-ui, sans-serif;
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.14em;
  }
  .ref.is-songs {
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .ref.is-acts {
    stroke: #ff8fbd;
    stroke-width: 1.2;
    stroke-dasharray: 3 4;
  }
  .band {
    fill: rgba(255, 143, 189, 0.12);
  }
  .flag {
    fill: var(--ink);
    font-family: Inter, system-ui, sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.16em;
  }
  .flag.is-acts {
    fill: #ff8fbd;
  }
  .hit {
    fill: transparent;
    cursor: pointer;
  }
  .hit:focus-visible {
    outline: 1px solid #ff9466;
    outline-offset: -2px;
  }
  .focus {
    fill: rgba(255, 255, 255, 0.06);
  }
  /* Carril: en filas de mil píxeles el ojo necesita algo que lleve del nombre
     a las marcas. No codifica nada, es textura. */
  .rail {
    stroke: rgba(255, 246, 239, 0.05);
    stroke-width: 1;
  }
  /* La dispersión aparece solo en la fila que se interroga: dibujarla en las
     veinticinco a la vez devuelve la parrilla de rayas que sobraba. */
  .iqr {
    stroke: rgba(255, 148, 102, 0.32);
    stroke-width: 9;
    stroke-linecap: round;
  }
  .tick {
    fill: rgba(255, 190, 158, 0.82);
    pointer-events: none;
  }
  .dot {
    fill: var(--ink);
    pointer-events: none;
  }
  .row.is-on .dot,
  .row.is-hot .dot {
    fill: #ff9466;
  }
  .row.is-dim {
    opacity: 0.28;
  }
  .row.is-on,
  .row.is-hot {
    opacity: 1;
  }
  .name,
  .n,
  .val {
    font-family: Inter, system-ui, sans-serif;
    font-size: 11px;
    pointer-events: none;
  }
  .name {
    fill: var(--ink-soft);
  }
  .n,
  .val {
    fill: rgba(255, 246, 239, 0.42);
    font-variant-numeric: tabular-nums;
  }
  .val {
    fill: var(--ink-mute);
  }
  /* Con menos de tres canciones la mediana es casi el dato crudo. */
  .row.is-thin .name,
  .row.is-thin .n,
  .row.is-thin .val {
    fill: rgba(255, 246, 239, 0.38);
  }
  .row.is-on .name,
  .row.is-hot .name,
  .row.is-on .val,
  .row.is-hot .val {
    fill: var(--ink);
  }
  .tooltip {
    position: absolute;
    z-index: 3;
    transform: translate(-10px, -120%);
    min-width: 150px;
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
  .tooltip .warn {
    margin-top: 4px;
    color: #ff8fbd;
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
  .swatch--iqr {
    width: 16px;
    height: 7px;
    border-radius: 999px;
    background: rgba(255, 148, 102, 0.4);
  }
  .swatch--dot {
    background: #ff9466;
  }
  @media (max-width: 980px) {
    .reading {
      flex-direction: column;
      align-items: start;
      gap: 14px;
    }
    .method {
      width: 100%;
      margin-left: 0;
      text-align: left;
    }
  }
</style>
