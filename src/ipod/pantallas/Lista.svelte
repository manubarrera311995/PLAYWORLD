<script lang="ts">
  import type { Track } from "../../datos/tipos";

  type Props = {
    items: Array<string | Track>;
    cursor: number;
    onsaltar: (i: number) => void;
    metidas?: string[];
    vacio?: string;
    /** Si llega, la barra filtra esta lista. Sin ella, la lista se ve como antes. */
    q?: string;
    onfiltrar?: (q: string) => void;
    placeholder?: string;
  };
  let { items, cursor, onsaltar, metidas, vacio, q = "", onfiltrar, placeholder = "Buscar" }: Props = $props();
  let texto = $state(q);
  const marcas = $derived(new Set(metidas ?? []));
  const mostrarMarcas = $derived(metidas != null);

  function esTrack(it: string | Track): it is Track {
    return typeof it !== "string";
  }

  function metida(it: string | Track): boolean {
    return esTrack(it) && marcas.has(it.id);
  }

  function seguir(indice: number) {
    return (el: HTMLElement) => {
      el.querySelectorAll<HTMLElement>(".row")[indice]?.scrollIntoView({ block: "nearest" });
    };
  }
</script>

<div class="panel">
  {#if onfiltrar}
    <form
      class="buscar"
      onsubmit={(ev) => {
        ev.preventDefault();
        if (items.length > 0) onsaltar(Math.min(cursor, items.length - 1));
      }}
      onpointerdown={(ev) => ev.stopPropagation()}
      onpointerup={(ev) => ev.stopPropagation()}
    >
      <input
        type="text"
        value={texto}
        {placeholder}
        aria-label={placeholder}
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        enterkeyhint="search"
        oninput={(ev) => {
          texto = ev.currentTarget.value;
          onfiltrar?.(texto);
        }}
        onkeydown={(ev) => {
          if (ev.key === "Escape") ev.currentTarget.blur();
        }}
      />
    </form>
  {/if}
{#if items.length === 0 && vacio}
  <p class="vacio">{vacio}</p>
{:else}
  <ul class="lista" {@attach seguir(cursor)}>
    {#each items as it, i (typeof it === "string" ? it : it.id)}
      <li>
        <button
          class={["row", esTrack(it) && "row--song", i === cursor && "is-on"]}
          type="button"
          onclick={() => onsaltar(i)}
        >
          {#if esTrack(it)}
            <span class="song">
              <span class="titulo">{it.track}</span>
              <span class="artista">{it.artist}</span>
            </span>
            {#if mostrarMarcas && metida(it)}
              <span class="mark" aria-hidden="true">✓</span>
              <span class="sr">en tu iPod</span>
            {/if}
          {:else}
            <span class="name">{it}</span>
            <span class="chev" aria-hidden="true">›</span>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
{/if}
</div>

<style>
  .panel { min-width: 0; }
  .buscar {
    position: sticky;
    top: 0;
    z-index: 1;
    margin: 0;
    padding: 5px 7px 4px;
    background: #f4f4f4;
    border-bottom: 1px solid #c6c6c6;
  }
  .buscar input {
    width: 100%;
    box-sizing: border-box;
    height: 22px;
    border: 1px solid #8a8a8a;
    border-radius: 4px;
    background: linear-gradient(180deg, #ffffff 0%, #e6e6e6 100%);
    box-shadow:
      inset 0 1px 2px rgba(0, 0, 0, 0.28),
      inset 0 0 0 1px rgba(255, 255, 255, 0.65);
    padding: 0 6px;
    color: #111;
    caret-color: #1c62d6;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 12px;
    line-height: 20px;
    appearance: none;
  }
  .buscar input:focus {
    outline: none;
    border-color: #1c62d6;
  }
  .buscar input::placeholder {
    color: #8d8d8d;
    font-weight: 500;
  }
  .panel:has(.buscar) .row { scroll-margin-top: 36px; }
  .vacio {
    margin: 0;
    padding: 16px 12px;
    color: #111;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.35;
  }
  .lista { list-style: none; margin: 0; padding: 0; min-width: 0; }
  .row {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    text-align: left;
    border: 0;
    border-bottom: 1px solid #c6c6c6;
    background: #fbfbfb;
    padding: 5px 8px 6px;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    cursor: pointer;
    color: #111;
    position: relative;
  }
  .lista li:nth-child(even) .row--song {
    background: #eef1f5;
  }
  .song {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .titulo,
  .artista,
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .titulo {
    font-size: 13px;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }
  .artista {
    margin-top: 1px;
    font-size: 11px;
    font-weight: 500;
    line-height: 1.15;
    color: #2a2a2a;
  }
  .name {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    line-height: 1.25;
  }
  .mark {
    flex: none;
    font-size: 12px;
    font-weight: 700;
    color: #1c62d6;
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
  .chev { flex: none; color: #8d8d8d; font-size: 16px; line-height: 1; }
  .lista li .row.is-on {
    background: linear-gradient(180deg, #7ec0ff 0%, #3d8ef0 22%, #1d68d8 58%, #165ec4 100%);
    color: #fff;
    border-bottom-color: #124fa8;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
  }
  .lista li .row.is-on .artista,
  .lista li .row.is-on .chev,
  .lista li .row.is-on .mark { color: #fff; }
</style>
