<script lang="ts">
  import { ALMA_IDS, almas, type AlmaId } from "../../almas/almas";
  import Chip from "../../ui/Chip.svelte";
  import copy from "./colectiva.copy.json";

  type Props = {
    actual: AlmaId | "all";
    mia: AlmaId | null;
    onchange: (id: AlmaId | "all") => void;
  };
  let { actual, mia, onchange }: Props = $props();
</script>

<div class="filtros">
  <Chip on={actual === "all"} onclick={() => onchange("all")}>{copy.filtroTodas}</Chip>
  {#if mia}
    <Chip on={actual === mia} onclick={() => onchange(mia)}>{copy.filtroMia}</Chip>
  {/if}
  {#each ALMA_IDS as id (id)}
    <Chip on={actual === id} onclick={() => onchange(id)}>{almas[id].corto}</Chip>
  {/each}
</div>

<style>
  .filtros {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 6px;
  }
</style>
