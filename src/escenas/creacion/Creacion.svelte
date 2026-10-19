<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { recorrido } from "../../estado/recorrido";
  import { almas, paletaDeAlma, type AlmaId } from "../../almas/almas";
  import { aplicarPaleta } from "../../sketches/paleta";
  import Revelado from "./Revelado.svelte";
  import Marca from "../../ui/Marca.svelte";
  import { navigate, type RutaParsed } from "../director/router";
  import { artUrl } from "../../datos/color";
  import { lineaFila, manchaDe } from "./boleta";
  import { descargarTarjeta } from "./tarjeta";
  import copy from "../hook/hook.copy.json";

  type Props = { ruta?: RutaParsed };
  let { ruta: _ruta }: Props = $props();

  type Hora = {
    id: string;
    almaId: AlmaId;
    momento: string;
    nombre: string;
    dicho: string;
    coincide: boolean;
  };

  let mira = $state<{ id: AlmaId; momento: string | null } | null>(null);

  const rec = $derived($recorrido);
  const alma = $derived(rec.alma ? almas[rec.alma.principal] : null);
  const eco = $derived(rec.alma ? almas[rec.alma.eco] : null);
  const temas = $derived(rec.seleccion?.tracks ?? []);
  const mancha = $derived(manchaDe(temas));
  const anio = $derived(rec.seleccion?.yearHint ?? rec.yearHint);
  const cruce = $derived(rec.alma ? lineaFila(rec.almasFila, rec.alma.principal) : null);

  const horas = $derived.by((): Hora[] => {
    const ids = rec.almasFila ?? [];
    const principal = rec.alma?.principal;
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
        coincide: almaId === principal,
      }];
    });
  });

  function filaDe(i: number): number {
    if (horas.length < 2) return i + 1;
    const corte = horas.length - 1;
    return i < corte ? i + 1 : i + 2;
  }

  const filaCruce = $derived(horas.length ? horas.length : 1);

  const vista = $derived(mira ? almas[mira.id] : alma);
  const deFila = $derived(mira?.momento ?? null);

  function posar(id: AlmaId, momento: string | null): void {
    mira = { id, momento };
  }

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

  onMount(() => {
    const r = get(recorrido);
    if (r.alma) aplicarPaleta(paletaDeAlma(r.alma.principal));
  });
</script>

<section class="creacion">
  <Revelado />
  {#if alma}
    <div class="zona">
      <header class="cabeza">
        <Marca />
        {#if anio != null}
          <p class="eyebrow">{anio}</p>
        {/if}
        <h1 class="tipo-seccion">Tu alma</h1>
      </header>
      <div class="lienzo">
        {#if horas.length}
          <ol class="noche">
            {#each horas as hora, i (hora.id)}
              <li
                class={["hora", hora.coincide && "is-on", mira?.momento === hora.momento && "is-mira"]}
                style:grid-row={filaDe(i)}
              >
                <p class="momento">{hora.momento}</p>
                <button
                  type="button"
                  class="mood"
                  onmouseenter={() => posar(hora.almaId, hora.momento)}
                  onmouseleave={() => (mira = null)}
                  onfocus={() => posar(hora.almaId, hora.momento)}
                  onblur={() => (mira = null)}
                >{hora.nombre}</button>
                {#if hora.dicho}
                  <p class="dicho">{hora.dicho}</p>
                {/if}
              </li>
            {/each}
          </ol>
        {/if}

        <div
          class="veredicto"
          class:solo={!horas.length}
          style:grid-row={filaCruce}
        >
          <div class="eje">
            {#if horas.length}
              <div class="regla" aria-hidden="true"></div>
            {/if}
            <div class={["nombre", !deFila && mira && "is-mira"]}>
              <p class="momento">Tus canciones</p>
              <button
                type="button"
                class="mood"
                onmouseenter={() => posar(alma.id, null)}
                onmouseleave={() => (mira = null)}
                onfocus={() => posar(alma.id, null)}
                onblur={() => (mira = null)}
              >{alma.nombre}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <aside class="lado">
      <div class="lectura">
        {#if deFila}
          <p class="borde">{deFila}</p>
        {:else if eco}
          <p class="borde">con un borde {eco.borde}</p>
        {/if}
        {#if vista}
          <p class="texto">{vista.texto}</p>
        {/if}
        {#if !deFila}
          <p class="origen">Esta alma salió de las cinco canciones que elegiste.</p>
          {#if cruce}
            <p class="cruce">{cruce}</p>
          {/if}
        {/if}
      </div>

      <article class="boleta" style:background={mancha.fondo}>
        {#if anio != null}
          <p class="anio">{anio}</p>
        {/if}
        {#if temas.length}
          <ol class="portadas" class:es-cinco={temas.length === 5}>
            {#each temas as tema, i (tema.id)}
              {@const porta = artUrl(tema.art, "300")}
              <li>
                {#if porta}
                  <img src={porta} alt="" />
                {:else}
                  <span class="hueco" aria-hidden="true"></span>
                {/if}
                <span class="pieza">
                  <span class="cancion">{tema.track}</span>
                  <span class="artista">{tema.artist}</span>
                </span>
              </li>
            {/each}
          </ol>
        {/if}
        <p class="sello">{alma.nombre}</p>
      </article>
    </aside>

    <div class="acciones">
      <button type="button" onclick={guardar} disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar la boleta"}
      </button>
      <button type="button" onclick={() => navigate("/colectiva")}>
        Mira qué se llevaron los demás
      </button>
    </div>
  {/if}
</section>

<style>
  .creacion {
    position: relative;
    min-height: 100%;
    min-height: 100dvh;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .zona {
    display: flex;
    flex-direction: column;
    gap: clamp(28px, 5vh, 56px);
    min-width: 0;
    padding: var(--pad-y) clamp(20px, 3vw, 40px) 88px var(--pad-x);
  }

  .cabeza {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  .lienzo {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(180px, 380px) minmax(0, 1fr);
    column-gap: clamp(28px, 4vw, 56px);
    row-gap: clamp(36px, 6vh, 72px);
    align-content: center;
  }

  .noche {
    display: contents;
    list-style: none;
  }

  .hora { grid-column: 1; }

  .momento {
    margin-bottom: 6px;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-mute);
  }

  .mood {
    display: block;
    padding: 0;
    border: 0;
    background: none;
    font-family: Anton, Impact, sans-serif;
    font-weight: 400;
    max-width: 9em;
    font-size: clamp(32px, 3.6vw, 56px);
    line-height: 0.9;
    letter-spacing: -0.03em;
    text-align: left;
    text-wrap: balance;
    text-decoration: none;
    color: var(--ink-title);
    cursor: pointer;
  }

  .mood:focus-visible {
    outline: 1px solid var(--ink);
    outline-offset: 6px;
  }

  .dicho {
    margin-top: 10px;
    max-width: 28ch;
    font-size: 15px;
    line-height: 1.35;
    color: var(--ink-soft);
  }

  .veredicto {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: subgrid;
    align-self: center;
  }

  .veredicto.solo { grid-column: 1 / -1; }

  .eje {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: subgrid;
    align-items: end;
  }

  .regla {
    grid-column: 1;
    height: 2px;
    width: calc(100% + var(--pad-x) + clamp(28px, 4vw, 56px) - 16px);
    margin-left: calc(var(--pad-x) * -1);
    margin-bottom: 0.12em;
    background: var(--c1);
  }

  .nombre { grid-column: 2; }

  .veredicto.solo .nombre { grid-column: 1; }

  .veredicto .momento { color: var(--c1); }

  .veredicto .mood { color: var(--c1); }

  .hora.is-on .mood {
    position: relative;
    color: var(--c1);
  }

  .hora.is-on .mood::before {
    content: "";
    position: absolute;
    top: 50%;
    right: calc(100% + 12px);
    width: calc(var(--pad-x) + 12px);
    height: 2px;
    background: var(--c1);
    transform: translateY(-50%);
  }

  .lado {
    display: flex;
    align-items: stretch;
    min-height: 100dvh;
  }

  .lectura {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: min(340px, 28vw);
    padding: var(--pad-y) clamp(20px, 2.4vw, 36px);
  }

  .borde {
    margin-bottom: 12px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ink-mute);
  }

  .texto {
    min-height: 9.6em;
    max-width: 28em;
    font-size: clamp(16px, 1.45vw, 20px);
    line-height: 1.35;
    letter-spacing: -0.01em;
    color: var(--ink);
  }

  .origen,
  .cruce {
    max-width: 32em;
    font-size: 14px;
    line-height: 1.4;
    color: var(--ink-soft);
  }

  .origen { margin-top: 18px; }

  .cruce { margin-top: 8px; }

  .acciones {
    position: fixed;
    z-index: var(--z-ui);
    left: var(--pad-x);
    bottom: 24px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 28px;
    max-width: min(520px, calc(100vw - var(--pad-x) * 2));
  }

  .acciones button {
    padding: 0;
    border: 0;
    background: none;
    font-size: 13px;
    letter-spacing: 0.02em;
    color: var(--ink-title);
    text-align: left;
    text-decoration: underline;
    text-underline-offset: 4px;
    cursor: pointer;
  }

  .acciones button:focus-visible {
    outline: 1px solid var(--ink);
    outline-offset: 3px;
  }

  .acciones button:disabled {
    cursor: progress;
    opacity: 0.55;
  }

  .boleta {
    position: sticky;
    top: 0;
    width: clamp(280px, 34vw, 460px);
    height: 100dvh;
    overflow: hidden;
    background: #100a12;
  }

  .anio,
  .sello {
    position: absolute;
    z-index: 2;
    color: #fff6ef;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.55);
  }

  .anio {
    top: 18px;
    left: 16px;
    text-indent: 0.22em;
  }

  .portadas {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 1fr;
    list-style: none;
  }

  .portadas.es-cinco {
    grid-template-rows: 38fr 20fr 16fr 26fr;
  }

  .portadas.es-cinco li:nth-child(1) { grid-column: 1; grid-row: 1; }
  .portadas.es-cinco li:nth-child(2) { grid-column: 2; grid-row: 1 / span 2; }
  .portadas.es-cinco li:nth-child(3) { grid-column: 1; grid-row: 2 / span 2; }
  .portadas.es-cinco li:nth-child(4) { grid-column: 2; grid-row: 3 / span 2; }
  .portadas.es-cinco li:nth-child(5) { grid-column: 1; grid-row: 4; }

  .portadas.es-cinco li:nth-child(4) .pieza,
  .portadas.es-cinco li:nth-child(5) .pieza {
    top: 0;
    bottom: auto;
    padding: 8px 10px 22px;
    background: linear-gradient(180deg, rgba(8, 4, 12, 0.78), rgba(8, 4, 12, 0));
  }

  .portadas li {
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .portadas img,
  .portadas .hueco {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: rgba(0, 0, 0, 0.28);
  }

  .pieza {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 1px;
    padding: 22px 10px 8px;
    background: linear-gradient(0deg, rgba(8, 4, 12, 0.78), rgba(8, 4, 12, 0));
    color: #fff6ef;
    pointer-events: none;
  }

  .cancion,
  .artista {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .cancion {
    font-size: 12px;
    font-weight: 500;
    line-height: 1.15;
  }

  .artista {
    font-size: 10px;
    line-height: 1.15;
    opacity: 0.84;
  }

  .sello {
    right: 16px;
    bottom: 16px;
    left: 16px;
    letter-spacing: 0.14em;
    line-height: 1.35;
    text-wrap: balance;
  }

  @media (max-width: 1023px) {
    .creacion { grid-template-columns: 1fr; }

    .lado {
      min-height: 0;
      flex-direction: column-reverse;
    }

    .lectura {
      width: auto;
      padding: 8px var(--pad-x) 88px;
    }

    .boleta {
      position: relative;
      width: 100%;
      height: 78dvh;
      min-height: 78dvh;
    }
  }

  @media (max-width: 767px) {
    .lienzo {
      grid-template-columns: 1fr;
      row-gap: 28px;
      align-content: start;
    }

    .hora,
    .veredicto,
    .eje,
    .regla,
    .nombre { grid-column: 1; }

    .regla {
      width: 88px;
      margin-left: 0;
      margin-bottom: 12px;
    }

    .hora.is-on .mood::before { display: none; }
  }
</style>
