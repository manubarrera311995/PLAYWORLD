<script lang="ts">
  import { ensureGsap } from "../../motion/gsap";
  import { reduce as reduceMotion } from "../../motion/reducedMotion";

  type Props = {
    years: number[];
    actual: number;
    dnaYears: number[];
    modo: "compacto" | "medio" | "cine";
    foco?: number | null;
    banda?: string;
    pie?: string;
    onchange: (y: number) => void;
  };

  let { years, actual, dnaYears, modo, foco = null, banda = "Archivo", pie = "sintoniza", onchange }: Props =
    $props();

  const dna = $derived(new Set(dnaYears));
  const compacto = $derived(modo === "compacto");
  const reduce = $derived($reduceMotion);

  const MAYORES = new Set([2011, 2013, 2016, 2018, 2020, 2022, 2026]);

  function esMayor(y: number): boolean {
    return MAYORES.has(y) || dna.has(y) || y === foco || y === years[0] || y === years[years.length - 1];
  }

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

  function montarAguja(root: HTMLElement) {
    const gsap = ensureGsap();
    const ctx = gsap.context(() => undefined, root);
    const needleEl = root.querySelector<HTMLElement>("[data-needle]");
    const railEl = root.querySelector<HTMLElement>("[data-rail]");
    if (!needleEl || !railEl) return () => ctx.revert();
    const aguja = needleEl;
    const pista = railEl;

    let listo = false;
    let pid = -1;

    function medir(): number {
      const tick = pista.querySelector<HTMLElement>(`[data-year="${actual}"]`);
      if (!tick) return 0;
      const rr = pista.getBoundingClientRect();
      const tr = tick.getBoundingClientRect();
      if (compacto) {
        return tr.left + tr.width / 2 - rr.left - aguja.offsetWidth / 2;
      }
      return tr.top + tr.height / 2 - rr.top - aguja.offsetHeight / 2;
    }

    function aplicar(animar: boolean): void {
      const pos = medir();
      const vars = compacto ? { x: pos, y: 0, autoAlpha: 1 } : { y: pos, x: 0, autoAlpha: 1 };
      if (!animar || reduce || !listo) {
        gsap.set(aguja, { ...vars, force3D: true });
        listo = true;
        return;
      }
      gsap.to(aguja, {
        ...vars,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
        force3D: true,
      });
    }

    $effect(() => {
      actual;
      compacto;
      years;
      reduce;
      aplicar(true);
    });

    const ro = new ResizeObserver(() => aplicar(false));
    ro.observe(pista);

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
      ro.disconnect();
      pista.removeEventListener("pointerdown", onDown);
      pista.removeEventListener("pointermove", onMove);
      pista.removeEventListener("pointerup", onUp);
      pista.removeEventListener("pointercancel", onUp);
      gsap.killTweensOf(aguja);
      gsap.set(aguja, { clearProps: "transform,opacity,visibility" });
      ctx.revert();
    };
  }
</script>

<div
  class={["radio", compacto && "radio--cinta"]}
  role="listbox"
  aria-label="Sintonizador de años"
  aria-activedescendant="sinton-anio-{actual}"
  tabindex="0"
  onkeydown={tecla}
  {@attach montarAguja}
>
  {#if !compacto}
    <div class="radio__head">
      <span class="radio__band">{banda}</span>
      <span class="radio__freq">{actual}</span>
    </div>
  {/if}

  <div class="radio__rail" data-rail>
    <div class="radio__line" aria-hidden="true"></div>
    <div class="radio__needle" data-needle aria-hidden="true"></div>
    <div class="radio__ticks">
      {#each years as y (y)}
        <button
          id="sinton-anio-{y}"
          class={[
            "radio__tick",
            y === actual && "is-on",
            y === foco && "is-foco",
            esMayor(y) && "is-mayor",
            dna.has(y) ? "has-dna" : "is-ghost",
          ]}
          type="button"
          role="option"
          data-year={y}
          aria-selected={y === actual}
          aria-label="Sintonizar {y}"
          tabindex="-1"
          onclick={() => onchange(y)}
        >
          <span>{y}</span>
        </button>
      {/each}
    </div>
  </div>

  {#if !compacto}
    <p class="radio__caption">{pie}</p>
  {/if}
</div>

<style>
  .radio {
    --radio-w: clamp(72px, 9vw, 96px);
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 8;
    width: var(--radio-w);
    display: grid;
    grid-template-rows: auto 1fr auto;
    padding: clamp(18px, 3vh, 28px) 0;
    background: linear-gradient(
      90deg,
      rgba(6, 8, 22, 0.55) 0%,
      rgba(6, 8, 22, 0.2) 70%,
      transparent 100%
    );
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
    height: 72px;
    grid-template-rows: 1fr;
    padding: 0;
    background: linear-gradient(
      0deg,
      rgba(6, 8, 22, 0.55) 0%,
      rgba(6, 8, 22, 0.12) 70%,
      transparent 100%
    );
    pointer-events: auto;
  }

  .radio__head {
    display: grid;
    justify-items: center;
    gap: 4px;
    padding: 0 8px 12px;
    pointer-events: none;
  }

  .radio__band {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.28em;
    text-indent: 0.28em;
    text-transform: uppercase;
    color: rgba(255, 246, 239, 0.45);
  }

  .radio__freq {
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(18px, 2.2vw, 24px);
    letter-spacing: 0.02em;
    color: var(--ink-title);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .radio__rail {
    position: relative;
    margin: 8px auto;
    width: 100%;
    max-width: 56px;
    pointer-events: auto;
    touch-action: none;
    cursor: ns-resize;
  }

  .radio--cinta .radio__rail {
    margin: 0;
    max-width: none;
    width: 100%;
    height: 100%;
    cursor: ew-resize;
  }

  .radio__line {
    position: absolute;
    left: 50%;
    top: 4px;
    bottom: 4px;
    width: 1px;
    margin-left: -0.5px;
    background: linear-gradient(
      to bottom,
      transparent,
      rgba(255, 255, 255, 0.35) 8%,
      rgba(255, 255, 255, 0.35) 92%,
      transparent
    );
    pointer-events: none;
  }

  .radio--cinta .radio__line {
    left: 8px;
    right: 8px;
    top: 50%;
    bottom: auto;
    width: auto;
    height: 1px;
    margin-left: 0;
    margin-top: -0.5px;
    background: linear-gradient(
      to right,
      transparent,
      rgba(255, 255, 255, 0.35) 8%,
      rgba(255, 255, 255, 0.35) 92%,
      transparent
    );
  }

  .radio__ticks {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: stretch;
    padding: 2px 0;
  }

  .radio--cinta .radio__ticks {
    flex-direction: row;
    padding: 0 8px;
  }

  .radio__tick {
    position: relative;
    appearance: none;
    border: 0;
    background: transparent;
    color: rgba(255, 246, 239, 0.45);
    cursor: pointer;
    min-height: 16px;
    flex: 1 1 0;
    padding: 0;
    width: 100%;
  }

  .radio--cinta .radio__tick {
    min-height: 0;
    min-width: 12px;
    height: 100%;
  }

  .radio__tick::before {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: 9px;
    height: 1px;
    margin: -0.5px 0 0 -4.5px;
    background: rgba(255, 255, 255, 0.32);
    transition:
      width 200ms var(--ease-soft),
      height 200ms var(--ease-soft),
      background 200ms var(--ease-soft),
      transform 200ms var(--ease-soft);
  }

  .radio--cinta .radio__tick::before {
    width: 1px;
    height: 9px;
    margin: -4.5px 0 0 -0.5px;
  }

  .radio__tick span {
    position: absolute;
    left: calc(50% + 12px);
    top: 50%;
    transform: translateY(-50%);
    font-size: 9px;
    letter-spacing: 0.02em;
    font-variant-numeric: tabular-nums;
    opacity: 0;
    white-space: nowrap;
    transition:
      opacity 200ms var(--ease-soft),
      color 200ms var(--ease-soft);
    pointer-events: none;
  }

  .radio--cinta .radio__tick span {
    left: 50%;
    top: auto;
    bottom: 6px;
    transform: translate(-50%, 0);
    font-size: 8px;
  }

  .radio--cinta .radio__tick.is-mayor:not(.is-on) span {
    opacity: 0;
  }

  .radio__tick.is-mayor span,
  .radio__tick.is-on span,
  .radio__tick.is-foco span,
  .radio__tick:hover span,
  .radio__tick:focus-visible span {
    opacity: 0.9;
  }

  .radio__tick.is-mayor::before {
    width: 14px;
    margin-left: -7px;
    background: rgba(255, 255, 255, 0.55);
  }

  .radio--cinta .radio__tick.is-mayor::before {
    width: 1px;
    height: 14px;
    margin: -7px 0 0 -0.5px;
  }

  .radio__tick:hover::before,
  .radio__tick:focus-visible::before {
    width: 16px;
    margin-left: -8px;
    background: rgba(255, 255, 255, 0.85);
  }

  .radio--cinta .radio__tick:hover::before,
  .radio--cinta .radio__tick:focus-visible::before {
    width: 1px;
    height: 16px;
    margin: -8px 0 0 -0.5px;
  }

  .radio__tick:hover span,
  .radio__tick:focus-visible span {
    opacity: 1;
    color: #fff;
  }

  .radio__tick.has-dna {
    color: var(--ink);
  }

  .radio__tick.is-ghost::before {
    opacity: 0.55;
  }

  .radio__tick.is-on::before {
    width: 18px;
    margin-left: -9px;
    background: #fff;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
  }

  .radio--cinta .radio__tick.is-on::before {
    width: 1px;
    height: 18px;
    margin: -9px 0 0 -0.5px;
  }

  .radio__tick.is-on span {
    opacity: 1;
    color: #fff;
    font-weight: 600;
  }

  .radio__tick.is-foco span {
    color: #ff8eb8;
  }

  .radio__tick.is-foco.is-on span {
    color: #ffb0cc;
  }

  .radio__needle {
    position: absolute;
    left: 50%;
    top: 0;
    z-index: 2;
    width: 28px;
    height: 2px;
    margin-left: -14px;
    background: #fff;
    border-radius: 2px;
    box-shadow:
      0 0 0 3px rgba(255, 142, 184, 0.25),
      0 0 16px rgba(255, 255, 255, 0.45);
    pointer-events: none;
    will-change: transform;
    opacity: 0;
  }

  .radio__needle::before {
    content: "";
    position: absolute;
    left: -3px;
    top: 50%;
    width: 6px;
    height: 6px;
    margin-top: -3px;
    border-radius: 50%;
    background: #ff8eb8;
    box-shadow: 0 0 10px rgba(255, 142, 184, 0.7);
  }

  .radio--cinta .radio__needle {
    left: 0;
    top: 50%;
    width: 2px;
    height: 28px;
    margin-left: 0;
    margin-top: -14px;
  }

  .radio--cinta .radio__needle::before {
    left: 50%;
    top: -3px;
    margin-top: 0;
    margin-left: -3px;
  }

  .radio__caption {
    text-align: center;
    font-size: 9px;
    letter-spacing: 0.24em;
    text-indent: 0.24em;
    text-transform: uppercase;
    color: rgba(255, 246, 239, 0.35);
    padding-top: 10px;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .radio__tick::before,
    .radio__tick span {
      transition: none;
    }
  }
</style>
