<script lang="ts">
  import type { Edicion, Track } from "../../datos/tipos";
  import { artUrl } from "../../datos/color";

  type Props = { edicion: Edicion | null; tracks: Track[]; carrusel: boolean };
  let { edicion, tracks, carrusel }: Props = $props();

  const shards = $derived(
    (edicion?.collage ?? []).map((c) => ({
      ...c,
      track: tracks.find((t) => t.id === c.trackId),
    })),
  );
</script>

<div class={["collage-ed", carrusel && "is-carrusel"]}>
  {#if !edicion?.hasDNA}
    <p>Memoria en construcción.</p>
  {:else}
    {#each shards as s, i (s.trackId + i)}
      <article class="shard vidrio">
        {#if s.track?.art}
          <img src={artUrl(s.track.art, "300") ?? ""} alt="" loading="lazy" decoding="async" />
        {/if}
        <p>{s.porQue}</p>
      </article>
    {/each}
  {/if}
</div>

<style>
  .collage-ed {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .is-carrusel {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 12px;
  }
  .is-carrusel article {
    min-width: 72%;
    scroll-snap-align: start;
  }
  article { min-height: 120px; padding: 10px; }
  img { width: 100%; height: 88px; object-fit: cover; }
  p { font-size: 12px; margin-top: 8px; color: var(--ink-soft); }
</style>
