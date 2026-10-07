<script lang="ts">
  import { ensureGsap } from "../../motion/gsap";
  import { reduce as reduceMotion } from "../../motion/reducedMotion";
  import { focoDe, origenRespiro, panDe, velosDeOnda, type VeloOnda } from "./onda";

  type Props = { year: number; years?: number[] };
  let { year, years = [] }: Props = $props();

  const reduce = $derived($reduceMotion);
  const fid = $props.id();
  const velos = velosDeOnda();
  const origen = origenRespiro();

  function montar(root: HTMLElement) {
    const gsap = ensureGsap();
    const capa = root.querySelector<HTMLElement>("[data-onda]");
    const breathEl = root.querySelector<HTMLElement>("[data-breath]");
    const ecoEl = root.querySelector<HTMLElement>("[data-eco]");

    $effect(() => {
      if (!capa) return;
      const x = panDe(focoDe(year, years));
      const tween = reduce
        ? gsap.set(capa, { x })
        : gsap.to(capa, {
            x,
            duration: 0.95,
            ease: "sine.inOut",
            overwrite: "auto",
          });
      return () => {
        tween.kill();
      };
    });

    $effect(() => {
      if (reduce || !breathEl || !ecoEl) return;
      const breath = gsap.to(breathEl, {
        scaleY: 1.04,
        y: 6,
        transformOrigin: `${origen.x}px ${origen.y}px`,
        duration: 9,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      const eco = gsap.to(ecoEl, {
        y: -8,
        duration: 11,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      return () => {
        breath.kill();
        eco.kill();
      };
    });

    return () => {
      if (capa) gsap.killTweensOf(capa);
      if (breathEl) gsap.killTweensOf(breathEl);
      if (ecoEl) gsap.killTweensOf(ecoEl);
    };
  }
</script>

{#snippet velo(capa: VeloOnda, nombre: string)}
  <svg
    class="ink"
    viewBox="{capa.minX} {capa.minY} {capa.w} {capa.h}"
    preserveAspectRatio="none"
    style:left="{capa.minX}px"
    style:top="{capa.minY}px"
    style:width="{capa.w}px"
    style:height="{capa.h}px"
    style:opacity={capa.opacidad}
    style:filter="blur({capa.sigma}px)"
  >
    <defs>
      <linearGradient id="{fid}-{nombre}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff6ef" stop-opacity="0" />
        <stop offset="0.1" stop-color="#fff6ef" stop-opacity="0" />
        <stop offset="0.22" stop-color="#fff6ef" stop-opacity="0.28" />
        <stop offset="0.36" stop-color="#fffef8" stop-opacity="0.95" />
        <stop offset="0.5" stop-color="#fffef8" stop-opacity="1" />
        <stop offset="0.64" stop-color="#ffd4c8" stop-opacity="0.9" />
        <stop offset="0.78" stop-color="#ffd4c8" stop-opacity="0.28" />
        <stop offset="0.9" stop-color="#ffb0cc" stop-opacity="0" />
        <stop offset="1" stop-color="#ffb0cc" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path
      d={capa.d}
      fill="none"
      stroke="url(#{fid}-{nombre})"
      stroke-width={capa.stroke}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
{/snippet}

<div class="onda" aria-hidden="true" {@attach montar}>
  <!--
    1 unidad del viewBox = 1 px. El blur es el mismo kernel de antes
    (stdDeviation 8 y 4.5) y queda quieto. El encaje al hueco y el
    movimiento van en los padres, así el desenfoque no se recalcula.
  -->
  <div class="onda__fit">
    <div class="onda__pan" data-onda>
      <div class="onda__eco" data-eco>
        {@render velo(velos.lejos, "lejos")}
      </div>
      <div class="onda__breath" data-breath>
        {@render velo(velos.medio, "medio")}
        {@render velo(velos.cerca, "cerca")}
      </div>
    </div>
  </div>
</div>

<style>
  .onda {
    --fade: 22%;
    position: absolute;
    left: 0;
    right: 0;
    top: 42%;
    z-index: 0;
    height: min(70vh, 560px);
    transform: translateY(-50%);
    overflow: hidden;
    pointer-events: none;
    container-type: size;
    mask-image: linear-gradient(
      90deg,
      transparent 0%,
      rgb(0 0 0 / 0.2) 8%,
      #000 var(--fade),
      #000 calc(100% - var(--fade)),
      rgb(0 0 0 / 0.2) 92%,
      transparent 100%
    );
    mask-size: 100% 100%;
    mask-repeat: no-repeat;
    -webkit-mask-image: linear-gradient(
      90deg,
      transparent 0%,
      rgb(0 0 0 / 0.2) 8%,
      #000 var(--fade),
      #000 calc(100% - var(--fade)),
      rgb(0 0 0 / 0.2) 92%,
      transparent 100%
    );
    -webkit-mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
  }

  .onda__fit {
    position: absolute;
    left: 0;
    top: 0;
    width: 1200px;
    height: 400px;
    transform-origin: 0 0;
    transform: scale(calc(100cqw / 1200px), calc(100cqh / 400px));
  }

  .onda__pan,
  .onda__eco,
  .onda__breath {
    position: absolute;
    inset: 0;
    will-change: transform;
  }

  .ink {
    position: absolute;
    display: block;
    overflow: hidden;
  }
</style>
