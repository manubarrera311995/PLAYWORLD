<script lang="ts">
  import { onMount } from "svelte";
  import Marca from "../../ui/Marca.svelte";
  import Boton from "../../ui/Boton.svelte";
  import CollageEdicion from "./CollageEdicion.svelte";
  import ClimaEmocional from "./ClimaEmocional.svelte";
  import { cargarTracks, edicionDe } from "../../datos/archivo";
  import type { Edicion, Track } from "../../datos/tipos";
  import { navigate, type RutaParsed } from "../director/router";
  import { tracksAPaleta } from "../../datos/color";
  import { aplicarPaleta } from "../../sketches/paleta";
  import { viewport } from "../../estado/viewport";

  type Props = { ruta?: RutaParsed };
  let { ruta }: Props = $props();
  const year = $derived(ruta && ruta.name === "edicion" ? ruta.year : 2013);

  let edicion = $state<Edicion | null>(null);
  let tracks = $state<Track[]>([]);
  const vp = $derived($viewport);

  onMount(() => {
    void (async () => {
      edicion = (await edicionDe(year)) ?? null;
      if (edicion?.hasDNA) {
        tracks = await cargarTracks(year);
        if (tracks.length) aplicarPaleta(tracksAPaleta(tracks.slice(0, 9)));
      }
    })();
  });
</script>

<section class="edicion">
  <header>
    <Marca texto={`FEP · ${year}`} />
    <h1 class="tipo-seccion">{year}</h1>
    {#if edicion}
      {#each edicion.tesis as line (line)}
        <p class="tesis">{line}</p>
      {/each}
    {:else}
      <p class="tesis">Memoria en construcción.</p>
    {/if}
  </header>
  <CollageEdicion {edicion} {tracks} carrusel={vp.modo === "compacto"} />
  <ClimaEmocional {edicion} />
  <footer>
    <Boton onclick={() => navigate("/ipod")}>Ahora es tu momento</Boton>
  </footer>
</section>

<style>
  .edicion {
    min-height: 100%;
    min-height: 100dvh;
    display: grid;
    gap: 18px;
    padding: var(--pad-y) var(--pad-x) 28px;
    align-content: start;
  }
  header { display: grid; gap: 8px; }
  .tesis { color: var(--ink-soft); max-width: 36ch; }
  footer { display: flex; justify-content: center; }
  @media (min-width: 1024px) {
    .edicion {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto 1fr auto;
    }
    header { grid-column: 1; }
    :global(.collage-ed) { grid-column: 2; grid-row: 1 / span 2; }
    footer { grid-column: 1 / -1; }
  }
</style>
