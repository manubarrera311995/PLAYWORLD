<script lang="ts">
  import { etiquetaCanciones } from "./curva";

  type Props = {
    years: number[];
    actual: number;
    dnaYears: number[];
    conteos?: Record<number, number>;
    modo: "compacto" | "medio" | "cine";
    foco?: number | null;
    onchange: (y: number) => void;
  };

  let {
    years,
    actual,
    dnaYears,
    conteos = {},
    modo,
    foco = null,
    onchange,
  }: Props = $props();

  const dna = $derived(new Set(dnaYears));
  const compacto = $derived(modo === "compacto");

  function tecla(e: KeyboardEvent): void {
    const i = years.indexOf(actual);
    let next: number | undefined;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = years[i + 1];
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = years[i - 1];
    else if (e.key === "Home") next = years[0];
    else if (e.key === "End") next = years[years.length - 1];
    if (next == null) return;
    e.preventDefault();
    onchange(next);
  }

  function anioEnPunto(rail: HTMLElement, clientX: number, clientY: number): number | null {
    const ticks = [...rail.querySelectorAll<HTMLElement>("[data-year]")];
    if (!ticks.length) return null;
    let mejor = ticks[0];
    let dist = Infinity;
    for (const tick of ticks) {
      const r = tick.getBoundingClientRect();
      const d = compacto
        ? Math.abs(clientX - (r.left + r.width / 2))
        : Math.abs(clientY - (r.top + r.height / 2));
      if (d < dist) {
        dist = d;
        mejor = tick;
      }
    }
    const y = Number(mejor.dataset.year);
    return Number.isFinite(y) ? y : null;
  }

  function montarRail(root: HTMLElement) {
    const pista = root.querySelector<HTMLElement>("[data-rail]");
    if (!pista) return;
    let pid = -1;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pid = e.pointerId;
      pista.setPointerCapture(e.pointerId);
      const y = anioEnPunto(pista, e.clientX, e.clientY);
      if (y != null && y !== actual) onchange(y);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pid || !pista.hasPointerCapture(e.pointerId)) return;
      const y = anioEnPunto(pista, e.clientX, e.clientY);
      if (y != null && y !== actual) onchange(y);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      pid = -1;
    };

    pista.addEventListener("pointerdown", onDown);
    pista.addEventListener("pointermove", onMove);
    pista.addEventListener("pointerup", onUp);
    pista.addEventListener("pointercancel", onUp);

    return () => {
      pista.removeEventListener("pointerdown", onDown);
      pista.removeEventListener("pointermove", onMove);
      pista.removeEventListener("pointerup", onUp);
      pista.removeEventListener("pointercancel", onUp);
    };
  }
</script>

<div
  class={["radio", compacto && "radio--cinta"]}
  role="listbox"
  aria-label="Línea de tiempo de años"
  aria-activedescendant="sinton-anio-{actual}"
  tabindex="0"
  onkeydown={tecla}
  {@attach montarRail}
>
  <div class="radio__rail" data-rail>
    <div class="radio__line" aria-hidden="true"></div>
    <div class="radio__ticks">
      {#each years as y (y)}
        {@const nLabel = etiquetaCanciones(conteos[y] ?? 0)}
        <button
          id="sinton-anio-{y}"
          class={[
            "radio__tick",
            y === actual && "is-on",
            y === foco && "is-foco",
            dna.has(y) ? "has-dna" : "is-ghost",
          ]}
          type="button"
          role="option"
          data-year={y}
          aria-selected={y === actual}
          aria-label={nLabel ? `Sintonizar ${y}, ${nLabel}` : `Sintonizar ${y}`}
          tabindex="-1"
          onclick={() => onchange(y)}
        >
          <span class="radio__year">{y}</span>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .radio {
    --radio-w: 72px;
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 8;
    width: var(--radio-w);
    display: grid;
    padding: clamp(72px, 12vh, 96px) 0 clamp(72px, 11vh, 88px);
    outline: none;
    pointer-events: none;
  }

  .radio:focus-visible {
    outline: 2px solid rgba(255, 248, 242, 0.45);
    outline-offset: -4px;
  }

  .radio--cinta {
    position: relative;
    left: auto;
    top: auto;
    bottom: auto;
    width: 100%;
    height: 64px;
    padding: 0 8px 8px;
    pointer-events: auto;
  }

  .radio__rail {
    position: relative;
    margin: 0 auto;
    width: 100%;
    max-width: 56px;
    pointer-events: auto;
    touch-action: none;
    cursor: ns-resize;
  }

  .radio--cinta .radio__rail {
    max-width: none;
    height: 100%;
    cursor: ew-resize;
  }

  .radio__line {
    position: absolute;
    left: 10px;
    top: 6px;
    bottom: 6px;
    width: 1px;
    background: linear-gradient(
      to bottom,
      transparent,
      rgba(255, 246, 239, 0.28) 8%,
      rgba(255, 246, 239, 0.28) 92%,
      transparent
    );
    pointer-events: none;
  }

  .radio--cinta .radio__line {
    left: 8px;
    right: 8px;
    top: 18px;
    bottom: auto;
    width: auto;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      rgba(255, 246, 239, 0.28) 8%,
      rgba(255, 246, 239, 0.28) 92%,
      transparent
    );
  }

  .radio__ticks {
    position: relative;
    z-index: 3;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: stretch;
  }

  .radio--cinta .radio__ticks {
    flex-direction: row;
  }

  .radio__tick {
    position: relative;
    appearance: none;
    border: 0;
    background: transparent;
    color: rgba(255, 246, 239, 0.34);
    cursor: pointer;
    min-height: 16px;
    flex: 1 1 0;
    padding: 0 0 0 18px;
    width: 100%;
    text-align: left;
  }

  .radio--cinta .radio__tick {
    min-height: 0;
    min-width: 12px;
    height: 100%;
    padding: 22px 0 0;
    text-align: center;
  }

  .radio__tick::before {
    content: "";
    position: absolute;
    left: 10px;
    top: 50%;
    width: 5px;
    height: 5px;
    margin: -2.5px 0 0 -2.5px;
    border-radius: 50%;
    background: rgba(255, 246, 239, 0.28);
    transition:
      width 200ms var(--ease-soft),
      height 200ms var(--ease-soft),
      margin 200ms var(--ease-soft),
      background 200ms var(--ease-soft),
      box-shadow 200ms var(--ease-soft);
  }

  .radio--cinta .radio__tick::before {
    left: 50%;
    top: 18px;
    margin: -2.5px 0 0 -2.5px;
  }

  .radio__year {
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
    opacity: 1;
    white-space: nowrap;
    transition:
      color 200ms var(--ease-soft),
      font-size 200ms var(--ease-soft),
      font-weight 200ms var(--ease-soft);
    pointer-events: none;
  }

  .radio--cinta .radio__year {
    font-size: 9px;
  }

  .radio__tick.is-ghost {
    color: rgba(255, 246, 239, 0.22);
  }

  .radio__tick.is-on {
    color: var(--ink-title);
  }

  .radio__tick.is-on .radio__year {
    font-size: 13px;
    font-weight: 600;
  }

  .radio--cinta .radio__tick.is-on .radio__year {
    font-size: 11px;
  }

  .radio__tick.is-on::before {
    width: 7px;
    height: 7px;
    margin: -3.5px 0 0 -3.5px;
    background: #fff6ef;
    box-shadow:
      0 0 10px rgba(255, 246, 239, 0.85),
      0 0 18px rgba(255, 176, 138, 0.45);
  }

  .radio__tick.is-foco:not(.is-on) {
    color: rgba(255, 142, 184, 0.7);
  }

  .radio__tick:hover .radio__year,
  .radio__tick:focus-visible .radio__year {
    color: #fff;
  }

  .radio__tick:focus-visible {
    outline: 1px solid rgba(255, 248, 242, 0.5);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .radio__tick::before,
    .radio__year {
      transition: none;
    }
  }
</style>
