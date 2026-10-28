<script lang="ts">
  import copy from "./home.copy.json";
  import Marca from "../../ui/Marca.svelte";
  import Asterisco from "../../ui/Asterisco.svelte";
  import Collage from "./Collage.svelte";
  import FondoHome from "./FondoHome.svelte";
  import CueDesliza from "../../ui/CueDesliza.svelte";
  import { montarOrbita } from "./orbita";
  import { montarPrimera } from "./primera";
  import { montarFondoHome } from "./fondo";
  import Camara from "./Camara.svelte";
  import Pila from "./Pila.svelte";
  import Tira from "./Tira.svelte";
  import Umbral from "./Umbral.svelte";
  import { navigate } from "../director/router";
  import type { RutaParsed } from "../director/router";

  type Props = { ruta?: RutaParsed };
  let { ruta: _ruta }: Props = $props();

  const trasCamara = copy.primera.pasos.findIndex((paso) => "camara" in paso && paso.camara);

  /** El plano del título se apaga cuando el scroll lo disuelve o la pestaña no se ve. */
  function planoTitulo(node: HTMLVideoElement): () => void {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    node.muted = true;
    const sincronizar = () => {
      const opacidad = node.style.opacity === "" ? 1 : Number.parseFloat(node.style.opacity);
      const oculto =
        reduce.matches ||
        document.hidden ||
        node.style.visibility === "hidden" ||
        opacidad < 0.05;
      if (oculto) {
        if (!node.paused) node.pause();
        return;
      }
      if (node.paused) void node.play().catch(() => undefined);
    };
    const observador = new MutationObserver(sincronizar);
    observador.observe(node, { attributes: true, attributeFilter: ["style"] });
    reduce.addEventListener("change", sincronizar);
    document.addEventListener("visibilitychange", sincronizar);
    sincronizar();
    return () => {
      observador.disconnect();
      reduce.removeEventListener("change", sincronizar);
      document.removeEventListener("visibilitychange", sincronizar);
      node.pause();
    };
  }
</script>

<!--
  Tres attaches sobre el mismo `<section>`: la órbita, los fragmentos en el
  hueco del círculo y el fondo. Los tres recorren el mismo scroll.
-->
<section class="home" {@attach montarOrbita} {@attach montarPrimera} {@attach montarFondoHome}>
  <div class="home__pin">
    <FondoHome />
    <video
      class="home__plano"
      muted
      loop
      playsinline
      poster="/assets/home/titulo/playworld.jpg"
      aria-hidden="true"
      {@attach planoTitulo}
    >
      <source src="/assets/home/titulo/playworld.mp4" type="video/mp4" />
    </video>
    <header class="home__top">
      <Marca texto={copy.brand} />
      <Asterisco />
    </header>
    <div class="home__stage">
      <div class="home__copy">
        <p class="home__kicker eyebrow">{copy.kicker}</p>
        <h1 class="home__logo" aria-label={copy.title[0]}>
          <span class="home__logo-ink"></span>
        </h1>
        <!-- Misma altura que el kicker: el logo queda en el eje de la palabra de carga. -->
        <p class="home__kicker eyebrow home__equilibrio" aria-hidden="true">{copy.kicker}</p>
      </div>
      <Umbral />
      <div class="home__orbita">
        <Collage cards={copy.cards} />
      </div>
      <div class="home__pila" aria-hidden="true">
        <Pila />
      </div>
      <span class="home__play-destello" aria-hidden="true"></span>
      <div class="home__relato" aria-label="{copy.primera.indice}. {copy.primera.lugar}">
        {#each copy.primera.pasos as paso, i (paso.nombre)}
          <div
            class="home__beat"
            class:home__beat--lado={"camara" in paso && paso.camara}
            class:home__beat--umbral={paso.nombre === "El portal"}
            class:home__beat--pregunta={paso.nombre === "La pregunta"}
            class:home__beat--fan={paso.nombre === "La fan"}
            class:home__beat--entendido={paso.nombre === "Lo que entendí"}
            class:home__beat--sigue={trasCamara >= 0 && i > trasCamara && paso.nombre !== "La fila"}
            class:home__beat--cierre={paso.nombre === "La fila"}
          >
            {#if "camara" in paso && paso.camara}
              <div class="home__lado">
                <p class="home__frase">{paso.frase}</p>
              </div>
            {:else}
              {#if paso.img && paso.nombre !== "La fan"}
                <img class="home__pieza home__pieza--{paso.clase}" src={paso.img} alt={paso.alt} />
              {/if}
              {#if "titulo" in paso && paso.titulo}
                <p class="home__titulo">{paso.titulo}</p>
              {/if}
              <p class="home__frase">{paso.frase}</p>
              {#if paso.nombre === "La fan"}
                <Tira />
              {/if}
            {/if}
          </div>
        {/each}
      </div>
      <Tira lado="der" origen="caratulas" cards={copy.cards} />
      <button
        class="home__play"
        type="button"
        aria-label={copy.cta}
        data-fila={copy.fila}
        onclick={() => navigate("/hook")}
      >
        <span class="home__play-aura" aria-hidden="true"></span>
        <span class="home__play-ring" aria-hidden="true"></span>
        <span class="home__play-ring home__play-ring--eco" aria-hidden="true"></span>
        <img src="/assets/home/cd-player.png" alt="" draggable="false" />
      </button>
      <div class="home__toma">
        <Camara grande />
      </div>
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
      <CueDesliza texto={copy.scrollHint} />
    </div>
    <p class="tipo-pie home__foot">{copy.footer}</p>
  </div>
</section>

<style>
  .home {
    --entrada: 920;
    --relato: 1480;
    height: calc((var(--entrada) + var(--relato)) * 1vh);
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
  .home__plano {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
    width: 100%;
    height: 100dvh;
    object-fit: cover;
    object-position: center 28%;
    pointer-events: none;
    background: #14081c;
  }
  .home__top {
    position: relative;
    z-index: 5;
    display: flex;
    justify-content: space-between;
    align-items: center;
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
    background: color-mix(in srgb, var(--ink) 38%, transparent);
  }
  /* El suelo del degradado claro sigue siendo violeta: ahí la crema se lee. */
  .home__eco--suelo-izq,
  .home__eco--suelo-der,
  .home__foot {
    color: rgba(255, 246, 239, 0.78);
  }
  .home__eco--suelo-izq::before {
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
  .home__logo {
    width: min(92cqi, 1080px, calc(28vh * 2400 / 644));
    aspect-ratio: 2400 / 644;
    margin: 0;
    filter: drop-shadow(0 8px 40px rgba(20, 0, 40, 0.28));
  }
  .home__logo-ink {
    display: block;
    width: 100%;
    height: 100%;
    background: var(--ink-title);
    -webkit-mask: url("/assets/marca/playworld-subtexto.png") center / contain no-repeat;
    mask: url("/assets/marca/playworld-subtexto.png") center / contain no-repeat;
  }
  .home__equilibrio {
    visibility: hidden;
  }
  .home__orbita {
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: visible;
    isolation: isolate;
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
    z-index: 5;
    width: clamp(260px, 36vw, 460px);
    aspect-ratio: 896 / 420;
    border: 0;
    padding: 0;
    border-radius: 0;
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
  .home__play img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
  }
  .home__play-aura,
  .home__play-ring {
    display: none;
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
  .home__relato {
    position: absolute;
    left: clamp(20px, 4vw, 72px);
    top: clamp(8px, 3vh, 40px);
    z-index: 3;
    width: min(42rem, 40vw);
    height: min(84%, 820px);
    pointer-events: none;
    container-type: inline-size;
  }
  .home__pila {
    position: absolute;
    top: 8%;
    right: 3%;
    z-index: 2;
    width: min(42vw, 560px);
    height: 80%;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
  }
  .home__beat--umbral > .home__frase,
  .home__beat--umbral > .home__titulo,
  .home__beat--umbral > .home__pieza {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .home__beat {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 1.6vmin;
    padding: 6vh 0 0;
    text-align: left;
    opacity: 0;
  }
  .home__lado {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.4vmin;
    min-width: 0;
  }
  .home__toma {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 6;
    width: min(92vw, calc(78dvh * 1.4994));
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform-origin: 50% 50%;
    will-change: transform, opacity;
  }
  .home__toma :global(.objeto) {
    width: 100%;
  }
  .home__frase {
    margin: 0;
    width: 100%;
    max-width: 40rem;
    font-size: clamp(26px, 2.05vw, 38px);
    line-height: 1.18;
    letter-spacing: -0.035em;
    text-wrap: pretty;
  }
  .home__beat--pregunta {
    width: min(88vw, 1120px);
    justify-content: center;
    padding-top: 0;
  }
  .home__beat--pregunta .home__frase {
    max-width: none;
    font-family: "DM Sans", system-ui, sans-serif;
    font-weight: 800;
    font-size: clamp(40px, 5.15vw, 86px);
    line-height: 0.98;
    letter-spacing: -0.046em;
    text-wrap: pretty;
  }
  .home__beat--fan {
    left: calc(42vw - clamp(20px, 4vw, 72px));
    right: auto;
    width: min(44vw, 640px);
    justify-content: center;
    padding-top: 0;
    overflow: visible;
  }
  .home__beat--fan .home__frase,
  .home__beat--entendido .home__frase,
  .home__beat--lado .home__frase,
  .home__beat--sigue .home__frase,
  .home__beat--cierre .home__frase {
    max-width: none;
    font-family: "DM Sans", system-ui, sans-serif;
    font-weight: 500;
    font-size: clamp(32px, min(4.05vw, 6.2vh), 64px);
    line-height: 1.12;
    letter-spacing: -0.028em;
    text-wrap: pretty;
    transform: translateY(9vh);
  }
  .home__beat--entendido,
  .home__beat--lado,
  .home__beat--sigue,
  .home__beat--cierre {
    right: auto;
    width: min(44vw, 640px);
    justify-content: center;
    padding-top: 0;
    overflow: visible;
  }
  .home__beat:has(.home__pieza) .home__frase {
    font-size: clamp(24px, 1.85vw, 34px);
  }
  .home__pieza {
    display: block;
    object-fit: contain;
    border-radius: 4px;
  }
  .home__reliquias {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3.5%;
    width: 100%;
    min-width: 0;
  }
  .home__reliquias .home__pieza--boleta {
    width: 84px;
    flex: none;
  }
  .home__pieza--manilla { width: 62%; }
  .home__pieza--flyer,
  .home__pieza--boleta {
    width: 42%;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
  }
  .home__cue {
    position: relative;
    z-index: 5;
  }
  .home:global(.is-listo) .home__play-destello,
  .home:global(.is-listo) .home__play-aura,
  .home:global(.is-listo) .home__play-ring,
  .home:global(.is-listo) .home__play-ring--eco {
    animation: none;
    opacity: 0;
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
  .home:global(.is-quieto) .home__equilibrio {
    display: none;
  }
  .home:global(.is-quieto) .home__play-destello,
  .home:global(.is-quieto) :global(.home__play-brillo),
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
  .home:global(.is-quieto) .home__relato {
    position: relative;
    left: auto;
    top: auto;
    width: min(40rem, 100%);
    height: auto;
    transform: none;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 28px;
    margin-top: 28px;
    text-align: left;
  }
  .home:global(.is-quieto) .home__beat {
    position: static;
    opacity: 1;
    align-items: flex-start;
    text-align: left;
  }
  .home:global(.is-quieto) .home__beat--umbral > .home__frase,
  .home:global(.is-quieto) .home__beat--umbral > .home__titulo,
  .home:global(.is-quieto) .home__beat--umbral > .home__pieza {
    position: static;
    width: auto;
    height: auto;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
  .home:global(.is-quieto) .home__pila {
    position: relative;
    top: auto;
    right: auto;
    width: min(100%, 640px);
    height: 420px;
    margin: 8px auto 0;
    opacity: 1;
    visibility: visible;
  }
  .home:global(.is-quieto) .home__toma {
    position: relative;
    left: auto;
    top: auto;
    width: min(100%, 420px);
    margin: 8px 0 0;
    opacity: 1;
    visibility: visible;
  }
  .home:global(.is-quieto) .home__reliquias {
    justify-content: flex-start;
    width: min(100%, 420px);
  }
  .home:global(.is-quieto) .home__pieza,
  .home:global(.is-quieto) .home__pieza--flyer,
  .home:global(.is-quieto) .home__pieza--boleta,
  .home:global(.is-quieto) .home__pieza--manilla {
    width: min(100%, 420px);
    height: auto;
  }
  .home:global(.is-quieto) .home__reliquias .home__pieza--boleta {
    width: 42%;
  }
  .home:global(.is-quieto) .home__frase,
  .home:global(.is-quieto) .home__beat:has(.home__pieza) .home__frase {
    font-size: 22px;
  }
  .home:global(.is-quieto) .home__titulo,
  .home__titulo {
    margin: 0 0 0.4em;
    font-family: "DM Sans", system-ui, sans-serif;
    font-weight: 500;
    font-size: clamp(28px, 3.2vw, 40px);
    line-height: 1.08;
    letter-spacing: -0.03em;
  }
  .home:global(.is-quieto) .home__beat--pregunta {
    width: min(100%, 920px);
  }
  .home:global(.is-quieto) .home__beat--pregunta .home__frase {
    font-size: clamp(32px, 4.6vw, 52px);
    font-weight: 800;
    line-height: 1.04;
    letter-spacing: -0.042em;
  }
  .home:global(.is-quieto) .home__beat--fan .home__frase,
  .home:global(.is-quieto) .home__beat--entendido .home__frase,
  .home:global(.is-quieto) .home__beat--lado .home__frase,
  .home:global(.is-quieto) .home__beat--sigue .home__frase,
  .home:global(.is-quieto) .home__beat--cierre .home__frase {
    font-size: clamp(28px, 3.6vw, 44px);
    font-weight: 500;
    line-height: 1.12;
    letter-spacing: -0.028em;
    transform: none;
  }
  .home:global(.is-quieto) .home__beat--fan,
  .home:global(.is-quieto) .home__beat--entendido,
  .home:global(.is-quieto) .home__beat--lado,
  .home:global(.is-quieto) .home__beat--sigue,
  .home:global(.is-quieto) .home__beat--cierre {
    width: min(100%, 720px);
  }

  @media (max-width: 767px) {
    .home {
      --entrada: 760;
    }
    .home__play {
      width: min(86vw, 340px);
    }
    .home__fragmentos {
      display: none;
    }
    .home__relato {
      top: auto;
      bottom: 8px;
      width: calc(100% - 8px);
      height: auto;
      max-height: 46dvh;
      transform: none;
    }
    .home__pila {
      top: 0;
      right: -12%;
      width: 84%;
      height: 42%;
    }
    .home__frase,
    .home__beat:has(.home__pieza) .home__frase {
      font-size: clamp(18px, 4.8vw, 24px);
    }
    .home__beat--pregunta {
      inset: auto 0 0 0;
      width: 100%;
      height: auto;
      justify-content: flex-end;
      padding-top: 0;
    }
    .home__beat--pregunta .home__frase {
      font-size: clamp(30px, 7.8vw, 44px);
      font-weight: 800;
      line-height: 1.04;
      letter-spacing: -0.04em;
    }
    .home__beat--fan {
      inset: auto 0 0 auto;
      left: 46%;
      width: 52%;
      height: auto;
      justify-content: flex-end;
    }
    .home__beat--fan .home__frase,
    .home__beat--entendido .home__frase,
    .home__beat--lado .home__frase,
    .home__beat--sigue .home__frase,
    .home__beat--cierre .home__frase {
      font-size: clamp(24px, 6vw, 32px);
      font-weight: 500;
      line-height: 1.14;
      letter-spacing: -0.02em;
      transform: none;
    }
    .home__beat--entendido,
    .home__beat--lado {
      inset: auto 0 0 0;
      width: 100%;
      height: auto;
      justify-content: flex-end;
    }
    .home__beat--sigue,
    .home__beat--cierre {
      inset: auto auto 0 0;
      width: 54%;
      height: auto;
      justify-content: flex-end;
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
    .home__equilibrio {
      display: none;
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
    .home__foot {
      position: static;
      opacity: 1;
    }
    .home__relato {
      position: relative;
      left: auto;
      top: auto;
      width: min(40rem, 100%);
      height: auto;
      transform: none;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 28px;
      margin-top: 28px;
      text-align: left;
    }
    .home__beat {
      position: static;
      opacity: 1;
      align-items: flex-start;
      text-align: left;
    }
    .home__beat--umbral > .home__frase,
    .home__beat--umbral > .home__titulo,
    .home__beat--umbral > .home__pieza {
      position: static;
      width: auto;
      height: auto;
      margin: 0;
      overflow: visible;
      clip: auto;
      white-space: normal;
    }
    .home__beat--lado {
      width: min(100%, 720px);
    }
    .home__pila {
      position: relative;
      top: auto;
      right: auto;
      width: min(100%, 640px);
      height: 420px;
      margin: 8px auto 0;
      opacity: 1;
      visibility: visible;
    }
    .home__toma {
      position: relative;
      left: auto;
      top: auto;
      width: min(100%, 420px);
      margin-top: 12px;
      opacity: 1;
      visibility: visible;
    }
    .home__reliquias {
      justify-content: flex-start;
      width: min(100%, 420px);
    }
    .home__pieza,
    .home__pieza--flyer,
    .home__pieza--boleta,
    .home__pieza--manilla {
      width: min(100%, 420px);
      height: auto;
    }
    .home__reliquias .home__pieza--boleta {
      width: 42%;
    }
    .home__frase,
    .home__beat:has(.home__pieza) .home__frase {
      font-size: 22px;
    }
    .home__beat--pregunta .home__frase {
      font-size: clamp(32px, 4.6vw, 52px);
      font-weight: 800;
      line-height: 1.04;
      letter-spacing: -0.042em;
    }
    .home__beat--fan .home__frase,
    .home__beat--entendido .home__frase,
    .home__beat--lado .home__frase,
    .home__beat--sigue .home__frase,
    .home__beat--cierre .home__frase {
      font-size: clamp(28px, 3.6vw, 44px);
      font-weight: 500;
      line-height: 1.12;
      letter-spacing: -0.028em;
      transform: none;
    }
    .home__beat--fan,
    .home__beat--entendido,
    .home__beat--lado,
    .home__beat--sigue,
    .home__beat--cierre {
      width: min(100%, 720px);
    }
    .home__play:global(.is-vivo) .home__play-ring,
    .home__play-ring,
    .home__play-aura {
      animation: none;
    }
    .home__play-destello,
    :global(.home__play-brillo),
    .home__play-aura,
    .home__play-ring {
      display: none;
    }
  }
</style>
