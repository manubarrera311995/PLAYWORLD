<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { recorrido } from "../../estado/recorrido";
  import { almas, paletaDeAlma, type AlmaId } from "../../almas/almas";
  import { aplicarPaleta } from "../../sketches/paleta";
  import Revelado from "./Revelado.svelte";
  import Marca from "../../ui/Marca.svelte";
  import { navigate, type RutaParsed } from "../director/router";
  import { lineaFila, manchaDe } from "./boleta";
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

  function imprimir(): void {
    window.print();
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
        <h1>Tu alma</h1>
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
          <p class="anio" style:color={mancha.cabecera}>{anio}</p>
        {/if}
        {#if temas.length}
          <ol>
            {#each temas as tema, i (tema.id)}
              <li style:flex-grow={mancha.franjas[i]?.peso ?? 1} style:color={mancha.franjas[i]?.tinta}>
                <span class="num">{String(i + 1).padStart(2, "0")}</span>
                <span class="tema">
                  <span class="cancion">{tema.track}</span>
                  <span class="artista">{tema.artist}</span>
                </span>
              </li>
            {/each}
          </ol>
        {/if}
        <p class="sello" style:color={mancha.pie}>{alma.nombre}</p>
      </article>
    </aside>

    <div class="acciones">
      <button type="button" onclick={imprimir}>Imprimir la boleta</button>
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

  h1 {
    margin: 0;
    font-family: Anton, Impact, sans-serif;
    font-weight: 400;
    font-size: clamp(48px, 7vw, 88px);
    line-height: 0.86;
    letter-spacing: -0.03em;
    color: var(--ink-title);
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

  .boleta {
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    width: clamp(200px, 20vw, 260px);
    height: 100dvh;
    padding: clamp(20px, 4vh, 36px) 20px clamp(20px, 4vh, 32px);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .anio,
  .sello {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }

  .anio { text-indent: 0.22em; }

  .boleta ol {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    margin: clamp(18px, 3vh, 28px) 0;
    list-style: none;
  }

  .boleta li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 0;
  }

  .num {
    flex: none;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    opacity: 0.72;
  }

  .tema {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .cancion {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 14px;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }

  .artista {
    overflow: hidden;
    font-size: 12px;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0.72;
  }

  .sello {
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
      height: auto;
      min-height: 62dvh;
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

    .cancion,
    .artista { white-space: normal; }
  }

  @media print {
    :global(body *) { visibility: hidden; }

    .boleta,
    .boleta * { visibility: visible; }

    .boleta {
      position: fixed;
      top: 0;
      left: 0;
      width: 72mm;
      height: 100vh;
      min-height: 100vh;
      margin: 0;
    }
  }
</style>
