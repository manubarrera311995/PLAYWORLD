<script lang="ts">
  import FichaAnio from "./FichaAnio.svelte";
  import type { RutaParsed } from "../director/router";

  type Props = { ruta?: RutaParsed };
  let { ruta }: Props = $props();
  const year = $derived(ruta && ruta.name === "edicion" ? ruta.year : 2013);
</script>

<section class="edicion">
  {#key year}
    <FichaAnio {year} />
  {/key}
</section>

<style>
  .edicion {
    min-height: 100%;
    min-height: 100dvh;
  }
</style>
