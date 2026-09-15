<script lang="ts">
  import copy from "./home.copy.json";
  import Marca from "../../ui/Marca.svelte";
  import Asterisco from "../../ui/Asterisco.svelte";
  import Collage from "./Collage.svelte";
  import FondoHome from "./FondoHome.svelte";
  import { montarOrbita } from "./orbita";
  import { montarFondoHome } from "./fondo";
  import { navigate } from "../director/router";
  import type { RutaParsed } from "../director/router";

  type Props = { ruta?: RutaParsed };
  let { ruta: _ruta }: Props = $props();
</script>

<!--
  Dos contextos hermanos e independientes sobre el mismo `<section>`: la órbita
  primero (intacta, diff cero en `orbita.ts`) y el fondo después. Cada attach
  devuelve su propia limpieza, así que Svelte las invoca por separado y ninguna
  puede arrastrar a la otra (Req 6.1, 6.2, 6.4, 14.4, 14.5).
-->
<section class="home" {@attach montarOrbita} {@attach montarFondoHome}>
  <div class="home__pin">
    <FondoHome />
    <header class="home__top">
      <Marca texto={copy.brand} />
      <Asterisco />
    </header>
    <div class="home__stage">
      <div class="home__copy">
        <p class="home__kicker">{copy.kicker}</p>
        <h1 class="tipo-hero">{copy.title[0]}</h1>
        <p class="tipo-cuerpo">{copy.tagline}</p>
      </div>
      <div class="home__orbita">
        <Collage cards={copy.cards} />
      </div>
      <span class="home__play-destello" aria-hidden="true"></span>
      <button
        class="home__play"
        type="button"
        aria-label={copy.cta}
        onclick={() => navigate("/hook")}
      >
        <span class="home__play-aura" aria-hidden="true"></span>
        <span class="home__play-ring" aria-hidden="true"></span>
        <span class="home__play-ring home__play-ring--eco" aria-hidden="true"></span>
        <span class="home__play-core">
          <span class="home__play-brillo" aria-hidden="true"></span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8.2 5.4v13.2L19.4 12 8.2 5.4Z" />
          </svg>
        </span>
      </button>
    </div>
    <aside class="home__fragmentos" aria-hidden="true">
      <p class="tipo-eco home__eco home__eco--ejes">
        {#each copy.ejes as eje (eje)}
          <span>{eje}</span>
        {/each}
      </p>
      <p class="tipo-eco home__eco home__eco--mantra">
        {#each copy.mantra as linea (linea)}
          <span>{linea}</span>
        {/each}
      </p>
      <p class="tipo-eco home__eco home__eco--suelo-izq">
        {#each copy.sueloIzq as linea (linea)}
          <span>{linea}</span>
        {/each}
      </p>
      <p class="tipo-eco home__eco home__eco--suelo-der">
        {#each copy.sueloDer as linea (linea)}
          <span>{linea}</span>
        {/each}
      </p>
    </aside>
    <div class="home__cue">
      <p class="home__cue-label">{copy.scrollHint}</p>
      <span class="home__cue-gesto" aria-hidden="true">
        <span class="home__cue-capsula">
          <span class="home__cue-punto"></span>
        </span>
        <span class="home__cue-linea"></span>
      </span>
    </div>
    <p class="tipo-pie home__foot">{copy.footer}</p>
  </div>
</section>

<style>
  .home {
    height: 920vh;
  }
  .home__pin {
    position: sticky;
    top: 0;
    height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    padding: var(--pad-y) var(--pad-x);
    gap: 12px;
    overflow: visible;
  }
  /* El layout de `.home__fondo` y de su foto vive ahora en `FondoHome.svelte`. */
  .home__top {
    position: relative;
    z-index: 5;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .home__kicker {
    font-size: clamp(10px, 1vw, 12px);
    font-weight: 500;
    letter-spacing: 0.42em;
    text-indent: 0.42em;
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  .home__fragmentos {
    position: absolute;
    inset: var(--pad-y) var(--pad-x);
    z-index: 5;
    pointer-events: none;
  }
  .home__eco {
    position: absolute;
    display: flex;
    flex-direction: column;
    margin: 0;
    max-width: 16ch;
  }
  .home__eco span {
    display: block;
  }
  .home__eco--ejes {
    top: clamp(52px, 9vh, 88px);
    left: 0;
  }
  .home__eco--ejes::after,
  .home__eco--mantra::after,
  .home__eco--suelo-izq::before {
    content: "";
    display: block;
    width: 22px;
    height: 1px;
    background: rgba(255, 246, 239, 0.38);
  }
  .home__eco--ejes::after,
  .home__eco--mantra::after {
    margin-top: 12px;
  }
  .home__eco--suelo-izq::before {
    margin-bottom: 12px;
  }
  .home__eco--mantra {
    top: clamp(64px, 12vh, 110px);
    right: 0;
    text-align: right;
    align-items: flex-end;
  }
  .home__eco--suelo-izq {
    bottom: 0;
    left: 0;
  }
  .home__eco--suelo-der {
    bottom: 0;
    right: 0;
    text-align: right;
    align-items: flex-end;
  }
  .home__stage {
    position: relative;
    z-index: 1;
    min-width: 0;
    min-height: 0;
    overflow: visible;
  }
  .home__copy {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: clamp(14px, 2.2vh, 22px);
    pointer-events: none;
    container-type: inline-size;
  }
  .tipo-hero {
    font-size: clamp(80px, min(21cqi, 30vh), 360px);
    white-space: nowrap;
    max-width: 100%;
    min-width: 0;
  }
  .home__orbita {
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: visible;
  }
  .home__play-destello {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 3;
    width: clamp(160px, 28vw, 240px);
    aspect-ratio: 1;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle,
      rgba(255, 252, 245, 1) 0%,
      rgba(255, 210, 140, 0.72) 28%,
      rgba(255, 160, 70, 0.18) 52%,
      rgba(255, 248, 241, 0) 72%
    );
    mix-blend-mode: plus-lighter;
    will-change: transform, opacity;
  }
  .home__play {
    appearance: none;
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 4;
    width: clamp(88px, 14vw, 128px);
    aspect-ratio: 1;
    border: 0;
    padding: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-title);
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transform: translate(-50%, -50%);
    will-change: transform;
  }
  .home__play:global(.is-vivo) {
    pointer-events: auto;
  }
  .home__play:global(.is-vivo):hover .home__play-core {
    filter: brightness(1.16);
    box-shadow:
      0 0 42px rgba(255, 196, 110, 0.55),
      0 18px 40px rgba(20, 0, 40, 0.32),
      inset 0 1px 0 rgba(255, 255, 255, 0.62);
  }
  .home__play:global(.is-vivo):active .home__play-core {
    filter: brightness(0.96);
  }
  .home__play-aura {
    position: absolute;
    inset: -22%;
    z-index: 0;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0;
    background: radial-gradient(
      circle,
      rgba(255, 214, 140, 0.55) 0%,
      rgba(255, 176, 72, 0.18) 42%,
      transparent 70%
    );
  }
  .home__play:global(.is-vivo) .home__play-aura {
    animation: play-aura 2.1s var(--ease-soft) infinite;
  }
  .home__play-core {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 255, 255, 0.62);
    background: linear-gradient(
      150deg,
      rgba(255, 255, 255, 0.42) 0%,
      rgba(255, 214, 150, 0.22) 42%,
      rgba(255, 255, 255, 0.1) 100%
    );
    box-shadow:
      0 0 28px rgba(255, 196, 110, 0.38),
      0 16px 36px rgba(20, 0, 40, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.58);
    transition: filter 180ms var(--ease-soft), box-shadow 180ms var(--ease-soft);
    will-change: transform;
  }
  .home__play-brillo {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    opacity: 0;
    border-radius: inherit;
    --shine-x: -20%;
    background: radial-gradient(
      circle 36% at var(--shine-x) 34%,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(255, 255, 255, 0.28) 34%,
      transparent 68%
    );
    mix-blend-mode: plus-lighter;
    will-change: opacity;
  }
  .home__play-core svg {
    position: relative;
    z-index: 3;
    display: block;
    width: 34%;
    height: 34%;
    fill: currentColor;
  }
  .home__play-ring {
    position: absolute;
    inset: -14px;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 228, 186, 0.55);
    opacity: 0.2;
    pointer-events: none;
  }
  .home__play-ring--eco {
    inset: -26px;
    border-color: rgba(255, 210, 140, 0.35);
  }
  .home__play:global(.is-vivo) .home__play-ring {
    animation: play-halo 2.2s var(--ease-soft) infinite;
  }
  .home__play:global(.is-vivo) .home__play-ring--eco {
    animation-delay: 0.7s;
  }
  .home__play:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 6px;
  }
  .home__foot {
    position: absolute;
    left: 0;
    right: 0;
    bottom: var(--pad-y);
    text-align: center;
    pointer-events: none;
    opacity: 0;
  }
  .home__cue {
    position: relative;
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    color: var(--ink-mute);
    pointer-events: none;
  }
  .home__cue-label {
    letter-spacing: 0.46em;
    text-indent: 0.46em;
    text-transform: uppercase;
    font-size: 11px;
    font-weight: 500;
    color: rgba(255, 246, 239, 0.82);
  }
  .home__cue-gesto {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .home__cue-capsula {
    position: relative;
    display: block;
    width: 24px;
    height: 42px;
    overflow: hidden;
    border: 1.25px solid rgba(255, 246, 239, 0.86);
    border-radius: 999px;
  }
  .home__cue-punto {
    position: absolute;
    left: 50%;
    top: 9px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255, 246, 239, 0.96);
    transform: translateX(-50%);
    animation: cue-punto 1.85s var(--ease-soft) infinite;
  }
  .home__cue-linea {
    display: block;
    width: 1px;
    height: 28px;
    background: linear-gradient(
      to bottom,
      rgba(255, 246, 239, 0.72) 0%,
      rgba(255, 246, 239, 0) 100%
    );
  }
  @keyframes play-halo {
    0% {
      transform: scale(0.92);
      opacity: 0.7;
    }
    70% {
      transform: scale(1.28);
      opacity: 0;
    }
    100% {
      transform: scale(1.28);
      opacity: 0;
    }
  }
  @keyframes play-aura {
    0%,
    100% {
      opacity: 0.28;
      transform: scale(0.9);
    }
    50% {
      opacity: 0.78;
      transform: scale(1.16);
    }
  }
  @keyframes cue-punto {
    0% {
      opacity: 0;
      transform: translateX(-50%) translateY(0);
    }
    18% {
      opacity: 1;
    }
    72% {
      opacity: 0.15;
      transform: translateX(-50%) translateY(18px);
    }
    100% {
      opacity: 0;
      transform: translateX(-50%) translateY(18px);
    }
  }

  .home:global(.is-quieto) {
    height: auto;
    min-height: 100%;
  }
  .home:global(.is-quieto) .home__pin {
    position: relative;
    height: auto;
    min-height: 100dvh;
  }
  .home:global(.is-quieto) .home__stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(16px, 2.4vh, 24px);
    overflow: visible;
  }
  .home:global(.is-quieto) .home__copy {
    position: static;
    pointer-events: auto;
  }
  .home:global(.is-quieto) .home__play-destello,
  .home:global(.is-quieto) .home__play-brillo,
  .home:global(.is-quieto) .home__play-aura,
  .home:global(.is-quieto) .home__play-ring {
    display: none;
  }
  .home:global(.is-quieto) .home__play {
    position: relative;
    left: auto;
    top: auto;
    opacity: 1;
    pointer-events: auto;
    transform: none;
  }
  .home:global(.is-quieto) .home__orbita {
    position: relative;
    inset: auto;
    width: 100%;
  }
  .home:global(.is-quieto) .home__cue {
    display: none;
  }
  .home:global(.is-quieto) .home__foot {
    position: static;
    opacity: 1;
  }

  @media (max-width: 767px) {
    .home {
      height: 760vh;
    }
    .tipo-hero {
      font-size: clamp(56px, 19vw, 92px);
    }
    .home__fragmentos {
      display: none;
    }
    .home__kicker {
      letter-spacing: 0.28em;
      text-indent: 0.28em;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .home {
      height: auto;
      min-height: 100%;
    }
    .home__pin {
      position: relative;
      height: auto;
      min-height: 100dvh;
    }
    .home__stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: clamp(16px, 2.4vh, 24px);
      overflow: visible;
    }
    .home__copy {
      position: static;
      pointer-events: auto;
    }
    .home__play {
      position: relative;
      left: auto;
      top: auto;
      opacity: 1;
      pointer-events: auto;
      transform: none;
    }
    .home__orbita {
      position: relative;
      inset: auto;
      width: 100%;
    }
    .home__cue {
      display: none;
    }
    .home__cue-punto {
      animation: none;
    }
    .home__foot {
      position: static;
      opacity: 1;
    }
    .home__play:global(.is-vivo) .home__play-ring,
    .home__play-ring,
    .home__play-aura {
      animation: none;
    }
    .home__play-destello,
    .home__play-brillo,
    .home__play-aura,
    .home__play-ring {
      display: none;
    }
  }
</style>
