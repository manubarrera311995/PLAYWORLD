<script lang="ts">
  import copy from "./edicion.copy.json";
  import { colorGenero } from "./nube";

  type Artista = { prefix: string; artist: string; n: number; art: string | null };

  type Props = {
    q: string;
    genres: readonly string[];
    opciones: readonly string[];
    artistas: readonly Artista[];
    artist: string | null;
    filtrado: boolean;
    onq: (q: string) => void;
    ongenre: (label: string) => void;
    onartist: (prefix: string) => void;
    onhover: (prefix: string | null) => void;
    onclear: () => void;
  };
  let { q, genres, opciones, artistas, artist, filtrado, onq, ongenre, onartist, onhover, onclear }: Props = $props();
</script>

<aside class="panel">
  <label class="busca">
    <span aria-hidden="true">⌕</span>
    <input
      type="search"
      value={q}
      placeholder={copy.tablero.search}
      autocomplete="off"
      oninput={(e) => onq(e.currentTarget.value)}
    />
  </label>
  <p class="seccion">{copy.tablero.genres}</p>
  <div class="chips">
    {#each opciones as label (label)}
      <button
        type="button"
        class={["chip", genres.includes(label) && "is-on"]}
        aria-pressed={genres.includes(label)}
        onclick={() => ongenre(label)}
      >
        <i style:background={colorGenero(label)}></i>{label}
      </button>
    {/each}
  </div>
  <p class="seccion">{copy.tablero.artists}</p>
  <div class="artistas" role="list">
    {#each artistas as fila (fila.prefix)}
      <button
        type="button"
        class={["acto", artist === fila.prefix && "is-on"]}
        aria-pressed={artist === fila.prefix}
        onpointerenter={() => onhover(fila.prefix)}
        onpointerleave={() => onhover(null)}
        onclick={() => onartist(fila.prefix)}
      >
        <span class="avatar">
          {#if fila.art}
            <img alt="" src={fila.art} />
          {:else}
            {fila.artist.slice(0, 1)}
          {/if}
        </span>
        <span class="nm">{fila.artist}</span>
        <span class="ct">{fila.n}</span>
      </button>
    {/each}
  </div>
  {#if filtrado}
    <button type="button" class="limpiar" onclick={onclear}>{copy.tablero.clear}</button>
  {/if}
</aside>

<style>
  .panel {
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 14px;
    overflow: hidden;
    border-radius: 22px;
    border: 1px solid rgba(255, 246, 239, 0.16);
    background: rgba(16, 8, 14, 0.46);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
  .busca { position: relative; display: block; }
  .busca span {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-54%);
    color: var(--ink-mute);
    font-size: 14px;
    pointer-events: none;
  }
  input {
    width: 100%;
    border-radius: 999px;
    border: 1px solid rgba(255, 246, 239, 0.16);
    background: rgba(255, 246, 239, 0.04);
    color: inherit;
    font: inherit;
    font-size: 13px;
    padding: 8px 12px 8px 30px;
  }
  input::placeholder { color: var(--ink-mute); }
  .seccion { margin: 14px 0 8px; color: var(--ink-soft); font-size: 12px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 246, 239, 0.16);
    background: transparent;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  .chip i { width: 8px; height: 8px; border-radius: 50%; }
  .chip.is-on { background: rgba(255, 246, 239, 0.14); border-color: rgba(255, 246, 239, 0.4); }
  .artistas {
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-right: -6px;
    padding-right: 4px;
  }
  .acto {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
    width: 100%;
    padding: 5px 6px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .acto:hover, .acto.is-on { background: rgba(255, 246, 239, 0.08); }
  .avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    overflow: hidden;
    background: #5a2438;
    display: grid;
    place-items: center;
    font-size: 9px;
  }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .nm { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
  .ct { color: var(--ink-mute); font-size: 12px; font-variant-numeric: tabular-nums; }
  .limpiar {
    margin-top: 8px;
    align-self: flex-start;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-mute);
    font: inherit;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .limpiar:hover { color: var(--ink); }
</style>
