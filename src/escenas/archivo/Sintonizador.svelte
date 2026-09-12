<script lang="ts">
  type Props = {
    years: number[];
    actual: number;
    dnaYears: number[];
    modo: "compacto" | "medio" | "cine";
    onchange: (y: number) => void;
  };
  let { years, actual, dnaYears, modo, onchange }: Props = $props();
  const dna = $derived(new Set(dnaYears));
</script>

<div class={["dial", modo === "compacto" ? "dial--cinta" : "dial--vertical"]} role="listbox" aria-label="Años">
  {#each years as y (y)}
    <button
      class={["tick", y === actual && "is-on", dna.has(y) ? "has-dna" : "ghost"]}
      type="button"
      onclick={() => onchange(y)}
    >
      {y}
    </button>
  {/each}
</div>

<style>
  .dial--cinta {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 8px 0 12px;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x;
    overscroll-behavior-x: contain;
  }
  .dial--vertical {
    position: absolute;
    left: 0;
    top: 20%;
    bottom: 18%;
    z-index: 8;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
    padding: 0 8px;
    width: 72px;
    pointer-events: auto;
    overscroll-behavior: contain;
  }
  .tick {
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--ink-mute);
    font-size: 12px;
    letter-spacing: 0.08em;
    cursor: pointer;
    padding: 6px 8px;
    white-space: nowrap;
  }
  .has-dna { color: var(--ink); opacity: 1; }
  .ghost { opacity: 0.35; }
  .is-on {
    color: var(--ink-title);
    font-family: Anton, Impact, sans-serif;
    font-size: 18px;
  }
</style>
