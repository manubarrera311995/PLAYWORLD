<script lang="ts">
  import { onDestroy } from "svelte";
  import { ensureGsap } from "../motion/gsap";
  import { reduce } from "../motion/reducedMotion";
  import { mascaraPunteada } from "./punteado";

  type Props = {
    onclick?: (e: MouseEvent) => void;
    href?: string;
    download?: string;
    target?: string;
    rel?: string;
    disabled?: boolean;
    compacto?: boolean;
    children?: import("svelte").Snippet;
  };
  let { onclick, href, download, target, rel, disabled = false, compacto = false, children }: Props = $props();

  const OLA = 38;
  const halo = $derived(compacto ? 11 : 18);

  let raiz = $state<HTMLElement | null>(null);
  let masa = $state<HTMLElement | null>(null);
  let agua = $state<HTMLElement | null>(null);
  let encima = $state(false);
  let foco = $state(false);
  let alto = $state(0);
  let focoPendiente = 0;
  const listos = new WeakSet<HTMLElement>();

  function easeProyecto(p: number): number {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    const x1 = 0.22;
    const y1 = 1;
    const x2 = 0.36;
    const y2 = 1;
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
    const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
    const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
    let t = p;
    for (let i = 0; i < 8; i++) {
      const x = sampleX(t) - p;
      if (Math.abs(x) < 1e-6) return sampleY(t);
      const d = sampleDX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= x / d;
    }
    let lo = 0;
    let hi = 1;
    t = p;
    for (let i = 0; i < 20; i++) {
      const x = sampleX(t);
      if (Math.abs(x - p) < 1e-6) break;
      if (p > x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sampleY(t);
  }

  onDestroy(() => cancelAnimationFrame(focoPendiente));

  $effect(() => {
    const el = raiz;
    if (!el) return;
    const entrar = () => {
      encima = true;
    };
    const salir = () => {
      encima = false;
    };
    const alFoco = () => {
      cancelAnimationFrame(focoPendiente);
      focoPendiente = requestAnimationFrame(() => {
        foco = el.isConnected && el.matches(":focus-visible");
      });
    };
    const alBlur = () => {
      foco = false;
    };
    el.addEventListener("pointerenter", entrar);
    el.addEventListener("pointerleave", salir);
    el.addEventListener("focus", alFoco);
    el.addEventListener("blur", alBlur);
    return () => {
      cancelAnimationFrame(focoPendiente);
      el.removeEventListener("pointerenter", entrar);
      el.removeEventListener("pointerleave", salir);
      el.removeEventListener("focus", alFoco);
      el.removeEventListener("blur", alBlur);
    };
  });

  $effect(() => {
    const capa = masa;
    const margen = halo;
    if (!capa) return;
    let vigente = "";
    let medido = 0;
    let marco = 0;
    const pintar = () => {
      const w = capa.offsetWidth;
      const h = capa.offsetHeight;
      if (w < 2 || h < 2) return;
      if (h !== medido) {
        medido = h;
        alto = h;
      }
      const clave = `${w}x${h}x${margen}`;
      if (clave === vigente) return;
      const url = mascaraPunteada(w, h, margen);
      if (!url) return;
      vigente = clave;
      capa.style.webkitMaskImage = `url("${url}")`;
      capa.style.maskImage = `url("${url}")`;
    };
    pintar();
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(marco);
      marco = requestAnimationFrame(pintar);
    });
    ro.observe(capa);
    let vivo = true;
    void document.fonts?.ready?.then(() => {
      if (!vivo) return;
      vigente = "";
      pintar();
    });
    return () => {
      vivo = false;
      cancelAnimationFrame(marco);
      ro.disconnect();
    };
  });

  $effect(() => {
    const capa = agua;
    if (!capa) return;
    const reducir = $reduce;
    const apagado = disabled;
    const subir = !apagado && (encima || foco);
    const medida = alto;
    if (subir && medida < 2) return;
    const y = subir ? -(medida + OLA) : 0;
    const primera = !listos.has(capa);
    listos.add(capa);
    const gsap = ensureGsap();
    if (primera || reducir || apagado) {
      gsap.killTweensOf(capa);
      gsap.set(capa, { y });
      return;
    }
    gsap.to(capa, {
      y,
      duration: 0.6,
      ease: easeProyecto,
      overwrite: "auto",
    });
  });
</script>

{#snippet cara()}
  <span class="masa" bind:this={masa} aria-hidden="true">
    <span class="agua" bind:this={agua}>
      <svg class="ola" viewBox="0 0 144 36" preserveAspectRatio="none" aria-hidden="true">
        <path fill="#7eb0ff" d="M0 36C32 36 40 7 72 7C104 7 112 36 144 36Z" />
      </svg>
    </span>
  </span>
  <span class="rotulo">{@render children?.()}</span>
{/snippet}

{#if href && !disabled}
  <a
    bind:this={raiz}
    class={["boton", compacto && "compacto"]}
    style:--halo="{halo}px"
    {href}
    {download}
    {target}
    rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
    onclick={(e) => {
      if (onclick) {
        e.preventDefault();
        onclick(e);
      }
    }}
  >
    {@render cara()}
  </a>
{:else}
  <button
    bind:this={raiz}
    class={["boton", compacto && "compacto"]}
    style:--halo="{halo}px"
    type="button"
    {onclick}
    {disabled}
  >
    {@render cara()}
  </button>
{/if}

<style>
  .boton {
    position: relative;
    isolation: isolate;
    overflow: visible;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: max-content;
    max-width: 100%;
    min-width: 0;
    border: 0;
    border-radius: 999px;
    padding: 16px 30px;
    background: transparent;
    color: #1a1038;
    font: 800 22px/1 "DM Sans", system-ui, sans-serif;
    letter-spacing: -0.03em;
    text-align: center;
    text-transform: none;
    text-decoration: none;
    cursor: pointer;
    -webkit-font-smoothing: antialiased;
  }

  .boton:hover,
  .boton:focus-visible {
    color: #1a1038;
  }

  .boton.compacto {
    padding: 9px 16px;
    font-size: 15px;
    letter-spacing: -0.02em;
  }

  .boton:focus-visible {
    outline: 2px solid #fff8f1;
    outline-offset: calc(var(--halo, 18px) + 4px);
  }

  .boton:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .masa {
    position: absolute;
    inset: calc(var(--halo, 18px) * -1);
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    background-color: #fff;
    background-image: none;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
  }

  .agua {
    position: absolute;
    left: -6%;
    width: 112%;
    top: calc(100% + 2px);
    height: calc(100% + 74px);
    display: flex;
    flex-direction: column;
    pointer-events: none;
  }

  .ola {
    display: block;
    width: 100%;
    height: 36px;
    flex: none;
  }

  .agua::after {
    content: "";
    flex: 1 1 auto;
    margin-top: -2px;
    background: #7eb0ff;
  }

  .rotulo {
    position: relative;
    z-index: 1;
    display: block;
    max-width: 100%;
    text-align: center;
  }

  .rotulo :global(svg) {
    display: inline-block;
    height: 18px;
    width: auto;
    margin-left: 12px;
    vertical-align: -0.22em;
  }

  .boton.compacto .rotulo :global(svg) {
    height: 14px;
    margin-left: 8px;
  }
</style>
