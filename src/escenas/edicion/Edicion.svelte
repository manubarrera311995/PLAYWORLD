<script lang="ts">
  import { onMount } from "svelte";
  import FichaAnio from "./FichaAnio.svelte";
  import { cargarEdiciones } from "../../datos/archivo";
  import type { RutaParsed } from "../director/router";

  type Props = { ruta?: RutaParsed };
  let { ruta }: Props = $props();
  const year = $derived(ruta && ruta.name === "edicion" ? ruta.year : 2013);
  let anios = $state<number[]>([]);

  onMount(() => {
    void cargarEdiciones().then((eds) => {
      anios = eds.filter((e) => e.hasDNA).map((e) => e.year);
    });
  });
</script>

<section class="edicion">
  {#key year}
    <FichaAnio {year} {anios} />
  {/key}
</section>

<style>
  .edicion {
    min-height: 100%;
    min-height: 100dvh;
  }
</style>
