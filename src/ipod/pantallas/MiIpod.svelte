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

<Lista items={seleccion} {cursor} {onsaltar} vacio="Todavía vacío." />
