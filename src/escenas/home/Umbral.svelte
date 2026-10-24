<script lang="ts">
  import copy from "./home.copy.json";
  import rollo from "./rollo.json";

  const portal = copy.primera.pasos.find((paso) => paso.nombre === "El portal");
  const titulo = portal && "titulo" in portal ? portal.titulo : "";
  const frase = portal?.frase ?? "";

  /** El flyer abre el portal; las dos tomas son el otro lado. */
  const fuentes = [
    "/assets/home/primera/flyer-2016.jpg",
    "/assets/home/camara/01.jpg",
    "/assets/home/camara/20.jpg",
  ] as const;

  const altDe: Record<string, string> = {
    "/assets/home/primera/flyer-2016.jpg": "Flyer del Festival Estéreo Picnic, marzo de 2016",
  };
  for (const toma of rollo) altDe[toma.src] = toma.alt;

  const fotos = fuentes.map((src) => ({
    src,
    alt: altDe[src] ?? "",
  }));
</script>

<p class="home__anio tipo-anio" aria-hidden="true">
  <span class="home__anio-izq">20</span>
  <span class="home__anio-der">16</span>
</p>

<div class="home__cierre" aria-hidden="true">
  <span class="home__cierre-arriba"></span>
  <span class="home__cierre-abajo"></span>
  <span class="home__cierre-izq"></span>
  <span class="home__cierre-der"></span>
</div>

<div class="home__umbral" aria-hidden="true">
  <div class="home__rendija">
    <div class="home__cinta">
      {#each fotos as foto (foto.src)}
        <img class="home__umbral-foto" src={foto.src} alt={foto.alt} draggable="false" />
      {/each}
    </div>
  </div>
  <div class="home__umbral-copy">
    <p class="home__umbral-titulo">{titulo}</p>
    <p class="home__umbral-frase">{frase}</p>
  </div>
</div>

<style>
  .home__anio {
    position: absolute;
    left: 0;
    right: 0;
    top: 46%;
    z-index: 5;
    height: 0.78em;
    margin: 0;
    font-size: clamp(104px, 28vh, 320px);
    line-height: 0.78;
    white-space: nowrap;
    pointer-events: none;
    transform: translateY(-50%);
    opacity: 0;
    visibility: hidden;
  }
  .home__anio-izq,
  .home__anio-der {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }
  .home__anio-izq {
    right: calc(50% + var(--corte, 15vw) / 2);
  }
  .home__anio-der {
    left: calc(50% + var(--corte, 15vw) / 2);
  }
  .home__cierre {
    position: absolute;
    z-index: 4;
    pointer-events: none;
  }
  .home__cierre span {
    position: absolute;
    background: var(--bg-deep);
    will-change: transform;
  }
  .home__cierre-izq,
  .home__cierre-der {
    top: 0;
    bottom: 0;
    transform: scaleX(0);
  }
  .home__cierre-izq {
    left: 0;
    transform-origin: left center;
  }
  .home__cierre-der {
    right: 0;
    transform-origin: right center;
  }
  .home__cierre-arriba,
  .home__cierre-abajo {
    transform: scaleY(0);
  }
  .home__cierre-arriba {
    top: 0;
    transform-origin: center top;
  }
  .home__cierre-abajo {
    transform-origin: center bottom;
  }
  .home__umbral {
    position: absolute;
    inset: 0;
    z-index: 6;
    pointer-events: none;
    overflow: visible;
    opacity: 0;
    visibility: hidden;
  }
  .home__rendija {
    position: absolute;
    left: 50%;
    top: 18%;
    width: var(--corte, 15vw);
    height: 64%;
    overflow: hidden;
    transform: translateX(-50%);
  }
  .home__cinta {
    display: flex;
    height: 100%;
    width: max-content;
    will-change: transform;
  }
  .home__umbral-foto {
    flex: none;
    height: 100%;
    width: calc(var(--corte, 15vw) * 2.8);
    margin-right: -1px;
    object-fit: cover;
    object-position: center;
    user-select: none;
  }
  .home__umbral-foto:last-child {
    margin-right: 0;
  }
  .home__umbral-copy {
    position: absolute;
    inset: 0;
    color: var(--ink-title);
  }
  .home__umbral-titulo {
    position: absolute;
    top: clamp(8px, 2.5vh, 28px);
    left: clamp(20px, 4vw, 72px);
    width: min(26vw, 380px);
    margin: 0;
    font-family: "DM Sans", system-ui, sans-serif;
    font-weight: 500;
    font-size: clamp(28px, 2.5vw, 42px);
    line-height: 1.08;
    letter-spacing: -0.03em;
  }
  .home__umbral-frase {
    position: absolute;
    right: clamp(20px, 4vw, 72px);
    bottom: clamp(28px, 5vh, 64px);
    width: min(30vw, 420px);
    margin: 0;
    font-family: "DM Sans", system-ui, sans-serif;
    font-weight: 400;
    font-size: clamp(15px, 1.12vw, 18px);
    line-height: 1.4;
    letter-spacing: -0.011em;
  }

  @media (max-width: 767px) {
    .home__anio {
      font-size: clamp(64px, 18vh, 120px);
    }
    .home__rendija {
      width: 38vw;
    }
    .home__umbral-titulo {
      top: 8px;
      left: 16px;
      width: 46vw;
      font-size: clamp(22px, 6vw, 30px);
    }
    .home__umbral-frase {
      right: 16px;
      bottom: 16px;
      width: 52vw;
      font-size: 14px;
      line-height: 1.35;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .home__anio,
    .home__umbral,
    .home__cierre {
      display: none;
    }
  }

  :global(.home.is-quieto) .home__anio,
  :global(.home.is-quieto) .home__umbral,
  :global(.home.is-quieto) .home__cierre {
    display: none;
  }
</style>
