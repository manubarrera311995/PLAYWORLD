<script lang="ts">
  import { onDestroy } from "svelte";
  import copy from "./hook.copy.json";
  import { caratulaDe, ecosDelSuelo, resolverPuerta, type Revelado } from "./anio";
  import { entrarPaso, entrarRevelado, entrarResto, entrarSuelo, marcarOrigen } from "./entrada";
  import Marca from "../../ui/Marca.svelte";
  import Eyebrow from "../../ui/Eyebrow.svelte";
  import Boton from "../../ui/Boton.svelte";
  import { navigate } from "../director/router";
  import { parcheRecorrido } from "../../estado/recorrido";
  import { reduce } from "../../motion/reducedMotion";
  import type { RutaParsed } from "../director/router";

  type Props = { ruta?: RutaParsed };
  type Resto = { id: string; label: string; art: string; year: number };

  let { ruta: _ruta }: Props = $props();

  const total = copy.questions.length;
  const ecos = ecosDelSuelo();
  const GIROS_OPCION = [-5, 6] as const;
  const GIROS_BOLSA = [-12, 4, 11] as const;

  let raiz: HTMLElement | undefined = $state();
  let paso = $state(0);
  let respuestas = $state<string[]>(Array.from({ length: total }, () => ""));
  let puerta = $state<Revelado | null>(null);
  let timer = 0;

  const pregunta = $derived(copy.questions[paso]);
  const elegido = $derived(respuestas[paso] || null);
  const caratula = $derived(puerta ? caratulaDe(puerta.year) : null);
  const restos = $derived.by((): Resto[] => {
    const tope = puerta ? total : elegido ? paso + 1 : paso;
    const out: Resto[] = [];
    for (let i = 0; i < tope; i += 1) {
      const id = respuestas[i];
      if (!id) continue;
      const opt = copy.questions[i]?.options.find((o) => o.id === id);
      if (!opt) continue;
      const foto = caratulaDe(opt.year);
      out.push({
        id: `${copy.questions[i].id}-${opt.id}`,
        label: opt.label,
        art: foto.art,
        year: opt.year,
      });
    }
    return out;
  });

  function tickActivo(i: number): boolean {
    if (puerta) return true;
    if (i < paso) return true;
    return i === paso && Boolean(elegido);
  }

  onDestroy(() => clearTimeout(timer));

  function responder(id: string, nodo?: HTMLElement): void {
    if (nodo) marcarOrigen(nodo);
    respuestas[paso] = id;
    clearTimeout(timer);
    const wait = $reduce ? 0 : 560;
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
    if (paso <= 0) return;
    const anterior = paso - 1;
    for (let i = anterior + 1; i < total; i += 1) respuestas[i] = "";
    paso = anterior;
  }

  function irAlArchivo(): void {
    const y = puerta?.year;
    if (y) navigate(`/archivo?y=${y}`);
  }

  function tecla(e: KeyboardEvent): void {
    if (puerta || !pregunta) return;
    const i = e.key === "ArrowLeft" || e.key === "1" ? 0 : e.key === "ArrowRight" || e.key === "2" ? 1 : -1;
    if (i < 0) return;
    const opt = pregunta.options[i];
    if (!opt) return;
    e.preventDefault();
    const nodos = raiz?.querySelectorAll<HTMLElement>(".hook__recorte");
    responder(opt.id, nodos?.[i]);
  }

  function guardarRaiz(nodo: HTMLElement): () => void {
    raiz = nodo;
    return () => {
      if (raiz === nodo) raiz = undefined;
    };
  }
</script>

<svelte:window onkeydown={tecla} />

<section class="hook" {@attach guardarRaiz}>
  <aside class={["hook__suelo", puerta && "is-callado"]} aria-hidden="true" {@attach entrarSuelo}>
    {#each ecos as eco (eco.year)}
      <figure class="hook__eco">
        <img src={eco.art} alt="" draggable="false" />
      </figure>
    {/each}
  </aside>

  <header class="hook__top">
    <Marca texto={copy.brand} />
    <div class="hook__pasos" aria-label="Paso {paso + 1} de {total}">
      {#each copy.questions as q, i (q.id)}
        <span class={["hook__tick", tickActivo(i) && "is-on"]}></span>
      {/each}
    </div>
  </header>

  <div class="hook__main">
    {#if puerta && caratula}
      <div class="hook__revelado" {@attach entrarRevelado}>
        <figure class="hook__caratula">
          <span class="hook__cinta"></span>
          <img src={caratula.art} alt="" draggable="false" />
          {#if caratula.label}
            <figcaption>{caratula.label}</figcaption>
          {/if}
        </figure>
        <div class="hook__golpe">
          <Eyebrow texto={copy.revealEyebrow} />
          <h1 class="tipo-hero hook__anio">{puerta.year}</h1>
          <p class="tipo-cuerpo">{puerta.linea}</p>
          <Boton onclick={irAlArchivo}>{copy.cta}</Boton>
          <button class="hook__atras" type="button" onclick={atras}>{copy.atras}</button>
        </div>
      </div>
    {:else if pregunta}
      {#key pregunta.id}
        <div class="hook__paso" {@attach entrarPaso}>
          <div class="hook__kicker">
            <Eyebrow texto={copy.kicker} />
          </div>
          <h1 class="tipo-pregunta" id="hook-q">{pregunta.text}</h1>
          <div class="hook__manos" role="radiogroup" aria-labelledby="hook-q">
            {#each pregunta.options as opt, i (opt.id)}
              {@const foto = caratulaDe(opt.year)}
              <button
                class={[
                  "hook__recorte",
                  elegido === opt.id && "is-on",
                  elegido && elegido !== opt.id && "is-off",
                ]}
                style:--giro={`${GIROS_OPCION[i % GIROS_OPCION.length]}deg`}
                type="button"
                role="radio"
                aria-checked={elegido === opt.id}
                onclick={(e) => responder(opt.id, e.currentTarget)}
              >
                <span class="hook__cinta"></span>
                <img src={foto.art} alt="" draggable="false" />
                <span class="hook__recorte-label">{opt.label}</span>
              </button>
            {/each}
          </div>
        </div>
      {/key}
      {#if paso > 0}
        <button class="hook__atras" type="button" onclick={atras}>{copy.atras}</button>
      {/if}
    {/if}
  </div>

  {#if restos.length}
    <aside class="hook__bolsa" aria-hidden="true">
      {#each restos as resto, i (resto.id)}
        <figure
          class="hook__resto"
          style:--giro={`${GIROS_BOLSA[i % GIROS_BOLSA.length]}deg`}
          {@attach entrarResto}
        >
          <span class="hook__cinta"></span>
          <img src={resto.art} alt="" draggable="false" />
          <figcaption>{resto.label}</figcaption>
        </figure>
      {/each}
    </aside>
  {/if}
</section>

<style>
  .hook {
    position: relative;
    min-height: 100%;
    min-height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr;
    padding: var(--pad-y) var(--pad-x) 128px;
    overflow: hidden;
  }
  .hook__suelo {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    transition: opacity 420ms var(--ease-soft);
  }
  .hook__suelo.is-callado {
    opacity: 0.28;
  }
  .hook__eco {
    position: absolute;
    width: clamp(72px, 11vw, 118px);
    aspect-ratio: 1;
    margin: 0;
    overflow: hidden;
    border: 1px solid rgba(255, 246, 239, 0.28);
    box-shadow: 0 16px 32px rgba(8, 0, 18, 0.28);
    opacity: 0.22;
    filter: saturate(0.72) brightness(0.82);
  }
  .hook__eco img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .hook__eco:nth-child(1) {
    top: 10%;
    left: -2%;
    rotate: -18deg;
  }
  .hook__eco:nth-child(2) {
    top: 6%;
    right: -3%;
    rotate: 16deg;
  }
  .hook__eco:nth-child(3) {
    top: 44%;
    left: -5%;
    rotate: 8deg;
  }
  .hook__eco:nth-child(4) {
    top: 40%;
    right: -6%;
    rotate: -12deg;
  }
  .hook__eco:nth-child(5) {
    bottom: 16%;
    left: 6%;
    rotate: -7deg;
  }
  .hook__eco:nth-child(6) {
    bottom: 20%;
    right: 7%;
    rotate: 11deg;
  }
  .hook__top,
  .hook__main,
  .hook__bolsa {
    position: relative;
    z-index: 1;
  }
  .hook__top {
    display: grid;
    justify-items: center;
    gap: 14px;
  }
  .hook__pasos {
    display: flex;
    gap: 8px;
    justify-content: center;
  }
  .hook__tick {
    width: 22px;
    height: 3px;
    background: rgba(255, 246, 239, 0.22);
  }
  .hook__tick.is-on {
    background: rgba(255, 246, 239, 0.88);
  }
  .hook__main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: clamp(20px, 4vh, 40px);
  }
  .hook__paso {
    display: grid;
    justify-items: center;
    gap: clamp(20px, 4vh, 36px);
    width: min(100%, 720px);
  }
  .hook__manos {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: clamp(12px, 3vw, 28px);
    width: min(100%, 440px);
    align-items: start;
  }
  .hook__recorte {
    appearance: none;
    position: relative;
    display: grid;
    gap: 8px;
    width: 100%;
    min-width: 0;
    padding: 10px 10px 12px;
    border: 0;
    border-radius: 2px 3px 2px 4px;
    background: #f3ebe2;
    color: #1c1014;
    box-shadow: 0 18px 36px rgba(8, 0, 18, 0.34);
    rotate: var(--giro, 0deg);
    cursor: pointer;
    text-align: left;
    opacity: 1;
    visibility: visible;
    transition:
      filter 220ms var(--ease-soft),
      box-shadow 220ms var(--ease-soft);
  }
  .hook__recorte img {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    aspect-ratio: 1;
    object-fit: cover;
    filter: saturate(0.92) contrast(1.04);
  }
  .hook__recorte-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #2a1418;
    padding: 0 2px;
  }
  .hook__recorte.is-on {
    box-shadow:
      0 22px 40px rgba(8, 0, 18, 0.4),
      0 0 0 1px rgba(255, 246, 239, 0.35);
  }
  .hook__recorte.is-off {
    opacity: 0.38;
    filter: grayscale(0.35);
  }
  .hook__recorte:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 4px;
  }
  .hook__cinta {
    position: absolute;
    top: -8px;
    left: 50%;
    z-index: 2;
    width: 42%;
    height: 16px;
    translate: -50% 0;
    background: linear-gradient(
      180deg,
      rgba(255, 236, 196, 0.22),
      rgba(255, 214, 140, 0.38)
    );
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.28);
    pointer-events: none;
  }
  .hook__revelado {
    display: grid;
    justify-items: center;
    gap: clamp(20px, 4vh, 36px);
    width: min(100%, 720px);
  }
  .hook__caratula {
    position: relative;
    width: clamp(132px, 26vw, 200px);
    margin: 0;
    padding: 10px 10px 36px;
    rotate: -8deg;
    background: #f3ebe2;
    box-shadow: 0 22px 48px rgba(12, 0, 24, 0.42);
  }
  .hook__caratula img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
  }
  .hook__caratula figcaption {
    position: absolute;
    right: 10px;
    bottom: 10px;
    left: 10px;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #3a2018;
  }
  .hook__golpe {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(16px, 3vh, 28px);
  }
  .hook__anio {
    font-size: clamp(88px, 18vw, 220px);
    line-height: 0.82;
    margin: 0;
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
  .hook__bolsa {
    position: absolute;
    right: var(--pad-x);
    bottom: var(--pad-y);
    left: var(--pad-x);
    display: flex;
    justify-content: center;
    align-items: flex-end;
    pointer-events: none;
  }
  .hook__resto {
    position: relative;
    width: 76px;
    margin: 0 -14px;
    padding: 6px 6px 22px;
    background: #f3ebe2;
    box-shadow: 0 12px 24px rgba(8, 0, 18, 0.32);
    rotate: var(--giro, 0deg);
  }
  .hook__resto img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
  }
  .hook__resto figcaption {
    position: absolute;
    right: 6px;
    bottom: 5px;
    left: 6px;
    font-size: 8px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #3a2018;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media (hover: hover) and (prefers-reduced-motion: no-preference) {
    .hook__recorte:hover:not(.is-off) {
      translate: 0 -6px;
    }
  }
  @media (max-width: 767px) {
    .hook__eco:nth-child(3),
    .hook__eco:nth-child(4) {
      display: none;
    }
    .hook__eco {
      width: 64px;
      opacity: 0.16;
    }
    .hook__resto {
      width: 64px;
      margin: 0 -10px;
    }
  }
  @media (min-width: 768px) {
    .hook__revelado {
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: 28px 36px;
      text-align: left;
    }
    .hook__caratula {
      rotate: -9deg;
    }
    .hook__golpe {
      align-items: flex-start;
    }
    .hook__manos {
      width: min(100%, 480px);
    }
  }
</style>
