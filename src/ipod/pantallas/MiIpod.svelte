<script lang="ts">
  import Lista from "./Lista.svelte";
  import type { Track } from "../../datos/tipos";

  type Props = {
    seleccion: Track[];
    cursor: number;
    onsaltar: (i: number) => void;
  };
  let { seleccion, cursor, onsaltar }: Props = $props();
</script>

<Lista titulo="Mi iPod" items={seleccion} {cursor} {onsaltar} />
{#if seleccion.length === 0}
  <p class="vacio">Todavía vacío.</p>
{/if}

<style>
  .vacio { margin-top: 12px; font-size: 13px; opacity: 0.7; }
</style>
