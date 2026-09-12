<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { recorrido } from "../../estado/recorrido";
  import { almas } from "../../almas/almas";
  import { ecosDelArchivo } from "../../almas/motor";
  import { cargarPool } from "../../datos/pool";
  import { aplicarPaleta } from "../../sketches/paleta";
  import { paletaDeAlma } from "../../almas/almas";
  import EcosDelArchivo from "./EcosDelArchivo.svelte";
  import Revelado from "./Revelado.svelte";
  import Boton from "../../ui/Boton.svelte";
  import Marca from "../../ui/Marca.svelte";
  import { navigate, type RutaParsed } from "../director/router";
  import type { Track } from "../../datos/tipos";

  type Props = { ruta?: RutaParsed };
  let { ruta: _ruta }: Props = $props();
  const rec = $derived($recorrido);
  const alma = $derived(rec.alma ? almas[rec.alma.principal] : null);
  const eco = $derived(rec.alma ? almas[rec.alma.eco] : null);
  let ecos = $state<Track[]>([]);

  onMount(() => {
    const r = get(recorrido);
    if (r.alma) aplicarPaleta(paletaDeAlma(r.alma.principal));
    void cargarPool().then((pool) => {
      if (r.seleccion && r.alma) {
        ecos = ecosDelArchivo(r.seleccion.tracks, pool, r.alma.principal, 4);
      }
    });
  });
</script>

<section class="creacion">
  <Revelado />
  <header>
    <Marca />
    {#if alma}
      <p class="eyebrow">con algo de {eco?.corto ?? ""}</p>
      <h1 class="tipo-seccion">{alma.nombre}</h1>
      <p class="tipo-cuerpo">{alma.texto}</p>
    {/if}
  </header>
  {#if rec.seleccion}
    <EcosDelArchivo propias={rec.seleccion.tracks} {ecos} />
  {/if}
  <footer>
    <Boton onclick={() => navigate("/colectiva")}>Ver la colectiva</Boton>
  </footer>
</section>

<style>
  .creacion {
    position: relative;
    min-height: 100%;
    min-height: 100dvh;
    display: grid;
    gap: 20px;
    padding: var(--pad-y) var(--pad-x) 32px;
    align-content: start;
  }
  header { display: grid; gap: 10px; max-width: 40ch; }
  footer { display: flex; justify-content: center; }
</style>
