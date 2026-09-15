<script lang="ts">
  import { fill, type GeneroMix } from "./ficha";
  import copy from "./edicion.copy.json";

  type Props = { mix: GeneroMix };
  let { mix }: Props = $props();

  const title = $derived(
    mix.kind === "pluralidad"
      ? mix.top
      : mix.kind === "mezcla"
        ? copy.generos.mixed
        : mix.kind === "incompleto"
          ? copy.generos.incomplete
          : copy.generos.empty,
  );
  const note = $derived.by(() => {
    if (mix.kind === "vacio") return copy.generos.noteEmpty;
    if (mix.kind === "incompleto") {
      return fill(copy.generos.noteIncomplete, { labeled: mix.labeledPct });
    }
    if (mix.kind === "mezcla") {
      const parts = mix.bars
        .filter((bar) => !bar.rest)
        .slice(0, 3)
        .map((bar) => `${bar.label} ${bar.pct}%`)
        .join(" · ");
      return fill(copy.generos.noteMixed, { parts });
    }
    if (mix.second) return fill(copy.generos.notePlural, { pct: mix.topPct, second: mix.second });
    return fill(copy.generos.notePluralSolo, { pct: mix.topPct });
  });
  const maxPct = $derived(Math.max(...mix.bars.map((bar) => bar.pct), 1));
</script>

<div class="generos">
  <p class="kicker">{copy.generos.kicker}</p>
  <p class="title">{title}</p>
  {#if mix.bars.length}
    <ul class="bars" aria-label={copy.generos.aria}>
      {#each mix.bars as bar, i (bar.label)}
        {@const width = Math.round((100 * bar.pct) / maxPct)}
        <li class={["row", mix.kind === "pluralidad" && i === 0 && "is-lead"]}>
          <span class="name" title={bar.rest ? copy.generos.resto : bar.label}>
            {bar.rest ? copy.generos.resto : bar.label}
          </span>
          <span class="track">
            <span class="fill" style:width={`${width}%`}></span>
          </span>
          <span class="pct">{bar.pct}%</span>
        </li>
      {/each}
    </ul>
  {/if}
  <p class="note">{note}</p>
</div>

<style>
  .generos {
    margin-top: 22px;
    max-width: 56ch;
    display: grid;
    gap: 8px;
  }
  .kicker {
    color: var(--ink-mute);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.23em;
    text-transform: uppercase;
  }
  .title {
    font-family: Anton, Impact, sans-serif;
    font-size: 28px;
    font-weight: 400;
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .bars {
    list-style: none;
    margin: 4px 0 0;
    padding: 0;
    display: grid;
    gap: 7px;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(7.5ch, 11ch) minmax(0, 1fr) 3.4ch;
    gap: 10px;
    align-items: center;
  }
  .name {
    color: var(--ink-soft);
    font-size: 11px;
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .track {
    height: 6px;
    background: rgba(255, 246, 239, 0.08);
  }
  .fill {
    display: block;
    height: 100%;
    background: var(--ink-mute);
  }
  .row.is-lead .name {
    color: var(--ink);
  }
  .row.is-lead .fill {
    background: var(--ink);
  }
  .pct {
    color: var(--ink-mute);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .note {
    margin-top: 2px;
    color: var(--ink-mute);
    font-size: 11px;
    line-height: 1.45;
  }
</style>
