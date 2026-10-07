<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { recorrido } from "../../estado/recorrido";
  import { almas, paletaDeAlma } from "../../almas/almas";
  import { ecosDelArchivo } from "../../almas/motor";
  import { edicionDe } from "../../datos/archivo";
  import { cargarPool } from "../../datos/pool";
  import { aplicarPaleta } from "../../sketches/paleta";
  import EcosDelArchivo from "./EcosDelArchivo.svelte";
  import Revelado from "./Revelado.svelte";
  import Sello from "./Sello.svelte";
  import Boton from "../../ui/Boton.svelte";
  import Marca from "../../ui/Marca.svelte";
  import { navigate, type RutaParsed } from "../director/router";
  import type { AudioDNA, Track } from "../../datos/tipos";
  import { fraseDeSeleccion, rotulosDe } from "./frase";

  type Props = { ruta?: RutaParsed };
  let { ruta: _ruta }: Props = $props();
  const rec = $derived($recorrido);
  const alma = $derived(rec.alma ? almas[rec.alma.principal] : null);
  const eco = $derived(rec.alma ? almas[rec.alma.eco] : null);
  const fila = $derived.by(() => {
    const ids = rec.almasFila ?? [];
    const nombres = ids.map((id) => almas[id].corto);
    if (nombres.length < 2) return nombres[0] ?? "";
    return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
  });
  const titulo = $derived.by(() => {
    if (!alma) return [];
    let i = 0;
    return alma.nombre.split(" ").map((palabra) => ({
      palabra,
      letras: [...palabra].map((letra) => ({ letra, delay: i++ * 28 })),
    }));
  });
  const rotulos = $derived(rec.seleccion ? rotulosDe(rec.seleccion.tracks) : {});
  const meta = $derived.by(() => {
    if (!rec.seleccion || !alma) return "";
    const year = rec.seleccion.yearHint ?? rec.yearHint ?? rec.edicionAbierta;
    return [rec.seleccion.alias, year, alma.corto]
      .filter((p) => p != null && String(p).trim() !== "")
      .join(" · ");
  });

  let ecos = $state<Track[]>([]);
  let anioFrase = $state<number | null>(null);
  let medianaAnio = $state<Partial<AudioDNA> | null>(null);
  let anioListo = $state(false);

  const frase = $derived(
    anioListo && rec.seleccion
      ? fraseDeSeleccion(rec.seleccion.tracks, anioFrase, medianaAnio)
      : null,
  );

  onMount(() => {
    const r = get(recorrido);
    if (r.alma) aplicarPaleta(paletaDeAlma(r.alma.principal));
    void cargarPool().then((pool) => {
      if (r.seleccion && r.alma) {
        ecos = ecosDelArchivo(r.seleccion.tracks, pool, r.alma.principal, 4);
      }
    });
    const year = r.seleccion?.yearHint ?? r.yearHint ?? r.edicionAbierta;
    anioFrase = year;
    if (year == null) {
      anioListo = true;
      return;
    }
    void edicionDe(year)
      .then((ed) => {
        medianaAnio = ed?.stats.mediana ?? null;
      })
      .finally(() => {
        anioListo = true;
      });
  });
</script>

<section class="creacion">
  <Revelado />
  <div class="col">
    <header>
      <Marca />
      {#if alma}
        <h1 class="tipo-seccion nombre" aria-label={alma.nombre}>
          {#each titulo as bloque, bi (bloque.palabra + bi)}
            <span class="palabra" aria-hidden="true">
              {#each bloque.letras as letra, li (`${bi}-${li}`)}
                <span class="letra" style:animation-delay="{letra.delay}ms">{letra.letra}</span>
              {/each}
            </span>
          {/each}
        </h1>
        {#if eco}
          <p class="tipo-eco tinta">con un borde {eco.borde}</p>
        {/if}
        <p class="tipo-cuerpo">{alma.texto}</p>
        {#if fila}
          <p class="tipo-cuerpo">En la fila dijiste {fila}. Tus canciones dicen {alma.corto}.</p>
        {/if}
      {/if}
    </header>
    {#if rec.alma}
      <Sello puntajes={rec.alma.puntajes} principal={rec.alma.principal} eco={rec.alma.eco} />
    {/if}
    {#if frase}
      <p class="frase">{frase}</p>
    {/if}
    {#if rec.seleccion}
      <article class="polaroid">
        <EcosDelArchivo propias={rec.seleccion.tracks} {ecos} {rotulos} />
        <footer class="borde">
          {#if meta}
            <p class="meta">{meta}</p>
          {/if}
          <Boton onclick={() => navigate("/colectiva")}>Mira qué se llevaron los demás</Boton>
        </footer>
      </article>
    {/if}
  </div>
</section>

<style>
  .creacion {
    position: relative;
    min-height: 100%;
    min-height: 100dvh;
    display: grid;
    justify-items: center;
    padding: var(--pad-y) var(--pad-x) 40px;
    align-content: start;
  }
  .col {
    width: min(100%, 460px);
    display: grid;
    gap: 22px;
  }
  header { display: grid; gap: 10px; }
  .nombre { display: flex; flex-wrap: wrap; column-gap: 0.28em; }
  .palabra { display: inline-flex; }
  .letra {
    display: inline-block;
    animation: creacion-letra 0.55s var(--ease-out) both;
  }
  .tinta {
    color: var(--c2);
    animation: creacion-eco 0.7s var(--ease-out) 0.45s both;
  }
  .frase {
    margin: 0;
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(22px, 4vw, 34px);
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: -0.02em;
    color: var(--ink-title);
    text-wrap: balance;
  }
  .polaroid {
    background: #f4efe8;
    color: #241628;
    padding: 14px 14px 16px;
    display: grid;
    gap: 16px;
    box-shadow: 0 18px 40px rgba(8, 0, 16, 0.28);
  }
  .borde {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px 12px;
    padding: 2px 4px 0;
  }
  .meta {
    margin: 0;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #3a2844;
  }
  .polaroid :global(button.boton) {
    color: #2a1834;
    border-color: rgba(42, 24, 52, 0.35);
    background: transparent;
  }
  .polaroid :global(button.boton:focus-visible) {
    outline-color: #2a1834;
  }

  @keyframes creacion-letra {
    from { opacity: 0; transform: translateY(0.18em); }
    to { opacity: 1; transform: none; }
  }
  @keyframes creacion-eco {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .letra,
    .tinta {
      animation: none;
    }
  }

  :global(html.reduce) .letra,
  :global(html.reduce) .tinta {
    animation: none;
  }
</style>
