<script lang="ts">
  import copy from "./edicion.copy.json";
  import type { RasgoKey } from "./lectura";

  type Card = { key: RasgoKey; median: number; bins: number[] };

  type Props = {
    cards: readonly Card[];
    tempo: { median: number; bins: number[] } | null;
    yKey: RasgoKey;
    ontrait: (key: RasgoKey) => void;
  };
  let { cards, tempo, yKey, ontrait }: Props = $props();

  const labels = copy.moods as Record<string, string>;

  function alturas(bins: readonly number[]): number[] {
    const max = Math.max(...bins, 1);
    return bins.map((n) => Math.max(4, Math.round((n / max) * 100)));
  }
</script>

<div class="vista">
  {#if !cards.length}
    <p class="vacio">{copy.tablero.empty}</p>
  {:else}
    <p class="intro">{copy.tablero.rasgosHint}</p>
    <div class="rejilla">
      {#each cards as card (card.key)}
        <button
          type="button"
          class={["rasgo", card.key === yKey && "is-on"]}
          aria-pressed={card.key === yKey}
          onclick={() => ontrait(card.key)}
        >
          <span class="rn">{labels[card.key] ?? card.key}</span>
          <span class="rm">{card.median}</span>
          <span class="spark">
            {#each alturas(card.bins) as alto, i (i)}
              <i style:height="{alto}%"></i>
            {/each}
          </span>
        </button>
      {/each}
      {#if tempo}
        <div class="rasgo">
          <span class="rn">{copy.tablero.tempo}</span>
          <span class="rm">{tempo.median}</span>
          <span class="spark">
            {#each alturas(tempo.bins) as alto, i (i)}
              <i style:height="{alto}%"></i>
            {/each}
          </span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .vista { height: 100%; min-height: 0; display: flex; flex-direction: column; gap: 8px; }
  .intro { margin: 0; color: var(--ink-mute); font-size: 12px; }
  .vacio { margin: auto; color: var(--ink-mute); font-size: 14px; }
  .rejilla {
    min-height: 0;
    overflow: auto;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    align-content: start;
  }
  .rasgo {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto 46px;
    gap: 4px 10px;
    padding: 12px;
    border-radius: 16px;
    border: 1px solid rgba(255, 246, 239, 0.16);
    background: rgba(20, 8, 16, 0.35);
    color: inherit;
    font: inherit;
    text-align: left;
  }
  button.rasgo { cursor: pointer; }
  .rasgo.is-on { border-color: rgba(255, 246, 239, 0.55); }
  .rn { font-size: 12px; color: var(--ink-soft); }
  .rm {
    font-family: Anton, Impact, sans-serif;
    font-size: 28px;
    font-weight: 400;
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .spark { grid-column: 1 / -1; display: flex; align-items: end; gap: 3px; height: 46px; }
  .spark i {
    flex: 1;
    display: block;
    border-radius: 2px 2px 0 0;
    background: rgba(255, 246, 239, 0.78);
    min-height: 2px;
  }
  .rasgo.is-on .spark i { background: #e85a86; }
</style>
