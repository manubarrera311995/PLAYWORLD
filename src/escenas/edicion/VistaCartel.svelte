<script lang="ts">
  import copy from "./edicion.copy.json";
  import { fill, round } from "./ficha";
  import type { LecturaActos } from "./lectura";

  type Props = {
    lectura: LecturaActos;
    trait: string;
    selectedAct: string | null;
    selectedSong: string | null;
    onact: (prefix: string) => void;
    onsong: (id: string) => void;
  };
  let { lectura, trait, selectedAct, selectedSong, onact, onsong }: Props = $props();
</script>

<div class="vista">
  {#if !lectura.filas.length}
    <p class="vacio">{copy.tablero.empty}</p>
  {:else}
    <p class="intro">{fill(copy.tablero.cartelHint, { trait: trait.toLowerCase() })}</p>
    <div class="lista">
      {#each lectura.filas as fila (fila.prefix)}
        <div>
          <button
            type="button"
            class={["acto", selectedAct === fila.prefix && "is-on"]}
            aria-expanded={selectedAct === fila.prefix}
            onclick={() => onact(fila.prefix)}
          >
            <span class="nm">{fila.artist}</span>
            <span class="ct">{fila.n}</span>
            <span class="regla">
              {#if lectura.year != null}
                <i class="ano" style:left="{lectura.year}%"></i>
              {/if}
              <i class="marca" style:left="{fila.center}%"></i>
            </span>
            <span>{round(fila.center)}</span>
          </button>
          {#if selectedAct === fila.prefix}
            <div class="canciones">
              {#each fila.songs as song (song.id)}
                <button
                  type="button"
                  class={["cancion", selectedSong === song.id && "is-on"]}
                  onclick={() => onsong(song.id)}
                >
                  <span>{song.title}</span>
                  <span>{round(song.v)}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .vista { height: 100%; min-height: 0; display: flex; flex-direction: column; gap: 8px; }
  .intro, .vacio { margin: 0; color: var(--ink-mute); font-size: 12px; }
  .vacio { margin: auto; font-size: 14px; }
  .lista { min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 6px; }
  .acto {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) 36px minmax(80px, 1fr) 28px;
    gap: 10px;
    align-items: center;
    width: 100%;
    padding: 8px 10px;
    border: 0;
    border-radius: 12px;
    background: rgba(20, 8, 16, 0.28);
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .acto.is-on, .acto:hover { background: rgba(255, 246, 239, 0.08); }
  .nm { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
  .ct { color: var(--ink-mute); font-size: 12px; font-variant-numeric: tabular-nums; }
  .regla { position: relative; height: 8px; border-radius: 99px; background: rgba(255, 246, 239, 0.08); }
  .ano {
    position: absolute;
    top: -3px;
    width: 1px;
    height: 14px;
    background: rgba(255, 246, 239, 0.45);
  }
  .marca {
    position: absolute;
    top: 50%;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #e85a86;
    transform: translate(-50%, -50%);
  }
  .canciones { display: grid; gap: 2px; padding: 0 8px 8px 12px; }
  .cancion {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 4px 6px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--ink-soft);
    font: inherit;
    font-size: 12px;
    text-align: left;
    cursor: pointer;
  }
  .cancion:hover, .cancion.is-on { background: rgba(255, 246, 239, 0.08); color: var(--ink); }
</style>
