<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import type { Track } from "../../datos/tipos";
  import { tracksAPaleta } from "../../datos/color";
  import { aplicarPaleta } from "../../sketches/paleta";
  import { ensureGsap } from "../../motion/gsap";
  import { reduce } from "../../motion/reducedMotion";
  import { cargarTracks } from "../../datos/archivo";
  import { actPrefix, caracterDe, dnaNum, fill, groupActs, median, round, values } from "./ficha";
  import { RASGO_KEYS, filasArtistas, tempoDe, type RasgoKey } from "./lectura";
  import { binsDe, binsTempo, colorGenero, ejeDe, escalaDe, etiquetaGenero, pasaFiltro, puntoDe } from "./nube";
  import copy from "./edicion.copy.json";
  import contextos from "./contextos.json";
  import Boton from "../../ui/Boton.svelte";
  import { navigate } from "../director/router";
  import FiltrosAnio from "./FiltrosAnio.svelte";
  import VistaNube from "./VistaNube.svelte";
  import VistaRasgos from "./VistaRasgos.svelte";
  import VistaNotas from "./VistaNotas.svelte";
  import VistaCartel from "./VistaCartel.svelte";
  import FichaLado from "./FichaLado.svelte";

  type Vista = "nube" | "rasgos" | "notas" | "cartel";
  type Props = { year: number };
  let { year }: Props = $props();

  let tracks = $state.raw<Track[]>([]);
  let loading = $state(true);
  let vista = $state<Vista>("nube");
  let q = $state("");
  let genres = $state<string[]>([]);
  let selectedAct = $state<string | null>(null);
  let selectedSong = $state<string | null>(null);
  let xKey = $state<RasgoKey>("energy");
  let yKey = $state<RasgoKey>("oscuridad");
  let hoverAct = $state<string | null>(null);

  onMount(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await cargarTracks(year);
        if (cancelled) return;
        tracks = list;
        if (list.length) aplicarPaleta(tracksAPaleta(list.slice(0, 9)));
      } catch {
        if (cancelled) return;
        tracks = [];
      } finally {
        if (!cancelled) loading = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  });

  const contexto = $derived(
    (contextos as Record<string, { titulo: string; parrafos: string[] }>)[String(year)],
  );
  const info = $derived(caracterDe(tracks));
  const tempoAnio = $derived(tempoDe(tracks));
  const vacio = copy.tablero.unlabeled;
  const filtro = $derived({ q, genres, prefix: selectedAct });
  const visibles = $derived(
    tracks.filter((track) => pasaFiltro(track, filtro, actPrefix(track.id), etiquetaGenero(track, vacio))),
  );
  const opciones = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const track of tracks) {
      if (!pasaFiltro(track, { q, genres: [], prefix: selectedAct }, actPrefix(track.id), etiquetaGenero(track, vacio))) continue;
      const label = etiquetaGenero(track, vacio);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
      .map(([label]) => label);
  });
  const artistas = $derived.by(() => {
    const base = tracks.filter((track) =>
      pasaFiltro(track, { q, genres, prefix: null }, actPrefix(track.id), etiquetaGenero(track, vacio)),
    );
    return groupActs(base)
      .map((act) => ({
        prefix: act.prefix,
        artist: act.artist,
        n: act.songs.length,
        art: act.songs.find((song) => song.art)?.art ?? null,
      }))
      .sort((a, b) => b.n - a.n || a.artist.localeCompare(b.artist, "es"));
  });
  const puntos = $derived(
    tracks.flatMap((track) => {
      const punto = puntoDe(track, xKey, yKey);
      if (!punto) return [];
      const prefix = actPrefix(track.id);
      return [{
        id: track.id,
        x: punto.x,
        y: punto.y,
        color: colorGenero(etiquetaGenero(track, vacio)),
        on: pasaFiltro(track, filtro, prefix, etiquetaGenero(track, vacio)),
        prefix,
        artist: track.artist.split(",")[0]?.trim() || track.artist,
        title: track.track,
      }];
    }),
  );
  const cruce = $derived.by(() => {
    const mx = median(values(visibles, xKey));
    const my = median(values(visibles, yKey));
    if (mx == null || my == null) return null;
    return { x: ejeDe(mx, "x"), y: ejeDe(my, "y") };
  });
  const cards = $derived(
    RASGO_KEYS.flatMap((key) => {
      const nums = values(visibles, key);
      const med = median(nums);
      if (med == null) return [];
      return [{ key, median: round(med), bins: binsDe(nums) }];
    }),
  );
  const tempoVista = $derived(tempoDe(visibles));
  const tempoCard = $derived(
    tempoVista ? { median: round(tempoVista.median), bins: binsTempo(values(visibles, "tempo")) } : null,
  );
  const notas = $derived(escalaDe(visibles));
  const lectura = $derived(filasArtistas(visibles, yKey));
  const trait = $derived((copy.moods as Record<string, string>)[yKey] ?? yKey);
  const cancion = $derived(tracks.find((track) => track.id === selectedSong) ?? null);
  const cabeza = $derived.by(() => {
    if (cancion) {
      return {
        porta: true,
        art: cancion.art,
        titulo: cancion.artist.split(",")[0]?.trim() || cancion.artist,
        subtitulo: `‘${cancion.track}’`,
        meta: [cancion.dna.scale, cancion.dna.keyNote].filter(Boolean).join(" · "),
      };
    }
    const titulo =
      visibles.length === tracks.length
        ? copy.tablero.year
        : visibles.length === 1
          ? copy.tablero.one
          : fill(copy.tablero.many, { n: visibles.length });
    return { porta: false, art: null, titulo, subtitulo: copy.tablero.medians, meta: "" };
  });
  const filasFicha = $derived(
    RASGO_KEYS.flatMap((key) => {
      const value = cancion ? dnaNum(cancion, key) : median(values(visibles, key));
      if (value == null) return [];
      return [{ key, value: round(value) }];
    }),
  );
  const tempoFicha = $derived(
    cancion && Number.isFinite(cancion.dna.tempo) ? round(cancion.dna.tempo) : tempoVista ? round(tempoVista.median) : null,
  );
  const menorFicha = $derived.by(() => {
    if (cancion || !visibles.length) return "";
    const tonal = visibles.filter((track) => track.dna.scale === "Menor" || track.dna.scale === "Mayor").length;
    if (!tonal) return "";
    const menor = visibles.filter((track) => track.dna.scale === "Menor").length;
    return `${Math.round((100 * menor) / tonal)}%`;
  });
  const binsFicha = $derived(binsDe(values(visibles, yKey)));
  const marca = $derived(cancion ? dnaNum(cancion, yKey) : null);
  const filtrado = $derived(Boolean(q.trim() || genres.length || selectedAct));

  $effect(() => {
    if (selectedSong && !visibles.some((track) => track.id === selectedSong)) selectedSong = null;
  });

  function elegirGenero(label: string): void {
    genres = genres.includes(label) ? genres.filter((item) => item !== label) : [...genres, label];
  }

  function elegirActo(prefix: string): void {
    selectedAct = selectedAct === prefix ? null : prefix;
    hoverAct = null;
  }

  function elegirCancion(id: string | null): void {
    selectedSong = !id || selectedSong === id ? null : id;
  }

  function elegirRasgo(key: RasgoKey): void {
    yKey = key;
  }

  function limpiar(): void {
    q = "";
    genres = [];
    selectedAct = null;
  }

  function onEscape(e: KeyboardEvent): void {
    if (e.key !== "Escape") return;
    if (selectedSong) selectedSong = null;
    else selectedAct = null;
  }

  function montar(el: HTMLElement) {
    if (get(reduce)) return;
    const gsap = ensureGsap();
    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll("[data-in]"), {
        y: 18,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
      });
    }, el);
    return () => ctx.revert();
  }
</script>

<svelte:window onkeydown={onEscape} />

{#if loading}
  <p class="status">{copy.loading}</p>
{:else if !tracks.length}
  <div class="empty">
    <h1>{year}</h1>
    {#if contexto}
      <p class="contexto-titulo">{contexto.titulo}</p>
      {#each contexto.parrafos as parrafo}
        <p class="contexto">{parrafo}</p>
      {/each}
    {:else}
      <p class="contexto-titulo">{copy.emptyTitle}</p>
      <p class="contexto">{copy.emptyBody}</p>
    {/if}
    <Boton onclick={() => navigate("/archivo")}>{copy.back}</Boton>
  </div>
{:else}
  <article class="ficha" {@attach montar}>
    <header class="opening">
      <div class="year" data-in>
        <h1 id="page-title">{year}</h1>
      </div>
      <div class="relato" data-in>
        {#if contexto}
          <p class="contexto-titulo">{contexto.titulo}</p>
          {#each contexto.parrafos as parrafo}
            <p class="contexto">{parrafo}</p>
          {/each}
        {/if}
        <div class="stats">
          <div class="stat"><strong>{tracks.length}</strong><span>{copy.stats.songs}</span></div>
          <div class="stat"><strong>{info.minorShare}%</strong><span>{copy.stats.minor}</span></div>
          <div class="stat"><strong>{info.nActs}</strong><span>{copy.stats.acts}</span></div>
          <div class="stat"><strong>{tempoAnio ? round(tempoAnio.median) : "—"}</strong><span>{copy.stats.tempo}</span></div>
        </div>
      </div>
    </header>

    <nav class="vistas" aria-label={copy.tablero.vistas}>
      <span>{copy.tablero.vistas}</span>
      {#each copy.vistas as item (item.id)}
        <button
          type="button"
          class={[vista === item.id && "is-on"]}
          aria-pressed={vista === item.id}
          onclick={() => (vista = item.id as Vista)}
        >{item.label}</button>
      {/each}
    </nav>

    <div class="tablero">
      <FiltrosAnio
        {q}
        {genres}
        {opciones}
        {artistas}
        artist={selectedAct}
        {filtrado}
        onq={(value) => (q = value)}
        ongenre={elegirGenero}
        onartist={elegirActo}
        onhover={(prefix) => (hoverAct = prefix)}
        onclear={limpiar}
      />
      <div class="escenario">
        {#if vista === "nube"}
          <VistaNube
            {puntos}
            {xKey}
            {yKey}
            selectedId={selectedSong}
            hoverPrefix={hoverAct}
            {cruce}
            onx={(key) => (xKey = key)}
            ony={elegirRasgo}
            onsong={elegirCancion}
          />
        {:else if vista === "rasgos"}
          <VistaRasgos {cards} tempo={tempoCard} {yKey} ontrait={elegirRasgo} />
        {:else if vista === "notas"}
          <VistaNotas {notas} />
        {:else}
          <VistaCartel
            {lectura}
            {trait}
            {selectedAct}
            {selectedSong}
            onact={elegirActo}
            onsong={(id) => elegirCancion(id)}
          />
        {/if}
      </div>
      <FichaLado
        porta={cabeza.porta}
        art={cabeza.art}
        titulo={cabeza.titulo}
        subtitulo={cabeza.subtitulo}
        meta={cabeza.meta}
        filas={filasFicha}
        {yKey}
        tempo={tempoFicha}
        menor={menorFicha}
        bins={binsFicha}
        {marca}
        ontrait={elegirRasgo}
      />
    </div>

    <footer class="foot">
      <p>{copy.foot}</p>
      <div class="acciones">
        <Boton onclick={() => navigate("/archivo")}>{copy.back}</Boton>
        <Boton onclick={() => navigate("/ipod")}>{fill(copy.cta, { year })}</Boton>
      </div>
    </footer>
  </article>
{/if}

<style>
  .status,
  .empty {
    min-height: 70dvh;
    display: grid;
    place-content: center;
    padding: 80px 24px;
    text-align: center;
    gap: 12px;
  }
  .empty h1 {
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(36px, 6vw, 56px);
    font-weight: 400;
  }
  .ficha {
    width: min(1440px, 100%);
    min-height: 100%;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
  }
  .opening {
    display: grid;
    grid-template-columns: minmax(0, 0.78fr) minmax(320px, 1.22fr);
    align-items: stretch;
    gap: clamp(20px, 3vw, 48px);
    padding: 28px var(--pad-x) 8px;
  }
  .year {
    container-type: inline-size;
    min-width: 0;
    display: grid;
    place-items: center;
    text-align: center;
  }
  h1 {
    margin: 0;
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(140px, 48cqi, 248px);
    font-weight: 400;
    line-height: 0.78;
    letter-spacing: -0.045em;
  }
  .relato { display: grid; gap: 14px; align-content: start; min-width: 0; }
  .contexto-titulo {
    margin: 0;
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(22px, 2.4vw, 32px);
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: -0.03em;
  }
  .contexto { margin: 0; font-size: 15px; line-height: 1.5; color: var(--ink-soft); }
  .empty .contexto,
  .empty .contexto-titulo { margin-inline: auto; text-align: left; }
  .stats { display: flex; flex-wrap: wrap; gap: 0; margin-top: 4px; }
  .stat { padding: 0 16px; border-left: 1px solid rgba(255, 246, 239, 0.28); }
  .stat:first-child { padding-left: 0; border-left: 0; }
  .stat strong {
    display: block;
    font-family: Anton, Impact, sans-serif;
    font-size: 28px;
    font-weight: 400;
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .stat span {
    display: block;
    margin-top: 5px;
    color: var(--ink-mute);
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .tablero {
    display: grid;
    grid-template-columns: 248px minmax(0, 1fr) 280px;
    gap: 16px;
    flex: none;
    height: clamp(420px, calc(100dvh - 440px), 680px);
    min-height: 420px;
    padding: 12px var(--pad-x) 0;
  }
  .escenario { min-width: 0; min-height: 0; }
  .vistas,
  .foot { width: min(1440px, 100%); margin-inline: auto; }
  .vistas {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;
    align-items: baseline;
    padding: 10px var(--pad-x) 0;
    color: var(--ink-mute);
    font-size: 12px;
  }
  .vistas button {
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-mute);
    font: inherit;
    cursor: pointer;
  }
  .vistas button.is-on,
  .vistas button:hover { color: var(--ink); }
  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 28px;
    justify-content: space-between;
    align-items: center;
    padding: 18px var(--pad-x) 36px;
    color: var(--ink-mute);
    font-size: 11px;
  }
  .acciones { display: flex; gap: 8px; }
  @media (max-width: 980px) {
    .opening, .tablero { grid-template-columns: 1fr; }
    .tablero { height: auto; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; }
    .stat { padding: 0; border-left: 0; }
    .escenario { min-height: 520px; }
    h1 { font-size: clamp(112px, 38vw, 200px); }
  }
</style>
