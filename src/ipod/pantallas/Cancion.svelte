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
    <img src={art} alt="" width="96" height="96" />
  {/if}
  <p class="art">{track.artist}</p>
  <h2>{track.track}</h2>
  <p class="y">{track.year}</p>
  <button type="button" onclick={onmeter} disabled={!metida && llena}>
    {metida ? copy.quitar : llena ? copy.lleno : copy.meter}
  </button>
</div>

<style>
  .cancion { display: grid; justify-items: start; gap: 6px; }
  h2 { font-size: 16px; font-weight: 500; }
  .art, .y { font-size: 12px; opacity: 0.75; }
  button {
    margin-top: 8px;
    border: 0;
    background: rgba(20, 40, 16, 0.4);
    color: inherit;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
  }
  button:disabled { opacity: 0.4; }
  img { border-radius: 4px; }
</style>
