<script lang="ts">
  import { round } from "./ficha";
  import type { LecturaActos } from "./lectura";
  import copy from "./edicion.copy.json";

  type Props = {
    lectura: LecturaActos;
    trait: string;
    selectedAct: string | null;
    selectedSong: string | null;
    onact: (prefix: string) => void;
    onsong: (id: string) => void;
  };
  let { lectura, trait, selectedAct, selectedSong, onact, onsong }: Props = $props();

  function meta(song: LecturaActos["filas"][number]["songs"][number]): string {
    return [song.scale, song.note, song.tempo != null ? `${round(song.tempo)} bpm` : "", song.genre]
      .filter(Boolean)
      .join(" · ");
  }
</script>

<div class="actos">
  <div class="cols" aria-hidden="true">
    <span>{copy.actsCols.artist}</span>
    <span>{copy.actsCols.songs}</span>
    <span></span>
    <span>{trait}</span>
  </div>

  <ul class="filas">
    {#each lectura.filas as fila (fila.prefix)}
      {@const on = selectedAct === fila.prefix}
      <li id={`acto-${fila.prefix}`} class={[on && "is-on", fila.thin && "is-thin"]}>
        <button
          type="button"
          class="row"
          aria-expanded={on}
          aria-controls={on ? `canciones-${fila.prefix}` : undefined}
          onclick={() => onact(fila.prefix)}
        >
          <span class="name">{fila.artist}</span>
          <span class="count">{fila.n}</span>
          <span class="track" aria-hidden="true">
            <span class="fill" style:width={`${Math.max(0, Math.min(100, fila.center))}%`}></span>
          </span>
          <span class="val">{round(fila.center)}</span>
        </button>
        {#if on}
          <ul id={`canciones-${fila.prefix}`} class="songs">
            {#each fila.songs as song (song.id)}
              <li>
                <button
                  type="button"
                  class={["song", selectedSong === song.id && "is-on"]}
                  aria-pressed={selectedSong === song.id}
                  onclick={() => onsong(song.id)}
                >
                  <span class="title">{song.title}</span>
                  <span class="song-meta">{meta(song)}</span>
                  <span class="song-val">{round(song.v)}</span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .cols,
  .count,
  .song-meta {
    color: var(--ink-mute);
    font-size: 13px;
    line-height: 1.45;
  }
  .cols,
  button.row {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) 4.5ch minmax(72px, 0.8fr) 3ch;
    gap: 12px;
    align-items: center;
  }
  .cols {
    margin-bottom: 4px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .filas {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    scroll-margin-top: 72px;
    border-bottom: 1px solid rgba(255, 246, 239, 0.14);
  }
  button {
    width: 100%;
    padding: 10px 0;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  button:focus-visible {
    outline: 1px solid var(--c1);
    outline-offset: 2px;
  }
  .name,
  .title {
    color: var(--ink-soft);
    font-size: 14px;
    line-height: 1.3;
  }
  .count,
  .val,
  .song-val {
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .val,
  .song-val {
    color: var(--ink);
    font-size: 14px;
  }
  .track {
    display: block;
    height: 8px;
    background: rgba(255, 246, 239, 0.08);
  }
  .fill {
    display: block;
    height: 100%;
    background: rgba(255, 246, 239, 0.7);
  }
  li.is-on .name,
  li.is-on .val {
    color: var(--ink);
  }
  li.is-on .fill {
    background: var(--c1);
  }
  li.is-thin .name,
  li.is-thin .count,
  li.is-thin .val {
    color: rgba(255, 246, 239, 0.45);
  }
  .songs {
    list-style: none;
    margin: 0 0 12px;
    padding: 0 0 4px;
  }
  button.song {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) 3ch;
  gap: 12px;
  align-items: baseline;
  padding: 6px 0 6px 12px;
}
  button.song.is-on .title,
  button.song.is-on .song-val {
    color: var(--c1);
  }
  @media (max-width: 700px) {
    .cols {
      display: none;
    }
    button.row {
      grid-template-columns: minmax(0, 1fr) auto auto;
    }
    .track {
      display: none;
    }
    button.song {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        "title val"
        "meta meta";
    }
    .title {
      grid-area: title;
    }
    .song-meta {
      grid-area: meta;
    }
    .song-val {
      grid-area: val;
    }
  }
</style>
