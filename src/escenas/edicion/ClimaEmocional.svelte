<script lang="ts">
  import type { Edicion } from "../../datos/tipos";

  type Props = { edicion: Edicion | null };
  let { edicion }: Props = $props();
  const bars = $derived([
    edicion?.stats.mediana.nostalgia ?? 40,
    edicion?.stats.mediana.oscuridad ?? 40,
    edicion?.stats.mediana.energy ?? 40,
  ]);
</script>

<div class="clima" aria-hidden="true">
  {#each bars as b, i (i)}
    <span style:height={`${Math.max(8, b)}%`}></span>
  {/each}
</div>

<style>
  .clima {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 56px;
    opacity: 0.7;
  }
  span {
    flex: 1;
    background: linear-gradient(to top, var(--c3), var(--c1));
    border-radius: 2px 2px 0 0;
  }
</style>
