<script lang="ts">
  import type { Track } from "../../datos/tipos";
  import { artUrl } from "../../datos/color";
  import { viewport } from "../../estado/viewport";

  type Props = { propias: Track[]; ecos: Track[] };
  let { propias, ecos }: Props = $props();
  const cells = $derived([...propias, ...ecos].slice(0, 9));
  const vp = $derived($viewport);
</script>

<div class={["grid", vp.ancho < 360 && "is-list"]}>
  {#each cells as t, i (t.id + i)}
    <figure>
      {#if t.art}
        <img src={artUrl(t.art, "300") ?? ""} alt="" width="120" height="120" loading="lazy" />
      {/if}
      <figcaption>{t.artist}</figcaption>
    </figure>
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    width: min(100%, 420px);
  }
  .is-list { grid-template-columns: 1fr; }
  figure { margin: 0; }
  img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px; }
  figcaption { font-size: 11px; margin-top: 4px; color: var(--ink-mute); }
  @media (max-width: 767px) {
    img { max-width: 96px; }
    .grid { justify-items: start; }
  }
</style>
