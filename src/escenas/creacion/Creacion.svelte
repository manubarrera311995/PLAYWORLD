<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { recorrido } from "../../estado/recorrido";
  import { almas, paletaDeAlma, type AlmaId } from "../../almas/almas";
  import { aplicarPaleta } from "../../sketches/paleta";
  import Revelado from "./Revelado.svelte";
  import Carta from "./Carta.svelte";
  import Marca from "../../ui/Marca.svelte";
  import { navigate, type RutaParsed } from "../director/router";
  import { artUrl } from "../../datos/color";
  import { lineaFila, manchaDe } from "./boleta";
  import { descargarTarjeta } from "./tarjeta";
  import copy from "../hook/hook.copy.json";
  import cartas from "./carta.copy.json";

  type Props = { ruta?: RutaParsed };
  let { ruta: _ruta }: Props = $props();

  type Hora = {
    id: string;
    almaId: AlmaId;
    momento: string;
    nombre: string;
    dicho: string;
  };

  type CartaLineas = { lineas: string[] };

  const onda = [
    18, 28, 22, 46, 34, 62, 40, 24, 70, 48, 30, 58, 36, 20, 44, 66, 28, 52, 38, 16,
    42, 60, 32, 22, 50, 36, 68, 26, 44, 18, 56, 40, 24, 48, 30, 64, 22, 38, 54, 20,
  ];

  const rec = $derived($recorrido);
  const alma = $derived(rec.alma ? almas[rec.alma.principal] : null);
  const temas = $derived(rec.seleccion?.tracks ?? []);
  const mancha = $derived(manchaDe(temas));
  const anio = $derived(rec.seleccion?.yearHint ?? rec.yearHint);
  const cruce = $derived(rec.alma ? lineaFila(rec.almasFila, rec.alma.principal) : null);
  const lineas = $derived(
    alma ? (cartas as Record<AlmaId, CartaLineas>)[alma.id].lineas : [],
  );

  const horas = $derived.by((): Hora[] => {
    const ids = rec.almasFila ?? [];
    return copy.questions.flatMap((pregunta, i) => {
      const id = ids[i];
      if (!id || !(id in almas)) return [];
      const almaId = id as AlmaId;
      const opcion = pregunta.options.find((o) => o.alma === almaId);
      return [{
        id: pregunta.id,
        almaId,
        momento: pregunta.etiqueta,
        nombre: almas[almaId].nombre,
        dicho: opcion?.label ?? "",
      }];
    });
  });

  let guardando = $state(false);

  async function guardar(): Promise<void> {
    if (guardando || !alma) return;
    guardando = true;
    try {
      await descargarTarjeta({
        alias: rec.seleccion?.alias ?? "",
        proyecto: "PLAYWORLD",
        anio,
        alma: alma.nombre,
        descripcion: alma.texto,
        temas: temas.map((tema) => ({
          track: tema.track,
          artist: tema.artist,
          art: artUrl(tema.art, "300"),
        })),
        mancha,
      });
    } finally {
      guardando = false;
    }
  }

  function indice(i: number): string {
    return `${String(i + 1).padStart(2, "0")}.`;
  }

  onMount(() => {
    const r = get(recorrido);
    if (r.alma) aplicarPaleta(paletaDeAlma(r.alma.principal));
  });
</script>

{#snippet icono(id: string)}
  {#if id === "llegas"}
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.2" y="5" width="17.6" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <path d="M4.2 16.4 9 12.4l3.4 2.6 3.6-3.6 3.8 4.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
    </svg>
  {:else if id === "show"}
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.4c.5 3.1-1.7 4.7-1.7 7.1 0 1.2.7 2.1 1.7 2.5-2.9.2-5.1 2.1-5.1 4.9C6.9 20.3 9.1 22 12 22s5.1-1.7 5.1-5.1c0-3.5-2.3-5.1-3.5-7.3.4-1.6 1-3.8-1.6-7.2Z"
        fill="currentColor"
      />
    </svg>
  {:else}
    <svg viewBox="0 0 40 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.6" />
      <circle cx="7.4" cy="8.4" r="0.9" fill="currentColor" />
      <circle cx="12.6" cy="8.4" r="0.9" fill="currentColor" />
      <path d="M7.2 12.4h5.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
      <circle cx="30" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.6" />
      <circle cx="27.4" cy="8.4" r="0.9" fill="currentColor" />
      <circle cx="32.6" cy="8.4" r="0.9" fill="currentColor" />
      <path d="M26.6 12.2c.8 1.3 2 2 3.4 2s2.6-.7 3.4-2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
    </svg>
  {/if}
{/snippet}

<section class="creacion">
  <Revelado />
  {#if alma}
    <div class="lienzo">
      <svg class="onda" viewBox="0 0 640 80" preserveAspectRatio="none" aria-hidden="true">
        {#each onda as alto, i (i)}
          <rect x={i * 16} y={(80 - alto) / 2} width="6" height={alto} rx="3" />
        {/each}
      </svg>

      <div class="camino">
        <header class="cabeza">
          <Marca />
          {#if anio != null}
            <p class="anio">{anio}</p>
          {/if}
          <h1>Tu alma</h1>
        </header>

        {#if horas.length}
          <h2 class="ruta">El camino de tu alma</h2>
          <ol class="pasos">
            {#each horas as hora, i (hora.id)}
              <li>
                <span class="num">{indice(i)}</span>
                <div class="paso">
                  <p class="momento">
                    <span>{hora.momento}</span>
                    <span class="guion" aria-hidden="true">—</span>
                    <span class="icono">{@render icono(hora.id)}</span>
                  </p>
                  <p class="alma-paso">{hora.nombre}</p>
                  {#if hora.dicho}
                    <p class="dicho">{hora.dicho}</p>
                  {/if}
                </div>
              </li>
            {/each}
          </ol>
        {/if}

        <div class="acciones">
          <button type="button" onclick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar boleta"}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 8.5h16v9.2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5Z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
              />
              <path d="M4 8.5 6.2 4.8h11.6L20 8.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
              <path d="M9 4.8v3.7h6V4.8" fill="none" stroke="currentColor" stroke-width="1.6" />
              <path d="M8 15.2h8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </button>
          <button type="button" class="demas" onclick={() => navigate("/colectiva")}>
            Ver qué llevaron los demás
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="8" cy="8" r="2.2" fill="none" stroke="currentColor" stroke-width="1.6" />
              <circle cx="16" cy="8.4" r="2" fill="none" stroke="currentColor" stroke-width="1.6" />
              <path d="M3.8 17.6c.6-2.4 2.3-3.6 4.2-3.6s3.6 1.2 4.2 3.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              <path d="M13.2 14.4c1.3-.5 2.6-.4 3.8.4 1.1.7 1.8 1.8 2.2 3.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div class="veredicto">
        <p class="kicker">Tus canciones</p>
        <h2 class={["nombre", lineas.length > 2 && "is-largo"]}>
          {#each lineas as linea (linea)}
            <span>{linea}</span>
          {/each}
        </h2>
        {#if temas.length}
          <ol class="temas">
            {#each temas as tema (tema.id)}
              {@const porta = artUrl(tema.art, "300")}
              <li>
                {#if porta}
                  <img src={porta} alt="{tema.track}, {tema.artist}" />
                {:else}
                  <span class="hueco" aria-hidden="true"></span>
                {/if}
              </li>
            {/each}
          </ol>
        {/if}
        <p class="origen">Esta alma surgió de las cinco canciones que elegiste.</p>
        {#if cruce}
          <p class="cruce">{cruce}</p>
        {/if}
      </div>

      <aside class="lado">
        <Carta id={alma.id} />
      </aside>
    </div>
  {/if}
</section>

<style>
  .creacion {
    position: relative;
    min-height: 100%;
    min-height: 100dvh;
  }

  .lienzo {
    position: relative;
    min-height: 100%;
    min-height: 100dvh;
    display: grid;
    grid-template-columns:
      minmax(260px, 0.92fr)
      minmax(220px, 1fr)
      minmax(300px, calc((100dvh - 168px) * 9 / 16));
    column-gap: clamp(20px, 2.4vw, 40px);
    align-items: stretch;
    padding: 64px clamp(24px, 3vw, 48px) 28px;
  }

  .onda {
    position: absolute;
    z-index: 0;
    left: 18%;
    right: 26%;
    top: 34%;
    height: 110px;
    color: rgba(255, 196, 226, 0.2);
    pointer-events: none;
  }

  .onda rect { fill: currentColor; }

  .camino,
  .veredicto,
  .lado {
    position: relative;
    z-index: 1;
    min-width: 0;
  }

  .camino {
    display: flex;
    flex-direction: column;
    padding-bottom: 8px;
  }

  .cabeza {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .cabeza :global(.tipo-marca) {
    color: var(--ink-title);
  }

  .anio {
    margin-top: 8px;
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 0.12em;
    color: var(--ink-title);
  }

  h1 {
    margin-top: 22px;
    font-family: Outfit, sans-serif;
    font-weight: 700;
    font-size: clamp(48px, 4.6vw, 72px);
    line-height: 0.92;
    letter-spacing: -0.035em;
    color: var(--ink-title);
  }

  .ruta {
    margin-top: 28px;
    font-family: Outfit, sans-serif;
    font-weight: 700;
    font-size: clamp(20px, 1.6vw, 26px);
    line-height: 1.15;
    letter-spacing: -0.03em;
    color: var(--ink-title);
  }

  .pasos {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 26px;
    margin-top: 22px;
    padding-left: 16px;
    list-style: none;
  }

  .pasos::before {
    content: "";
    position: absolute;
    top: 6px;
    bottom: 6px;
    left: 0;
    width: 1px;
    background: rgba(255, 246, 239, 0.42);
  }

  .pasos li {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    column-gap: 6px;
  }

  .num {
    padding-top: 1px;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: rgba(255, 246, 239, 0.78);
  }

  .momento {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-title);
  }

  .guion {
    letter-spacing: 0;
    opacity: 0.8;
  }

  .icono {
    display: inline-flex;
    color: var(--ink-title);
  }

  .icono svg {
    width: 16px;
    height: 16px;
  }

  .momento .icono svg {
    width: auto;
    height: 16px;
  }

  .alma-paso {
    margin-top: 6px;
    font-family: Outfit, sans-serif;
    font-weight: 700;
    font-size: clamp(18px, 1.45vw, 22px);
    line-height: 1.08;
    letter-spacing: -0.03em;
    color: var(--ink-title);
  }

  .dicho {
    margin-top: 4px;
    font-size: 14px;
    line-height: 1.35;
    color: rgba(255, 246, 239, 0.78);
  }

  .acciones {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: auto;
    padding-top: 32px;
  }

  .acciones button {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 42px;
    padding: 8px 16px 8px 18px;
    border: 1.5px solid rgba(255, 246, 239, 0.72);
    border-radius: 999px;
    background: transparent;
    color: var(--ink-title);
    font-size: 14px;
    letter-spacing: -0.01em;
    cursor: pointer;
  }

  .acciones button svg {
    width: 18px;
    height: 18px;
    flex: none;
  }

  .acciones button.demas {
    box-shadow:
      0 0 0 1px rgba(255, 170, 220, 0.18),
      0 0 22px rgba(186, 84, 230, 0.42);
  }

  .acciones button:focus-visible {
    outline: 1px solid var(--ink-title);
    outline-offset: 3px;
  }

  .acciones button:disabled {
    cursor: progress;
    opacity: 0.55;
  }

  .veredicto {
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-self: center;
    padding: 12px 0 48px;
  }

  .kicker {
    margin-bottom: 12px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-indent: 0.22em;
    text-transform: uppercase;
    color: var(--ink-title);
  }

  .nombre {
    font-family: Outfit, sans-serif;
    font-weight: 800;
    font-size: clamp(56px, 16cqi, 120px);
    line-height: 0.86;
    letter-spacing: -0.045em;
    background: linear-gradient(185deg, #ff6430 0%, #ff972c 40%, #ffd23a 78%, #ffe56a 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: #ffb03a;
    -webkit-text-fill-color: transparent;
  }

  .nombre.is-largo {
    font-size: clamp(42px, 11cqi, 84px);
  }

  .nombre span { display: block; }

  .temas {
    display: flex;
    gap: 8px;
    margin-top: 22px;
    list-style: none;
  }

  .temas li {
    width: 54px;
    height: 54px;
    overflow: hidden;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.28);
  }

  .temas img,
  .temas .hueco {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .origen,
  .cruce {
    max-width: 38em;
    font-size: 15px;
    line-height: 1.45;
    color: var(--ink-title);
  }

  .origen { margin-top: 18px; }

  .cruce {
    margin-top: 10px;
    color: rgba(255, 246, 239, 0.9);
  }

  .lado {
    display: flex;
    align-items: stretch;
    justify-content: flex-end;
    align-self: stretch;
    min-height: 0;
  }

  @media (max-width: 1180px) {
    .lienzo {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      row-gap: 28px;
    }

    .camino { grid-column: 1; grid-row: 1; }
    .veredicto { grid-column: 1; grid-row: 2; align-self: start; padding-bottom: 12px; }
    .lado {
      grid-column: 2;
      grid-row: 1 / span 2;
      align-self: start;
      padding-top: 36px;
    }

    .onda { display: none; }
  }

  @media (max-width: 767px) {
    .lienzo {
      grid-template-columns: 1fr;
      padding-top: 56px;
    }

    .camino,
    .veredicto,
    .lado {
      grid-column: 1;
      grid-row: auto;
    }

    .lado { justify-content: center; }
    .acciones { margin-top: 28px; }
  }
</style>
