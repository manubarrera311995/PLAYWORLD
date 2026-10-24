<script lang="ts">
  import { onMount } from "svelte";
  import rollo from "./rollo.json";
  import { cargarEdiciones, cargarTracks } from "../../datos/archivo";
  import { artUrl } from "../../datos/color";

  /**
   * Solo tomas con imagen. En el rollo, 03–07, 09–10, 12–15, 19 y 29–47
   * (salvo 35 y 40) son JPEG negros: cada píxel vale 0.
   */
  const cortes = [1, 2, 16, 18, 20, 22, 28, 40] as const;

  const fotos = cortes.flatMap((n) => {
    const toma = rollo[n - 1];
    return toma ? [toma.src] : [];
  });

  type Card = { year: number; art: string | null };
  type Props = {
    lado?: "izq" | "der";
    origen?: "fotos" | "caratulas";
    cards?: Card[];
  };
  let { lado = "izq", origen = "fotos", cards = [] }: Props = $props();

  let raiz: HTMLDivElement | undefined = $state();
  let caratulas = $state<string[]>([]);
  const piezas = $derived(origen === "caratulas" ? caratulas : fotos);

  onMount(() => {
    if (origen !== "caratulas") return;
    let dead = false;
    void (async () => {
      const eds = await cargarEdiciones();
      if (dead) return;
      const urls = (
        await Promise.all(
          eds
            .filter((e) => e.hasDNA)
            .map(async (e) => {
              const tracks = await cargarTracks(e.year);
              const preferido = e.collage[0]?.trackId;
              const t =
                tracks.find((x) => x.id === preferido && x.art) ?? tracks.find((x) => x.art);
              return artUrl(t?.art ?? null, "640");
            }),
        )
      ).filter((src): src is string => Boolean(src));
      if (dead) return;
      caratulas = urls.length ? urls : cards.flatMap((c) => (c.art ? [c.art] : []));
      queueMicrotask(() => raiz?.dispatchEvent(new Event("cargada")));
    })();
    return () => {
      dead = true;
    };
  });
</script>

<div
  class="tira"
  class:tira--der={lado === "der"}
  class:tira--caratulas={origen === "caratulas"}
  bind:this={raiz}
  aria-hidden="true"
>
  <div class="tira__pista">
    {#each piezas as src (src)}
      <figure>
        <img {src} alt="" draggable="false" />
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
  .tira--der {
    left: auto;
    top: 0;
    right: clamp(16px, 3vw, 56px);
    height: 100dvh;
    opacity: 0;
    visibility: hidden;
  }
  .tira--der figure:nth-child(odd) {
    margin-right: 0;
    margin-left: auto;
  }
  .tira--caratulas figure {
    aspect-ratio: 1;
  }

  :global(.home.is-quieto) .tira,
  :global(.home.is-quieto) .tira--der {
    position: relative;
    top: auto;
    left: auto;
    right: auto;
    width: min(100%, 520px);
    height: auto;
    margin: 18px 0 0;
    overflow: visible;
    opacity: 1;
    visibility: visible;
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
    .tira--der {
      left: auto;
      top: 0;
      right: 12px;
      width: 40vw;
      height: 100dvh;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tira,
    .tira--der {
      position: relative;
      top: auto;
      left: auto;
      right: auto;
      width: min(100%, 520px);
      height: auto;
      margin: 18px 0 0;
      overflow: visible;
      opacity: 1;
      visibility: visible;
    }
    figure:nth-child(n + 3) {
      display: none;
    }
  }
</style>
