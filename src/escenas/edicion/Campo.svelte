<script lang="ts">
  import type { Track } from "../../datos/tipos";
  import { MAP, actPrefix, clusterOf, fill, groupActs, placeSong } from "./ficha";
  import copy from "./edicion.copy.json";

  type Tip = { x: number; y: number; track: string; artist: string };

  type Props = {
    tracks: Track[];
    selected: Track | null;
    selectedAct: string | null;
    onselect: (track: Track) => void;
  };
  let { tracks, selected, selectedAct, onselect }: Props = $props();

  let tip = $state<Tip | null>(null);
  const plotW = MAP.width - MAP.pad.left - MAP.pad.right;
  const plotH = MAP.height - MAP.pad.top - MAP.pad.bottom;
  const midX = MAP.pad.left + plotW / 2;
  const midY = MAP.pad.top + plotH / 2;

  const dots = $derived(
    tracks
      .map((song, index) => {
        const pos = placeSong(song, index);
        if (!pos) return null;
        return { song, ...pos };
      })
      .filter((d) => d != null),
  );

  const note = $derived.by(() => {
    if (selectedAct) {
      const act = groupActs(tracks).find((item) => item.prefix === selectedAct);
      if (act) {
        return fill(copy.mapNoteAct, { artist: act.artist, n: act.songs.length });
      }
    }
    const hot = dots.filter((d) => clusterOf(d.song) === "intenso").length;
    return fill(copy.mapNote, { n: dots.length, hot });
  });

  function showTip(e: PointerEvent, song: Track): void {
    const shell = (e.currentTarget as SVGElement).closest("[data-shell]");
    if (!shell) return;
    const box = shell.getBoundingClientRect();
    tip = {
      x: e.clientX - box.left,
      y: e.clientY - box.top,
      track: song.track || song.id,
      artist: song.artist || "Artista",
    };
  }
</script>

<div class="shell" data-shell>
  <svg
    class="map"
    viewBox={`0 0 ${MAP.width} ${MAP.height}`}
    role="group"
    aria-label={copy.mapAria}
  >
    <line class="axis" x1={MAP.pad.left} y1={MAP.height - MAP.pad.bottom} x2={MAP.width - MAP.pad.right} y2={MAP.height - MAP.pad.bottom} />
    <line class="axis" x1={MAP.pad.left} y1={MAP.pad.top} x2={MAP.pad.left} y2={MAP.height - MAP.pad.bottom} />
    <line class="mid" x1={midX} y1={MAP.pad.top} x2={midX} y2={MAP.height - MAP.pad.bottom} />
    <line class="mid" x1={MAP.pad.left} y1={midY} x2={MAP.width - MAP.pad.right} y2={midY} />
    <text class="territory" x={MAP.pad.left + plotW * 0.22} y={MAP.pad.top + 22} text-anchor="middle">{copy.mapIntense}</text>
    <text class="territory" x={MAP.pad.left + plotW * 0.78} y={MAP.height - MAP.pad.bottom - 16} text-anchor="middle">{copy.mapSoft}</text>
    <text class="label" x={midX} y={MAP.height - 16} text-anchor="middle">{copy.mapX}</text>
    <text
      class="label"
      x="18"
      y={MAP.pad.top + plotH / 2}
      text-anchor="middle"
      transform={`rotate(-90 18 ${MAP.pad.top + plotH / 2})`}
    >{copy.mapY}</text>
    {#each dots as dot (dot.song.id)}
      {@const on = selected?.id === dot.song.id}
      {@const inAct = Boolean(selectedAct && actPrefix(dot.song.id) === selectedAct)}
      {@const dim = Boolean(selectedAct) && !inAct && !on}
      {@const mayor = dot.song.dna.scale === "Mayor"}
      <circle
        class={["dot", on && "is-selected", inAct && "is-act", dim && "is-dim"]}
        cx={dot.x}
        cy={dot.y}
        r={on ? 7.4 : inAct ? 6.2 : 5}
        fill={mayor ? "transparent" : inAct || on ? "#ff9466" : "#fff6ef"}
        stroke={mayor ? "#ff8fbd" : "rgba(16, 6, 22, .55)"}
        stroke-width={mayor ? 1.7 : 0.8}
        tabindex="0"
        role="button"
        aria-label={`${dot.song.track}, ${dot.song.artist}`}
        onpointerenter={(e) => showTip(e, dot.song)}
        onpointermove={(e) => showTip(e, dot.song)}
        onpointerleave={() => (tip = null)}
        onclick={() => onselect(dot.song)}
        onkeydown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onselect(dot.song);
          }
        }}
      />
    {/each}
  </svg>
  {#if tip}
    <div class="tooltip" style:left={`${tip.x}px`} style:top={`${tip.y}px`}>
      <strong>{tip.track}</strong>
      <span>{tip.artist}</span>
    </div>
  {/if}
</div>

<footer class="legend">
  <span><i class="swatch swatch--minor"></i>{copy.legendMinor}</span>
  <span><i class="swatch swatch--major"></i>{copy.legendMajor}</span>
  <span><i class="swatch swatch--hot"></i>{copy.legendHot}</span>
  <span>{note}</span>
</footer>

<style>
  .shell {
    position: relative;
  }
  .map {
    display: block;
    width: 100%;
    height: auto;
    border: 1px solid rgba(255, 246, 239, 0.14);
    background: rgba(9, 2, 18, 0.35);
  }
  .axis {
    stroke: rgba(255, 246, 239, 0.28);
    stroke-width: 1;
  }
  .mid {
    stroke: rgba(255, 246, 239, 0.1);
    stroke-width: 1;
    stroke-dasharray: 4 6;
  }
  .label,
  .territory {
    fill: rgba(255, 246, 239, 0.42);
    font-family: Inter, system-ui, sans-serif;
    font-size: 11px;
    letter-spacing: 0.16em;
  }
  .territory {
    font-size: 12px;
    letter-spacing: 0.22em;
  }
  .dot {
    cursor: pointer;
  }
  .dot.is-dim {
    opacity: 0.16;
  }
  .dot.is-act,
  .dot.is-selected {
    opacity: 1;
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
    margin-top: 16px;
    color: var(--ink-mute);
    font-size: 11px;
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
  .swatch--major {
    background: transparent;
    border: 1.5px solid #ff8fbd;
  }
  .swatch--hot {
    background: #ff9466;
  }
</style>
