<script lang="ts">
  import { onDestroy } from "svelte";
  import copy from "./hook.copy.json";
  import { fill, resolverPuerta, type Revelado } from "./anio";
  import Marca from "../../ui/Marca.svelte";
  import Eyebrow from "../../ui/Eyebrow.svelte";
  import Chip from "../../ui/Chip.svelte";
  import Boton from "../../ui/Boton.svelte";
  import { navigate } from "../director/router";
  import { parcheRecorrido } from "../../estado/recorrido";
  import { reduce } from "../../motion/reducedMotion";
  import type { RutaParsed } from "../director/router";

  type Props = { ruta?: RutaParsed };
  let { ruta: _ruta }: Props = $props();

  const total = copy.questions.length;
  let paso = $state(0);
  let respuestas = $state<string[]>(Array.from({ length: total }, () => ""));
  let puerta = $state<Revelado | null>(null);
  let timer = 0;

  const pregunta = $derived(copy.questions[paso]);
  const elegido = $derived(respuestas[paso] || null);

  onDestroy(() => clearTimeout(timer));

  function responder(id: string): void {
    respuestas[paso] = id;
    clearTimeout(timer);
    const wait = $reduce ? 0 : 180;
    timer = window.setTimeout(() => {
      if (paso < total - 1) {
        paso += 1;
        return;
      }
      const next = resolverPuerta(respuestas, copy.pesos, copy.desempate, copy.revelados);
      puerta = next;
      parcheRecorrido({ yearHint: next.year });
    }, wait);
  }

  function atras(): void {
    clearTimeout(timer);
    if (puerta) {
      puerta = null;
      return;
    }
    if (paso > 0) paso -= 1;
  }
</script>

<section class="hook">
  <header><Marca texto={copy.brand} /></header>
  <div class="hook__main">
    {#if puerta}
      <Eyebrow texto={copy.revealEyebrow} />
      <h1 class="tipo-hero hook__anio">{puerta.year}</h1>
      <p class="tipo-cuerpo">{puerta.linea}</p>
      <Boton
        onclick={() => {
          const y = puerta?.year;
          if (y) navigate(`/archivo?y=${y}`);
        }}
      >{copy.cta}</Boton>
      <button class="hook__atras" type="button" onclick={atras}>{copy.atras}</button>
    {:else if pregunta}
      <Eyebrow texto={fill(copy.paso, { n: String(paso + 1).padStart(2, "0"), total: String(total).padStart(2, "0") })} />
      {#key pregunta.id}
        <h1 class="tipo-pregunta" id="hook-q">{pregunta.text}</h1>
        <div class="chips" role="radiogroup" aria-labelledby="hook-q">
          {#each pregunta.options as opt (opt.id)}
            <Chip on={elegido === opt.id} onclick={() => responder(opt.id)}>{opt.label}</Chip>
          {/each}
        </div>
      {/key}
      {#if paso > 0}
        <button class="hook__atras" type="button" onclick={atras}>{copy.atras}</button>
      {/if}
    {/if}
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
  .hook__anio {
    font-size: clamp(88px, 18vw, 220px);
    line-height: 0.82;
    margin: 0;
  }
  .chips {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: min(100%, 420px);
  }
  .hook__atras {
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--ink-mute);
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
    padding: 0;
  }
  .hook__atras:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 3px;
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
