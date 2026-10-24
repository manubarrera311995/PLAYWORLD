<script lang="ts">
  import rollo from "./rollo.json";

  /** Siete copias sueltas. El hueco del centro es donde se sienta la cámara. */
  const cortes = [
    { n: 1, x: "0%", y: "0%", w: "40%", r: -4, z: 2, ratio: "3 / 4" },
    { n: 22, x: "48%", y: "-2%", w: "50%", r: 3, z: 3, ratio: "3 / 4" },
    { n: 15, x: "-2%", y: "44%", w: "36%", r: 5, z: 1, ratio: "3 / 4" },
    { n: 20, x: "56%", y: "40%", w: "42%", r: -3, z: 4, ratio: "3 / 4" },
    { n: 21, x: "6%", y: "70%", w: "44%", r: -2, z: 3, ratio: "3 / 4" },
    { n: 7, x: "50%", y: "72%", w: "38%", r: 6, z: 2, ratio: "1 / 1" },
  ] as const;

  const piezas = cortes.flatMap((corte) => {
    const toma = rollo[corte.n];
    if (!toma) return [];
    return [{ ...corte, src: toma.src, alt: toma.alt }];
  });
</script>

<div class="pila">
  {#each piezas as pieza (pieza.src)}
    <figure
      style:left={pieza.x}
      style:top={pieza.y}
      style:width={pieza.w}
      style:z-index={pieza.z}
      style:aspect-ratio={pieza.ratio}
      style:rotate="{pieza.r}deg"
    >
      <img src={pieza.src} alt={pieza.alt} draggable="false" />
    </figure>
  {/each}
  <span class="hueco" aria-hidden="true"></span>
</div>

<style>
  .pila {
    position: relative;
    width: 100%;
    height: 100%;
  }
  figure {
    position: absolute;
    margin: 0;
    overflow: hidden;
    border-radius: 2px;
    box-shadow: 0 16px 34px rgba(20, 0, 40, 0.32);
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    user-select: none;
  }
  .hueco {
    position: absolute;
    left: 34%;
    top: 34%;
    width: 30%;
    aspect-ratio: 2552 / 1702;
    pointer-events: none;
  }
</style>
