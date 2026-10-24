<script lang="ts">
  import rollo from "./rollo.json";

  /**
   * Solo tomas con imagen. En el rollo, 03–07, 09–10, 12–15, 19 y 29–47
   * (salvo 35 y 40) son JPEG negros: cada píxel vale 0.
   */
  const cortes = [1, 2, 16, 18, 20, 22, 28, 40] as const;

  const fotos = cortes.flatMap((n) => {
    const toma = rollo[n - 1];
    return toma ? [toma] : [];
  });
</script>

<div class="tira" aria-hidden="true">
  <div class="tira__pista">
    {#each fotos as foto (foto.src)}
      <figure>
        <img src={foto.src} alt="" draggable="false" />
      </figure>
    {/each}
  </div>
</div>

<style>
  .tira {
    position: fixed;
    left: clamp(16px, 3vw, 56px);
    bottom: 0;
    z-index: 2;
    width: min(34vw, 480px);
    height: 100dvh;
    overflow: hidden;
    pointer-events: none;
  }
  .tira__pista {
    display: flex;
    flex-direction: column;
    gap: 16px;
    will-change: transform;
  }
  figure {
    margin: 0;
    width: 100%;
    aspect-ratio: 3 / 2;
    overflow: hidden;
    border-radius: 6px;
  }
  figure:nth-child(odd) {
    width: 86%;
    margin-right: auto;
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    user-select: none;
  }

  :global(.home.is-quieto) .tira {
    position: relative;
    top: auto;
    left: auto;
    width: min(100%, 520px);
    height: auto;
    margin: 18px 0 0;
    overflow: visible;
  }
  :global(.home.is-quieto) figure:nth-child(n + 3) {
    display: none;
  }

  @media (max-width: 767px) {
    .tira {
      left: 12px;
      bottom: 0;
      width: 42vw;
      height: 100dvh;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tira {
      position: relative;
      top: auto;
      left: auto;
      width: min(100%, 520px);
      height: auto;
      margin: 18px 0 0;
      overflow: visible;
    }
    figure:nth-child(n + 3) {
      display: none;
    }
  }
</style>
