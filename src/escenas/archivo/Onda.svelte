<script lang="ts">
  import { ensureGsap } from "../../motion/gsap";
  import { reduce as reduceMotion } from "../../motion/reducedMotion";
  import { ONDA_VB, focoDe, ondaDe, panDe } from "./onda";

  type Props = { year: number; years?: number[] };
  let { year, years = [] }: Props = $props();

  const reduce = $derived($reduceMotion);
  const fid = $props.id();
  const velos = ondaDe();

  function montar(root: HTMLElement) {
    const gsap = ensureGsap();
    const ctx = gsap.context(() => undefined, root);
    const capa = root.querySelector<SVGGElement>("[data-onda]");
    if (!capa) return () => ctx.revert();

    $effect(() => {
      const x = panDe(focoDe(year, years));
      if (reduce) {
        gsap.set(capa, { x });
        return;
      }
      gsap.to(capa, {
        x,
        duration: 0.95,
        ease: "sine.inOut",
        overwrite: "auto",
      });
    });

    $effect(() => {
      if (reduce) return;
      const breath = gsap.to("[data-breath]", {
        scaleY: 1.04,
        y: 6,
        transformOrigin: "50% 55%",
        duration: 9,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      const eco = gsap.to("[data-eco]", {
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

    return () => ctx.revert();
  }
</script>

<div class="onda" aria-hidden="true" {@attach montar}>
  <svg viewBox="0 0 {ONDA_VB.w} {ONDA_VB.h}" preserveAspectRatio="none">
    <defs>
      <linearGradient id="{fid}-seda" x1="0" y1="0" x2="1" y2="0">
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
      <filter
        id="{fid}-niebla"
        x="-1400"
        y="-180"
        width="4000"
        height="760"
        filterUnits="userSpaceOnUse"
        primitiveUnits="userSpaceOnUse"
      >
        <feGaussianBlur stdDeviation="8" />
      </filter>
      <filter
        id="{fid}-suave"
        x="-1400"
        y="-160"
        width="4000"
        height="720"
        filterUnits="userSpaceOnUse"
        primitiveUnits="userSpaceOnUse"
      >
        <feGaussianBlur stdDeviation="4.5" />
      </filter>
    </defs>
    <g data-onda>
      <g data-eco>
        <path
          class="onda__lejos"
          d={velos.lejos}
          fill="none"
          stroke="url(#{fid}-seda)"
          stroke-width="90"
          stroke-linecap="round"
          stroke-linejoin="round"
          filter="url(#{fid}-niebla)"
        />
      </g>
      <g data-breath>
        <path
          class="onda__medio"
          d={velos.medio}
          fill="none"
          stroke="url(#{fid}-seda)"
          stroke-width="64"
          stroke-linecap="round"
          stroke-linejoin="round"
          filter="url(#{fid}-niebla)"
        />
        <path
          class="onda__cerca"
          d={velos.cerca}
          fill="none"
          stroke="url(#{fid}-seda)"
          stroke-width="28"
          stroke-linecap="round"
          stroke-linejoin="round"
          filter="url(#{fid}-suave)"
        />
      </g>
    </g>
  </svg>
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

  .onda svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .onda__lejos {
    opacity: 0.38;
  }

  .onda__medio {
    opacity: 0.72;
  }

  .onda__cerca {
    opacity: 0.48;
  }

  g[data-onda] {
    will-change: transform;
  }
</style>
