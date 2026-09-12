<script lang="ts">
  import { onMount, tick } from "svelte";
  import { get } from "svelte/store";
  import copy from "./boot.copy.json";
  import homeCopy from "../home/home.copy.json";
  import Marca from "../../ui/Marca.svelte";
  import Asterisco from "../../ui/Asterisco.svelte";
  import { precargarArchivo } from "../../datos/archivo";
  import { ensureGsap } from "../../motion/gsap";
  import { reduce } from "../../motion/reducedMotion";

  type Props = {
    onrevelar: () => void;
    onsalida: () => void;
  };
  let { onrevelar, onsalida }: Props = $props();

  const palabra = homeCopy.title[0];
  const MIN_MS = 1800;
  let root: HTMLElement | undefined;
  let pct = $state(0);

  onMount(() => {
    const gsap = ensureGsap();
    if (!root) {
      onrevelar();
      onsalida();
      return;
    }
    const host = root;
    const fill = host.querySelector<HTMLElement>("[data-fill]");
    const proxy = { t: 0 };
    let fillTween: gsap.core.Tween | undefined;
    let waveTween: gsap.core.Tween | undefined;
    let salidaTl: gsap.core.Timeline | undefined;
    let dead = false;

    const pintar = () => {
      fill?.style.setProperty("--fill", String(gsap.utils.clamp(0, 1, proxy.t)));
    };

    const irA = (frac: number, duration = 0.95) => {
      fillTween?.kill();
      fillTween = gsap.to(proxy, {
        t: frac,
        duration: get(reduce) ? 0 : duration,
        ease: "sine.out",
        overwrite: "auto",
        onUpdate: pintar,
      });
    };

    const esperarFuentes = async () => {
      try {
        await Promise.race([
          document.fonts.ready,
          new Promise<void>((resolve) => {
            setTimeout(resolve, 2000);
          }),
        ]);
      } catch {
        /* Anton con swap */
      }
    };

    const salir = async () => {
      if (dead) return;
      irA(1, get(reduce) ? 0 : 0.7);
      await fillTween;
      if (dead) return;
      onrevelar();
      await tick();
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      if (dead) return;

      salidaTl = gsap.timeline({
        defaults: { ease: "sine.inOut" },
        onComplete: () => {
          if (!dead) onsalida();
        },
      });
      salidaTl.to(host, { autoAlpha: 0, duration: get(reduce) ? 0.2 : 0.9 }, 0.2);
    };

    void (async () => {
      const t0 = performance.now();
      pintar();
      if (fill && !get(reduce)) {
        gsap.set(fill, { "--wave": "7%" });
        waveTween = gsap.to(fill, {
          "--wave": "12%",
          duration: 2.2,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      }
      await esperarFuentes();
      if (dead) return;
      await precargarArchivo((frac) => {
        if (dead) return;
        pct = Math.round(frac * 100);
        irA(frac);
      });
      if (dead) return;
      pct = 100;
      const resto = Math.max(0, MIN_MS - (performance.now() - t0));
      if (resto) await new Promise((resolve) => setTimeout(resolve, resto));
      await salir();
    })();

    return () => {
      dead = true;
      fillTween?.kill();
      waveTween?.kill();
      salidaTl?.kill();
    };
  });
</script>

<div
  class="boot"
  bind:this={root}
  role="progressbar"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={pct}
  aria-label={copy.status}
>
  <div class="boot__velo" aria-hidden="true"></div>
  <div class="boot__pin">
    <header class="boot__top">
      <Marca texto={homeCopy.brand} />
      <Asterisco />
    </header>
    <div class="boot__stage">
      <div class="boot__copy">
        <p class="tipo-hero boot__word" aria-hidden="true">
          <span class="boot__ghost">{palabra}</span>
          <span class="boot__fill" data-fill style:--fill="0">
            <span class="boot__ink">{palabra}</span>
            <span class="boot__frost">{palabra}</span>
          </span>
        </p>
        <p class="tipo-cuerpo boot__eco" aria-hidden="true">{homeCopy.tagline}</p>
      </div>
    </div>
    <div class="boot__cue">
      <p class="boot__status">{copy.status}</p>
      <span class="boot__flecha" aria-hidden="true"></span>
    </div>
  </div>
</div>

<style>
  .boot {
    position: fixed;
    inset: 0;
    z-index: var(--z-boot);
    pointer-events: auto;
  }
  .boot__velo {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(65% 70% at 50% 42%, rgba(28, 10, 32, 0.35), rgba(8, 4, 14, 0.88) 70%),
      rgba(8, 4, 14, 0.82);
    pointer-events: none;
  }
  .boot__pin {
    position: relative;
    z-index: 1;
    height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    padding: var(--pad-y) var(--pad-x);
    gap: 12px;
  }
  .boot__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .boot__stage {
    position: relative;
    min-width: 0;
    min-height: 0;
  }
  .boot__copy {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: clamp(14px, 2.2vh, 22px);
    container-type: inline-size;
  }
  .boot__word {
    position: relative;
    margin: 0;
    font-size: clamp(80px, min(21cqi, 30vh), 360px);
    white-space: nowrap;
    max-width: 100%;
    min-width: 0;
    text-shadow: none;
  }
  .boot__eco {
    visibility: hidden;
  }
  .boot__ghost {
    color: rgba(255, 246, 239, 0.16);
  }
  .boot__fill {
    position: absolute;
    inset: 0;
    --wave: 7%;
    -webkit-mask-image: linear-gradient(
      to top,
      #000 0%,
      #000 calc(var(--fill, 0) * 100% - var(--wave)),
      rgba(0, 0, 0, 0.45) calc(var(--fill, 0) * 100%),
      transparent calc(var(--fill, 0) * 100% + var(--wave))
    );
    mask-image: linear-gradient(
      to top,
      #000 0%,
      #000 calc(var(--fill, 0) * 100% - var(--wave)),
      rgba(0, 0, 0, 0.45) calc(var(--fill, 0) * 100%),
      transparent calc(var(--fill, 0) * 100% + var(--wave))
    );
  }
  .boot__ink,
  .boot__frost {
    position: absolute;
    inset: 0;
    background-attachment: fixed;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
  }
  .boot__ink {
    background-image: var(--fondo-home);
  }
  .boot__frost {
    background-image:
      radial-gradient(circle at 18% 28%, rgba(255, 248, 242, 0.55), transparent 42%),
      radial-gradient(circle at 78% 62%, rgba(255, 214, 196, 0.28), transparent 48%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.22), transparent 55%);
    mix-blend-mode: screen;
    opacity: 0.7;
  }
  .boot__cue {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: rgba(255, 246, 239, 0.46);
    padding-bottom: 6px;
  }
  .boot__status {
    letter-spacing: 0.28em;
    text-indent: 0.28em;
    text-transform: uppercase;
    font-size: 11px;
  }
  .boot__flecha {
    width: 10px;
    height: 10px;
    visibility: hidden;
  }
  @media (max-width: 767px) {
    .boot__word {
      font-size: clamp(56px, 19vw, 92px);
    }
  }
</style>
