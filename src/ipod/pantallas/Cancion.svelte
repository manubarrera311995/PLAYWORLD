<script lang="ts">
  import type { Track } from "../../datos/tipos";
  import { artUrl } from "../../datos/color";
  import copy from "../ipod.copy.json";

  type Props = {
    track: Track;
    metida: boolean;
    llena: boolean;
    onmeter: () => void;
  };
  let { track, metida, llena, onmeter }: Props = $props();
  const art = $derived(artUrl(track.art, "300"));
</script>

<div class="cancion">
  {#if art}
    <img src={art} alt="" width="72" height="72" />
  {/if}
  <div class="meta">
    <p class="art">{track.artist}</p>
    <h2>{track.track}</h2>
    <p class="y">{track.year}</p>
  </div>
  <button type="button" onclick={onmeter} disabled={!metida && llena}>
    {metida ? copy.quitar : llena ? copy.lleno : copy.meter}
  </button>
</div>

<style>
  .cancion {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    grid-template-areas:
      "art meta"
      "btn btn";
    align-items: center;
    gap: 8px;
    padding: 8px;
    color: #111;
    font-family: Inter, Helvetica, Arial, sans-serif;
  }
  .meta { grid-area: meta; min-width: 0; }
  h2 {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
  }
  .art, .y {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: #4a4a4a;
  }
  button {
    grid-area: btn;
    width: 100%;
    border: 0;
    background: linear-gradient(180deg, #6aafff 0%, #2d78e8 42%, #1c62d6 100%);
    color: #fff;
    padding: 7px 12px;
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
  }
  button:disabled {
    background: #d5d5d5;
    color: #6e6e6e;
    cursor: default;
  }
  .cancion:not(:has(img)) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "meta"
      "btn";
  }
  img {
    grid-area: art;
    width: 72px;
    height: 72px;
    object-fit: cover;
    border-radius: 2px;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.18);
  }
</style>
