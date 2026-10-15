<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { recorrido } from "../../estado/recorrido";
  import { almas, paletaDeAlma, type AlmaId } from "../../almas/almas";
  import { aplicarPaleta } from "../../sketches/paleta";
  import Revelado from "./Revelado.svelte";
  import Marca from "../../ui/Marca.svelte";
  import { navigate, type RutaParsed } from "../director/router";
  import copy from "../hook/hook.copy.json";

  type Props = { ruta?: RutaParsed };
  let { ruta: _ruta }: Props = $props();

  type Hora = {
    id: string;
    momento: string;
    corto: string;
    dicho: string;
    coincide: boolean;
  };

  const rec = $derived($recorrido);
  const alma = $derived(rec.alma ? almas[rec.alma.principal] : null);
  const eco = $derived(rec.alma ? almas[rec.alma.eco] : null);
  const temas = $derived(rec.seleccion?.tracks ?? []);

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
        momento: pregunta.etiqueta,
        corto: almas[almaId].corto,
        dicho: opcion?.label ?? "",
        coincide: almaId === principal,
      }];
    });
  });

  const coincideEn = $derived(horas.findIndex((hora) => hora.coincide));

  function filaDe(i: number): number {
    if (coincideEn >= 0 || horas.length < 2) return i + 1;
    const corte = horas.length - 1;
    return i < corte ? i + 1 : i + 2;
  }

  const filaCruce = $derived.by(() => {
    if (!horas.length) return 1;
    if (coincideEn >= 0) return coincideEn + 1;
    return horas.length;
  });

  onMount(() => {
    const r = get(recorrido);
    if (r.alma) aplicarPaleta(paletaDeAlma(r.alma.principal));
  });
</script>

<section class="creacion">
  <Revelado />
  <Marca />
  {#if alma}
    <div class="lienzo">
      {#if horas.length}
        <ol class="noche">
          {#each horas as hora, i (hora.id)}
            <li class={["hora", hora.coincide && "is-on"]} style:grid-row={filaDe(i)}>
              <p class="momento">{hora.momento}</p>
              <h2>{hora.corto}</h2>
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
        class:is-on={coincideEn >= 0}
        style:grid-row={filaCruce}
      >
        <div class="eje">
          {#if horas.length && coincideEn < 0}
            <div class="regla" aria-hidden="true"></div>
          {/if}
          <div class="nombre">
            <p class="momento">Tus canciones</p>
            <h1>{alma.corto}</h1>
          </div>
        </div>
        <div class="resto">
          {#if eco}
            <p class="borde">con un borde {eco.borde}</p>
          {/if}
          <p class="frase">{alma.frase}</p>
          {#if temas.length}
            <ul class="temas">
              {#each temas as tema (tema.id)}
                <li>{tema.artist}, {tema.track}</li>
              {/each}
            </ul>
          {/if}
          <button class="cta" type="button" onclick={() => navigate("/colectiva")}>
            Mira qué se llevaron los demás
          </button>
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  .creacion {
    position: relative;
    min-height: 100%;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    gap: clamp(28px, 5vh, 56px);
    padding: var(--pad-y) var(--pad-x) 48px;
  }

  .lienzo {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(220px, 440px) minmax(0, 1fr);
    column-gap: clamp(32px, 5vw, 72px);
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

  .hora h2,
  .veredicto h1 {
    font-family: Anton, Impact, sans-serif;
    font-weight: 400;
    font-size: clamp(36px, 4.2vw, 64px);
    line-height: 0.86;
    letter-spacing: -0.03em;
    color: var(--ink-title);
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
    width: calc(100% + var(--pad-x) + clamp(32px, 5vw, 72px) - 16px);
    margin-left: calc(var(--pad-x) * -1);
    margin-bottom: 0.12em;
    background: var(--c1);
  }

  .nombre { grid-column: 2; }

  .veredicto.solo .nombre { grid-column: 1; }

  .resto {
    grid-column: 2;
    margin-top: 14px;
  }

  .veredicto.solo .resto { grid-column: 1; }

  .veredicto.is-on {
    grid-column: 2;
    display: block;
  }

  .veredicto.is-on .eje { display: block; }

  .veredicto .momento { color: var(--c1); }

  .veredicto h1 { color: var(--c1); }

  .hora.is-on h2 {
    position: relative;
    color: var(--c1);
  }

  .hora.is-on h2::before {
    content: "";
    position: absolute;
    top: 50%;
    right: calc(100% + 12px);
    width: calc(var(--pad-x) + 12px);
    height: 2px;
    background: var(--c1);
    transform: translateY(-50%);
  }

  .borde {
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-title);
  }

  .frase {
    margin-top: 8px;
    max-width: 28ch;
    font-size: clamp(16px, 1.6vw, 20px);
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: var(--ink-soft);
  }

  .temas {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 0;
    margin-top: 14px;
    list-style: none;
    font-size: 14px;
    line-height: 1.4;
    color: var(--ink-soft);
  }

  .temas li:not(:last-child)::after {
    content: "·";
    margin: 0 0.5em;
    color: var(--ink-mute);
  }

  .cta {
    display: inline-block;
    margin-top: 22px;
    padding: 0;
    border: 0;
    background: none;
    font-size: 13px;
    letter-spacing: 0.02em;
    color: var(--ink-title);
    text-decoration: underline;
    text-underline-offset: 4px;
    cursor: pointer;
  }

  .cta:focus-visible {
    outline: 1px solid var(--ink);
    outline-offset: 3px;
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
    .nombre,
    .resto { grid-column: 1; }

    .regla {
      width: 88px;
      margin-left: 0;
      margin-bottom: 12px;
    }

    .hora.is-on h2::before { display: none; }
  }
</style>
