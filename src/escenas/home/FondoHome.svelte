<script lang="ts">
  /**
   * Capas del `Fondo_Home`: la fotografía existente más las tres overlays
   * decorativas (onda, ecualizador y halo). Nodos puramente decorativos:
   * `aria-hidden="true"`, `pointer-events: none`, cero elementos enfocables y
   * cero assets nuevos en `public/` (Req 2.1, 2.2, 2.9, 6.8).
   *
   * El movimiento no vive aquí: lo monta `montarFondoHome` desde `fondo.ts`
   * sobre estos mismos nodos.
   */

  /** Barras de la capa `eq`: siete nodos, dentro del rango 5–12 (Req 2.4). */
  const BARRAS: readonly number[] = [0, 1, 2, 3, 4, 5, 6];
</script>

<div class="home__fondo" aria-hidden="true">
  <img class="home__fondo-foto" src="/assets/home/fondo.jpeg" alt="" />

  <svg
    class="home__fondo-onda"
    data-fondo-capa="onda"
    viewBox="0 0 1200 300"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      class="home__fondo-onda-trazo"
      d="M0,150 C150,90 300,210 450,150 S750,90 900,150 S1050,210 1200,150"
    />
    <path
      class="home__fondo-onda-trazo home__fondo-onda-trazo--eco"
      d="M0,170 C160,120 320,220 480,170 S780,120 940,170 S1080,215 1200,170"
    />
  </svg>

  <div class="home__fondo-eq" data-fondo-capa="eq" aria-hidden="true">
    {#each BARRAS as barra (barra)}
      <span class="home__fondo-barra"></span>
    {/each}
  </div>

  <div class="home__fondo-halo" data-fondo-capa="halo" aria-hidden="true"></div>
</div>

<style>
  /*
   * Mismo layout que el bloque que vivía en `Home.svelte`: sin `isolation`,
   * sin `filter`, sin `backdrop-filter` y sin `opacity < 1` en reposo, para que
   * `.grano` siga resolviendo su mezcla contra el backdrop compuesto (Req 10.6).
   */
  .home__fondo {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 0;
    height: 100dvh;
    overflow: hidden;
    pointer-events: none;
  }
  .home__fondo-foto {
    position: relative;
    z-index: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  /* Capa 1 · onda: solo trazo, sin relleno ni imagen. */
  .home__fondo-onda {
    position: absolute;
    inset: -6% 0;
    z-index: 1;
    mix-blend-mode: screen;
    pointer-events: none;
    opacity: 0.3;
  }
  .home__fondo-onda-trazo {
    fill: none;
    stroke: rgba(255, 238, 212, 0.62);
    stroke-width: 1.6;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }
  .home__fondo-onda-trazo--eco {
    stroke: rgba(255, 202, 138, 0.42);
    stroke-width: 1.1;
  }

  /* Capa 2 · ecualizador: siete barras con origen en el borde inferior. */
  .home__fondo-eq {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2;
    height: 26%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: clamp(10px, 2.6vw, 30px);
    mix-blend-mode: plus-lighter;
    pointer-events: none;
    opacity: 0.3;
  }
  .home__fondo-barra {
    flex: 0 1 clamp(10px, 2.4vw, 28px);
    height: 100%;
    border-radius: 3px 3px 0 0;
    transform-origin: 50% 100%;
    background: linear-gradient(
      to top,
      rgba(255, 214, 150, 0.6) 0%,
      rgba(255, 246, 239, 0.16) 68%,
      rgba(255, 246, 239, 0) 100%
    );
  }
  /* Estado de reposo con silueta de ecualizador: el bucle de GSAP lo sobrescribe. */
  .home__fondo-barra:nth-child(1) {
    transform: scaleY(0.44);
  }
  .home__fondo-barra:nth-child(2) {
    transform: scaleY(0.68);
  }
  .home__fondo-barra:nth-child(3) {
    transform: scaleY(0.52);
  }
  .home__fondo-barra:nth-child(4) {
    transform: scaleY(0.86);
  }
  .home__fondo-barra:nth-child(5) {
    transform: scaleY(0.58);
  }
  .home__fondo-barra:nth-child(6) {
    transform: scaleY(0.74);
  }
  .home__fondo-barra:nth-child(7) {
    transform: scaleY(0.4);
  }

  /* Capa 3 · halo: `radial-gradient` puro, sin imágenes externas. */
  .home__fondo-halo {
    position: absolute;
    inset: 12% 18%;
    z-index: 3;
    border-radius: 50%;
    transform-origin: 50% 50%;
    mix-blend-mode: screen;
    pointer-events: none;
    opacity: 0.3;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(255, 240, 216, 0.58) 0%,
      rgba(255, 198, 120, 0.24) 38%,
      rgba(255, 246, 239, 0) 72%
    );
  }

  /* Sin soporte de mezcla, el tope de las overlays baja a 0.18 (Req 2.12). */
  @supports not (mix-blend-mode: plus-lighter) {
    .home__fondo-onda,
    .home__fondo-eq,
    .home__fondo-halo {
      opacity: 0.18;
    }
  }
</style>
