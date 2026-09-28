<script lang="ts">
  import type { Track } from "../../datos/tipos";
  import { artUrl } from "../../datos/color";
  import { giroDe } from "./frase";

  type Props = {
    propias: Track[];
    ecos: Track[];
    rotulos: Record<string, string>;
  };
  let { propias, ecos, rotulos }: Props = $props();

  function portada(t: Track): string | null {
    return artUrl(t.art, "300");
  }
</script>

<div class="mesa">
  <ul class="propias" aria-label="Tu selección">
    {#each propias as t, i (t.id + i)}
      {@const src = portada(t)}
      <li style:--giro={giroDe(t.id)}>
        <figure>
          {#if src}
            <img {src} alt="" width="300" height="300" loading="lazy" />
          {:else}
            <span class="sin-arte"></span>
          {/if}
          <figcaption>
            <span class="tema">{t.track}</span>
            <span class="artista">{t.artist}</span>
            {#if rotulos[t.id]}
              <span class="extremo">{rotulos[t.id]}</span>
            {/if}
          </figcaption>
        </figure>
      </li>
    {/each}
  </ul>
  {#if ecos.length}
    <p class="kicker">el archivo te devuelve</p>
    <ul class="ecos" aria-label="El archivo te devuelve">
      {#each ecos as t, i (t.id + i)}
        {@const src = portada(t)}
        <li>
          <figure>
            {#if src}
              <img {src} alt="" width="300" height="300" loading="lazy" />
            {:else}
              <span class="sin-arte"></span>
            {/if}
            <figcaption>{t.artist}</figcaption>
          </figure>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .mesa {
    display: grid;
    gap: 16px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  figure { margin: 0; }
  .propias {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 14px 10px;
    padding-top: 6px;
  }
  .propias li {
    width: calc(33.33% - 10px);
    max-width: 124px;
    rotate: calc(var(--giro) * 1deg);
  }
  .propias img,
  .propias .sin-arte {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    background: #e4dcd2;
  }
  .tema,
  .artista,
  .extremo,
  .ecos figcaption {
    display: block;
  }
  .tema {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.25;
    color: #241628;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
  .artista,
  .ecos figcaption {
    margin-top: 2px;
    font-size: 11px;
    line-height: 1.3;
    color: rgba(36, 22, 40, 0.62);
  }
  .extremo {
    margin-top: 4px;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8a2458;
  }
  .kicker {
    margin: 4px 0 0;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-indent: 0.22em;
    text-transform: uppercase;
    text-align: center;
    color: rgba(36, 22, 40, 0.55);
  }
  .ecos {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px 8px;
  }
  .ecos li { width: 72px; }
  .ecos img,
  .ecos .sin-arte {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    background: #e4dcd2;
    filter: saturate(0.72);
  }
  @media (max-width: 767px) {
    .propias li { rotate: calc(var(--giro) * 0.45deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .propias li { rotate: none; }
  }
</style>
