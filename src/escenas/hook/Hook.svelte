<script lang="ts">
  import copy from "./hook.copy.json";
  import Marca from "../../ui/Marca.svelte";
  import Chip from "../../ui/Chip.svelte";
  import Boton from "../../ui/Boton.svelte";
  import { navigate } from "../director/router";
  import { parcheRecorrido } from "../../estado/recorrido";
  import { viewport } from "../../estado/viewport";
  import type { RutaParsed } from "../director/router";

  type Props = { ruta?: RutaParsed };
  let { ruta: _ruta }: Props = $props();
  let elegido = $state<string | null>(null);
  const vp = $derived($viewport);

  function elegir(id: string): void {
    elegido = id;
    parcheRecorrido({ yearHint: Number(id) });
  }
</script>

<section class={["hook", vp.corto && "hook--corto"]}>
  <header><Marca texto={copy.brand} /></header>
  <div class="hook__main">
    <h1 class="tipo-pregunta">{copy.question}</h1>
    <div class="chips">
      {#each copy.chips as chip (chip.id)}
        <Chip on={elegido === chip.id} onclick={() => elegir(chip.id)}>{chip.label}</Chip>
      {/each}
    </div>
    <Boton
      disabled={!elegido}
      onclick={() => elegido && navigate(`/archivo?y=${elegido}`)}
    >
      {copy.cta}
    </Boton>
  </div>
</section>

<style>
  .hook {
    min-height: 100%;
    min-height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr;
    padding: var(--pad-y) var(--pad-x);
  }
  .hook__main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: clamp(28px, 6vh, 56px);
  }
  .chips {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: min(100%, 420px);
  }
  .hook--corto .chips {
    display: flex;
    overflow-x: auto;
    width: 100%;
  }
  @media (min-width: 1024px) {
    .chips {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      width: auto;
    }
  }
</style>
