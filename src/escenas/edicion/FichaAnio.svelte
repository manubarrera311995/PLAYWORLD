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
  import { RASGO_KEYS, filasArtistas, type RasgoKey } from "./lectura";
  import {
    binsDe,
    colorGenero,
    ejeDe,
    escalaDe,
    etiquetaGenero,
    paisDeActo,
    pasaFiltro,
    puntoDe,
  } from "./nube";
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
  import { cartelDe } from "../archivo/carteles";
  import { urlEmbedPlaylist, urlTrack } from "../../datos/playlists";

  type Vista = "nube" | "rasgos" | "notas" | "cartel";
  type Props = { year: number };

  const GIROS = [-2.4, 2.6, -3, 2.2, 3, -2.6] as const;

  function giroDe(anio: number): number {
    return GIROS[Math.abs(anio) % GIROS.length];
  }
  let { year }: Props = $props();

  let tracks = $state.raw<Track[]>([]);
  let loading = $state(true);
  let vista = $state<Vista>("nube");
  let q = $state("");
  let genres = $state<string[]>([]);
  let countries = $state<string[]>([]);
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

  const cartel = $derived(cartelDe(year));
  const playlist = $derived(urlEmbedPlaylist(year));
  let cartelRoto = $state(false);
  let ratioCartel = $state(0.72);
  const hoja = $derived(cartel != null && !cartelRoto);
  const giro = $derived(giroDe(year));
  let luz = $state<HTMLDialogElement | null>(null);

  function medirCartel(event: Event): void {
    const img = event.currentTarget;
    if (!(img instanceof HTMLImageElement)) return;
    if (!img.naturalWidth || !img.naturalHeight) return;
    ratioCartel = img.naturalWidth / img.naturalHeight;
  }
  const contexto = $derived(
    (contextos as Record<string, { titulo: string; parrafos: string[] }>)[String(year)],
  );
  const info = $derived(caracterDe(tracks));
  const vacio = copy.tablero.unlabeled;
  const vacioPais = copy.tablero.unlabeledCountry;
  const paisPorActo = $derived.by(() => {
    const map = new Map<string, string>();
    for (const act of groupActs(tracks)) {
      map.set(act.prefix, paisDeActo(act.songs, vacioPais));
    }
    return map;
  });
  const nGeneros = $derived.by(() => {
    const labels = new Set<string>();
    for (const track of tracks) {
      const label = etiquetaGenero(track, vacio);
      if (label !== vacio) labels.add(label);
    }
    return labels.size;
  });
  const nPaises = $derived.by(() => {
    const labels = new Set<string>();
    for (const label of paisPorActo.values()) {
      if (label !== vacioPais) labels.add(label);
    }
    return labels.size;
  });
  const filtro = $derived({ q, genres, countries, prefix: selectedAct });
  const visibles = $derived(
    tracks.filter((track) => {
      const prefix = actPrefix(track.id);
      return pasaFiltro(
        track,
        filtro,
        prefix,
        etiquetaGenero(track, vacio),
        paisPorActo.get(prefix) ?? vacioPais,
      );
    }),
  );
  const opciones = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const track of tracks) {
      const prefix = actPrefix(track.id);
      if (
        !pasaFiltro(
          track,
          { q, genres: [], countries, prefix: selectedAct },
          prefix,
          etiquetaGenero(track, vacio),
          paisPorActo.get(prefix) ?? vacioPais,
        )
      ) {
        continue;
      }
      const label = etiquetaGenero(track, vacio);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
      .map(([label]) => label);
  });
  const opcionesPais = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const act of groupActs(tracks)) {
      const sample = act.songs[0];
      if (!sample) continue;
      if (
        !pasaFiltro(
          sample,
          { q, genres, countries: [], prefix: selectedAct },
          act.prefix,
          etiquetaGenero(sample, vacio),
          paisPorActo.get(act.prefix) ?? vacioPais,
        )
      ) {
        continue;
      }
      const label = paisPorActo.get(act.prefix) ?? vacioPais;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
      .map(([label]) => label);
  });
  const artistas = $derived.by(() => {
    const base = tracks.filter((track) => {
      const prefix = actPrefix(track.id);
      return pasaFiltro(
        track,
        { q, genres, countries, prefix: null },
        prefix,
        etiquetaGenero(track, vacio),
        paisPorActo.get(prefix) ?? vacioPais,
      );
    });
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
        on: pasaFiltro(
          track,
          filtro,
          prefix,
          etiquetaGenero(track, vacio),
          paisPorActo.get(prefix) ?? vacioPais,
        ),
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
        meta: [
          cancion.dna.scale,
          cancion.dna.keyNote,
          Number.isFinite(cancion.dna.tempo) ? `${round(cancion.dna.tempo)} bpm` : "",
        ].filter(Boolean).join(" · "),
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
  const filtrado = $derived(Boolean(q.trim() || genres.length || countries.length || selectedAct));

  $effect(() => {
    if (selectedSong && !visibles.some((track) => track.id === selectedSong)) selectedSong = null;
  });

  function elegirGenero(label: string): void {
    genres = genres.includes(label) ? genres.filter((item) => item !== label) : [...genres, label];
  }

  function elegirPais(label: string): void {
    countries = countries.includes(label)
      ? countries.filter((item) => item !== label)
      : [...countries, label];
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
    countries = [];
    selectedAct = null;
  }

  function abrirCartel(): void {
    luz?.showModal();
  }

  function cerrarCartel(): void {
    luz?.close();
  }

  function clicLuz(event: MouseEvent): void {
    if (event.target === luz) luz?.close();
  }

  function onEscape(e: KeyboardEvent): void {
    if (e.key !== "Escape") return;
    if (luz?.open) return;
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

<article class="ficha">
  {#if loading}
    <p class="status">{copy.loading}</p>
  {:else if !tracks.length}
    <div class="empty">
      <h1 id="page-title" class="tipo-anio">{year}</h1>
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
  <div class="cuerpo" {@attach montar}>
    <header class="opening" class:con-hoja={hoja} style:--ratio={ratioCartel}>
      {#if hoja}
        <div class="muro">
          <button
            type="button"
            class="hoja"
            data-in
            style:--giro="{giro}deg"
            aria-label="Ver el cartel de {year}"
            onclick={abrirCartel}
          >
            <span class="pliego">
              <img
                src={cartel}
                alt=""
                draggable="false"
                onload={medirCartel}
                onerror={() => (cartelRoto = true)}
              />
            </span>
          </button>
        </div>
      {/if}
      <div class="lado">
        <div class="year" data-in>
          <h1 id="page-title" class="tipo-anio">{year}</h1>
        </div>
        <div class="relato" data-in>
          {#if contexto}
            <p class="contexto-titulo">{contexto.titulo}</p>
            {#each contexto.parrafos as parrafo}
              <p class="contexto">{parrafo}</p>
            {/each}
          {/if}
          <div class="cierre">
            <div class="stats">
              <div class="stat"><strong>{tracks.length}</strong><span>{copy.stats.songs}</span></div>
              <div class="stat"><strong>{info.minorShare}%</strong><span>{copy.stats.minor}</span></div>
              <div class="stat"><strong>{info.nActs}</strong><span>{copy.stats.acts}</span></div>
              <div class="stat"><strong>{nGeneros}</strong><span>{copy.stats.genres}</span></div>
              <div class="stat"><strong>{nPaises}</strong><span>{copy.stats.countries}</span></div>
            </div>
            {#if playlist}
              <iframe
                class="playlist"
                title="Playlist de {year} en Spotify"
                src={playlist}
                height="152"
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                allowfullscreen
              ></iframe>
            {/if}
          </div>
        </div>
      </div>
    </header>
    {#if hoja}
      <dialog class="luz" bind:this={luz} aria-label="Cartel del Festival Estéreo Picnic {year}" onclick={clicLuz}>
        <button type="button" class="luz-cerrar" onclick={cerrarCartel}>Cerrar</button>
        <img src={cartel} alt="Cartel del Festival Estéreo Picnic {year}" />
      </dialog>
    {/if}

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
        {countries}
        {opciones}
        opcionesPais={opcionesPais}
        {artistas}
        artist={selectedAct}
        {filtrado}
        onq={(value) => (q = value)}
        ongenre={elegirGenero}
        oncountry={elegirPais}
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
          <VistaRasgos {cards} {yKey} />
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
        enlace={cancion?.spotifyId ? urlTrack(cancion.spotifyId) : null}
        filas={filasFicha}
        {yKey}
        ontrait={elegirRasgo}
      />
    </div>

    <footer class="foot">
      <p>{copy.foot}</p>
      <div class="acciones">
        <Boton href={`/data/archivo/tracks.${year}.json`} download={`playworld-${year}.json`}>{copy.download}</Boton>
        <Boton onclick={() => navigate("/archivo")}>{copy.back}</Boton>
        <Boton onclick={() => navigate("/ipod")}>{fill(copy.cta, { year })}</Boton>
      </div>
    </footer>
  </div>
  {/if}
</article>

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
  .ficha {
    width: min(1440px, 100%);
    min-height: 100%;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
  }
  .cuerpo { display: flex; flex-direction: column; min-width: 0; }
  .opening {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    gap: clamp(20px, 3vw, 48px);
    padding: 28px var(--pad-x) 8px;
  }
  .opening.con-hoja {
    grid-template-columns: auto minmax(280px, 1fr);
    gap: clamp(28px, 3.5vw, 56px);
  }
  .muro {
    min-width: 0;
  }
  .opening.con-hoja .muro {
    width: min(clamp(220px, 42vw, 460px), calc(min(72dvh, 660px) * var(--ratio, 0.72)));
    max-width: 100%;
  }
  .lado {
    display: grid;
    align-content: start;
    gap: 14px;
    min-width: 0;
  }
  .year {
    container-type: inline-size;
    min-width: 0;
    width: 100%;
    display: grid;
    place-items: start;
    text-align: left;
  }
  .hoja {
    width: 100%;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    cursor: pointer;
    display: block;
    line-height: 0;
  }
  .hoja:focus-visible {
    outline: 1px solid var(--ink);
    outline-offset: 6px;
  }
  .pliego {
    display: block;
    border: 1px solid rgba(255, 246, 239, 0.62);
    border-radius: 2px;
    box-shadow: 0 18px 48px rgba(16, 10, 18, 0.34);
    transform: rotate(var(--giro));
    transform-origin: 50% 42%;
    transition: transform 0.45s var(--ease-out);
  }
  .hoja:hover .pliego,
  .hoja:focus-visible .pliego {
    transform: rotate(0deg) scale(1.018);
  }
  .hoja img {
    width: 100%;
    height: auto;
    max-height: min(72dvh, 660px);
    object-fit: contain;
    object-position: left top;
  }
  .luz {
    width: min(920px, calc(100vw - 48px));
    max-height: calc(100dvh - 48px);
    margin: auto;
    padding: 16px 16px 20px;
    border: 1px solid rgba(255, 246, 239, 0.35);
    border-radius: 2px;
    background: var(--bg-deep);
    color: var(--ink);
  }
  .luz::backdrop {
    background: rgba(16, 10, 18, 0.78);
  }
  .luz img {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: calc(100dvh - 120px);
    margin-inline: auto;
    object-fit: contain;
  }
  .luz-cerrar {
    display: block;
    margin: 0 0 12px auto;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-mute);
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .luz-cerrar:hover { color: var(--ink); }
  .relato { display: grid; gap: 14px; align-content: start; min-width: 0; }
  .contexto-titulo {
    margin: 0;
    font-family: Outfit, sans-serif;
    font-size: clamp(22px, 2.4vw, 32px);
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: -0.03em;
  }
  .contexto { margin: 0; font-size: 15px; line-height: 1.5; color: var(--ink-soft); }
  .empty .contexto,
  .empty .contexto-titulo { margin-inline: auto; text-align: left; }
  .cierre {
    display: flex;
    align-items: center;
    gap: 28px;
    margin-top: 4px;
  }
  .stats { display: flex; flex: 1; flex-wrap: wrap; gap: 0; min-width: 0; }
  .stat { padding: 0 16px; border-left: 1px solid rgba(255, 246, 239, 0.28); }
  .stat:first-child { padding-left: 0; border-left: 0; }
  .stat strong {
    display: block;
    font-family: Outfit, sans-serif;
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
  .playlist {
    flex: 0 0 280px;
    width: 280px;
    height: 152px;
    border: 0;
    border-radius: 12px;
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
  .acciones { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
  @media (max-width: 980px) {
    .tablero { grid-template-columns: 1fr; height: auto; }
    .cierre { flex-direction: column; align-items: stretch; }
    .playlist { flex-basis: auto; width: 100%; max-width: 420px; }
    .stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px 24px; }
    .stat { padding: 0; border-left: 0; }
    .escenario { min-height: 520px; }
  }
  @media (max-width: 900px) {
    .opening,
    .opening.con-hoja { grid-template-columns: 1fr; }
    .lado { order: -1; }
    .year { place-items: center; text-align: center; }
    .muro,
    .opening.con-hoja .muro {
      width: min(86vw, 420px, calc(min(68dvh, 640px) * var(--ratio, 0.72)));
      max-width: 100%;
      margin-inline: auto;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .pliego,
    .hoja:hover .pliego,
    .hoja:focus-visible .pliego {
      transition: none;
      transform: rotate(var(--giro));
    }
  }
</style>
