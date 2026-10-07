<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import type { Track } from "../../datos/tipos";
  import { tracksAPaleta } from "../../datos/color";
  import { aplicarPaleta } from "../../sketches/paleta";
  import { ensureGsap } from "../../motion/gsap";
  import { reduce } from "../../motion/reducedMotion";
  import { cargarTracks } from "../../datos/archivo";
  import { actPrefix, caracterDe, fill, generosDe, groupActs, median, round, values } from "./ficha";
  import { RASGO_KEYS, filasArtistas, rasgosDe, tempoDe, tonalidadesDe, type RasgoKey } from "./lectura";
  import copy from "./edicion.copy.json";
  import contextos from "./contextos.json";
  import Capitulo from "./Capitulo.svelte";
  import Lineup from "./Lineup.svelte";
  import Rasgos from "./Rasgos.svelte";
  import Tonalidades from "./Tonalidades.svelte";
  import Actos from "./Actos.svelte";
  import Generos from "./Generos.svelte";
  import Boton from "../../ui/Boton.svelte";
  import { navigate } from "../director/router";

  type Props = { year: number };
  let { year }: Props = $props();

  let tracks = $state.raw<Track[]>([]);
  let loading = $state(true);
  let selectedAct = $state<string | null>(null);
  let selectedSong = $state<string | null>(null);
  let rasgo = $state<RasgoKey>("energy");
  let jumpOn = $state("clima");

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
  const cancion = $derived(tracks.find((track) => track.id === selectedSong) ?? null);
  const vista = $derived(cancion ? [cancion] : tracks);
  const vistaInfo = $derived(caracterDe(vista));
  const tempo = $derived(tempoDe(vista));
  const mix = $derived(generosDe(vista));
  const lineupActs = $derived(
    groupActs(tracks)
      .map((act) => ({ ...act, energy: median(values(act.songs, "energy")) }))
      .filter((act) => act.energy != null)
      .sort((a, b) => (b.energy ?? 0) - (a.energy ?? 0)),
  );
  const lineupNote = $derived.by(() => {
    const act = lineupActs.find((item) => item.prefix === selectedAct);
    if (act) return fill(copy.lineupNoteAct, { artist: act.artist, n: act.songs.length });
    return fill(copy.lineupNote, { n: lineupActs.length });
  });
  const rasgoOn = $derived(
    values(vista, rasgo).length ? rasgo : (RASGO_KEYS.find((key) => values(vista, key).length) ?? "energy"),
  );
  const rasgos = $derived(rasgosDe(vista));
  const lectura = $derived(filasArtistas(vista, rasgoOn));
  const notas = $derived(tonalidadesDe(vista));
  const trait = $derived((copy.moods as Record<string, string>)[rasgoOn] ?? rasgoOn);

  function elegirRasgo(key: RasgoKey): void {
    rasgo = key;
  }

  function elegirActo(prefix: string, scroll = false): void {
    if (!prefix || selectedAct === prefix) {
      selectedAct = null;
      selectedSong = null;
      return;
    }
    selectedAct = prefix;
    selectedSong = null;
    if (scroll) document.getElementById(`acto-${prefix}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function elegirCancion(id: string): void {
    if (selectedSong === id) {
      selectedSong = null;
      return;
    }
    selectedSong = id;
    selectedAct = actPrefix(id);
  }

  function onEscape(e: KeyboardEvent): void {
    if (e.key !== "Escape") return;
    selectedAct = null;
    selectedSong = null;
  }

  function irA(id: string, e: MouseEvent): void {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function montar(el: HTMLElement) {
    const root = el.closest(".escena-capa");
    const chapters = [...el.querySelectorAll<HTMLElement>(".chapter")];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        jumpOn = visible.target.id;
      },
      { root, rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.35] },
    );
    for (const chapter of chapters) obs.observe(chapter);

    let revert: (() => void) | undefined;
    if (!get(reduce)) {
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
      revert = () => ctx.revert();
    }
    return () => {
      obs.disconnect();
      revert?.();
    };
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
    <section class="opening" aria-labelledby="page-title">
      <div class="year" data-in>
        <h1 id="page-title">{year}</h1>
      </div>
      {#if contexto}
        <div class="relato" data-in>
          <p class="contexto-titulo">{contexto.titulo}</p>
          {#each contexto.parrafos as parrafo}
            <p class="contexto">{parrafo}</p>
          {/each}
        </div>
      {/if}
      <div class="metricas" data-in>
        <Generos {mix} />
        <div class="stats">
          <div class="stat"><strong>{vista.length}</strong><span>{copy.stats.songs}</span></div>
          <div class="stat"><strong>{vistaInfo.minorShare}%</strong><span>{copy.stats.minor}</span></div>
          <div class="stat"><strong>{vistaInfo.nActs}</strong><span>{copy.stats.acts}</span></div>
          <div class="stat"><strong>{tempo ? round(tempo.median) : "—"}</strong><span>{copy.stats.tempo}</span></div>
        </div>
      </div>
      <div class="cartel" data-in>
        <Lineup
          actos={lineupActs}
          {selectedAct}
          note={lineupNote}
          cartel={copy.cartel}
          onact={(prefix) => elegirActo(prefix, true)}
        />
      </div>
    </section>

    <nav class="jump" aria-label="Capítulos">
      {#each copy.jump as item (item.id)}
        <a href="#{item.id}" class={[jumpOn === item.id && "is-on"]} onclick={(e) => irA(item.id, e)}>{item.label}</a>
      {/each}
      {#if cancion}
        <button type="button" class="filtro" onclick={() => (selectedSong = null)}>
          <span>{cancion.artist.split(",")[0]?.trim()} — {cancion.track}</span>
          <span class="quitar">{copy.songClear}</span>
        </button>
      {/if}
    </nav>

    <section class="chapter" id="clima" aria-labelledby="clima-title">
      <Capitulo
        n={copy.chapters.clima.n}
        eyebrow={copy.chapters.clima.eyebrow}
        title={copy.chapters.clima.title}
        titleId="clima-title"
        question={copy.chapters.clima.question}
        unit={copy.chapters.clima.unit}
      />
      <Rasgos filas={rasgos} rasgo={rasgoOn} onrasgo={elegirRasgo} />
    </section>

    <section class="chapter" id="tonalidades" aria-labelledby="tonalidades-title">
      <Capitulo
        n={copy.chapters.tonalidades.n}
        eyebrow={copy.chapters.tonalidades.eyebrow}
        title={copy.chapters.tonalidades.title}
        titleId="tonalidades-title"
        question={copy.chapters.tonalidades.question}
        unit={copy.chapters.tonalidades.unit}
      />
      <Tonalidades {notas} />
    </section>

    <section class="chapter" id="actos" aria-labelledby="actos-title">
      <Capitulo
        n={copy.chapters.actos.n}
        eyebrow={copy.chapters.actos.eyebrow}
        title={copy.chapters.actos.title}
        titleId="actos-title"
        question={copy.chapters.actos.question}
        unit={copy.chapters.actos.unit}
      />
      <Actos {lectura} {trait} {selectedAct} {selectedSong} onact={elegirActo} onsong={elegirCancion} />
    </section>

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
    width: 100%;
  }
  .opening,
  .jump,
  .foot,
  .chapter {
    width: min(1380px, 100%);
    margin-inline: auto;
  }
  .jump {
    position: sticky;
    top: 0;
    z-index: 8;
    display: flex;
    gap: 18px;
    padding: 14px var(--pad-x) 10px;
  }
  .jump a {
    color: var(--ink-mute);
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  .jump a.is-on,
  .jump a:hover {
    color: var(--ink);
  }
  .filtro {
    margin-left: auto;
    display: inline-flex;
    gap: 10px;
    align-items: baseline;
    max-width: min(46ch, 70%);
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--c1);
    font: inherit;
    font-size: 12px;
    line-height: 1.3;
    text-align: left;
    cursor: pointer;
  }
  .filtro span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .quitar {
    flex: none;
    color: var(--ink-mute);
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .opening {
    min-height: 100dvh;
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
    align-content: center;
    align-items: center;
    gap: clamp(28px, 4vw, 64px);
    padding: 48px var(--pad-x) 72px;
  }
  .year {
    container-type: inline-size;
    min-width: 0;
    text-align: center;
  }
  .relato {
    display: grid;
    gap: 14px;
    align-content: center;
    min-width: 0;
    text-align: left;
  }
  h1 {
    margin: 0;
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(96px, 42cqi, 280px);
    font-weight: 400;
    line-height: 0.78;
    letter-spacing: -0.045em;
  }
  .contexto-titulo {
    margin: 0;
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(22px, 2.4vw, 32px);
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: -0.03em;
  }
  .contexto {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    color: var(--ink-soft);
  }
  .empty .contexto,
  .empty .contexto-titulo {
    margin-inline: auto;
    text-align: left;
  }
  .metricas {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
    align-items: center;
    gap: clamp(28px, 4vw, 64px);
    padding-top: 12px;
  }
  .metricas :global(.generos) {
    width: min(40ch, 100%);
    margin-top: 0;
    justify-self: center;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(2, auto);
    gap: 22px 56px;
    margin: 0;
    justify-self: center;
    justify-content: center;
    align-content: center;
    text-align: center;
  }
  .stat strong {
    display: block;
    font-family: Anton, Impact, sans-serif;
    font-size: 28px;
    letter-spacing: -0.03em;
  }
  .stat span {
    color: var(--ink-mute);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .cartel {
    grid-column: 1 / -1;
    overflow: visible;
  }
  .chapter {
    padding: clamp(72px, 10vh, 120px) var(--pad-x);
    border-top: 1px solid rgba(255, 246, 239, 0.14);
    scroll-margin-top: 48px;
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 28px;
    justify-content: space-between;
    align-items: center;
    padding: 28px var(--pad-x) 48px;
    border-top: 1px solid rgba(255, 246, 239, 0.14);
    color: var(--ink-mute);
    font-size: 11px;
  }
  .acciones {
    display: flex;
    gap: 8px;
  }
  @media (max-width: 980px) {
    .jump {
      overflow-x: auto;
    }
    .opening,
    .metricas {
      grid-template-columns: 1fr;
    }
    h1 {
      font-size: clamp(96px, 28vw, 180px);
    }
  }
</style>
