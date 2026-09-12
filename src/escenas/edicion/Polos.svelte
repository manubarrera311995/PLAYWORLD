<script lang="ts">
  import type { Track } from "../../datos/tipos";
  import { clusterOf, fill, groupActs, median, round, values } from "./ficha";
  import copy from "./edicion.copy.json";

  type Props = { tracks: Track[] };
  let { tracks }: Props = $props();

  const contained = $derived(tracks.filter((s) => clusterOf(s) === "suave"));
  const intense = $derived(tracks.filter((s) => clusterOf(s) === "intenso"));
  const pull = $derived.by(() => {
    const acts = groupActs(tracks)
      .map((act) => ({ ...act, energy: median(values(act.songs, "energy")) }))
      .filter((act) => act.energy != null)
      .sort((a, b) => (b.energy ?? 0) - (a.energy ?? 0));
    return fill(copy.polePull, {
      low: acts[acts.length - 1]?.artist ?? "—",
      high: acts[0]?.artist ?? "—",
    });
  });

  function read(arr: Track[], key: "energy" | "relaxed" | "nostalgia" | "aggressive" | "oscuridad"): string {
    return String(round(median(values(arr, key))));
  }
</script>

<aside class="poles">
  <h3>{copy.polesTitle}</h3>
  <p>{copy.polesIntro}</p>
  <div class="pair">
    <div class="pole">
      <strong>{contained.length}</strong>
      <span>{copy.poleSoft}</span>
      <dl>
        <div><dt>Energy</dt><dd>{read(contained, "energy")}</dd></div>
        <div><dt>Relaxed</dt><dd>{read(contained, "relaxed")}</dd></div>
        <div><dt>Nostalgia</dt><dd>{read(contained, "nostalgia")}</dd></div>
      </dl>
    </div>
    <div class="pole">
      <strong>{intense.length}</strong>
      <span>{copy.poleHot}</span>
      <dl>
        <div><dt>Energy</dt><dd>{read(intense, "energy")}</dd></div>
        <div><dt>Aggressive</dt><dd>{read(intense, "aggressive")}</dd></div>
        <div><dt>Oscuridad</dt><dd>{read(intense, "oscuridad")}</dd></div>
      </dl>
    </div>
  </div>
  <p>{pull}</p>
</aside>

<style>
  .poles {
    display: grid;
    gap: 16px;
    padding: 22px;
    border: 1px solid rgba(255, 246, 239, 0.14);
    background: rgba(9, 2, 18, 0.28);
  }
  h3 {
    font-family: Anton, Impact, sans-serif;
    font-size: 28px;
    font-weight: 400;
    letter-spacing: -0.03em;
  }
  p {
    color: var(--ink-soft);
    font-size: 13px;
    line-height: 1.5;
  }
  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .pole {
    padding-top: 10px;
    border-top: 1px solid rgba(255, 246, 239, 0.14);
  }
  .pole strong {
    display: block;
    font-size: 22px;
    letter-spacing: -0.03em;
  }
  .pole span {
    color: var(--ink-mute);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  dl {
    display: grid;
    gap: 4px;
    margin-top: 10px;
    color: var(--ink-soft);
    font-size: 11px;
  }
  dl > div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  dt {
    color: var(--ink-mute);
  }
</style>
