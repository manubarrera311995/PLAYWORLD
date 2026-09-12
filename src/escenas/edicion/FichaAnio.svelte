<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import type { Track } from "../../datos/tipos";
  import { tracksAPaleta } from "../../datos/color";
  import { aplicarPaleta } from "../../sketches/paleta";
  import { ensureGsap } from "../../motion/gsap";
  import { reduce } from "../../motion/reducedMotion";
  import { cargarTracks } from "../../datos/archivo";
  import {
    actPrefix,
    caracterDe,
    fill,
    groupActs,
    median,
    round,
    values,
  } from "./ficha";
  import copy from "./edicion.copy.json";
  import Capitulo from "./Capitulo.svelte";
  import Lineup from "./Lineup.svelte";
  import Fingerprint from "./Fingerprint.svelte";
  import Polos from "./Polos.svelte";
  import Campo from "./Campo.svelte";
  import PanelCancion from "./PanelCancion.svelte";
  import Actos from "./Actos.svelte";
  import Boton from "../../ui/Boton.svelte";
  import { navigate } from "../director/router";

  type Props = { year: number; anios?: number[] };
  let { year, anios = [] }: Props = $props();

  let tracks = $state.raw<Track[]>([]);
  let loading = $state(true);
  let selected = $state.raw<Track | null>(null);
  let selectedAct = $state<string | null>(null);
  let jumpOn = $state("tesis");

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

  const info = $derived(caracterDe(tracks));
  const thesis = $derived.by(() => {
    const character = copy.character[info.kind];
    if (info.split && info.happy && info.energy && info.relaxed) {
      return fill(copy.tesis.partida, {
        character,
        happyIqr: round(info.happy.iqr),
        energyIqr: round(info.energy.iqr),
        relaxedIqr: round(info.relaxed.iqr),
      });
    }
    return fill(copy.tesis.simple, {
      character,
      energyMedian: round(info.energy?.median),
      energyIqr: round(info.energy?.iqr),
    });
  });
  const method = $derived(
    fill(copy.method, {
      n: tracks.length,
      acts: info.nActs,
      minor: info.minorShare,
      oscuridad: round(info.oscuridad?.median),
      nostalgia: round(info.nostalgia?.median),
    }),
  );
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
  function elegirCancion(song: Track): void {
    selected = song;
    selectedAct = actPrefix(song.id);
  }

  function elegirActo(prefix: string, scroll = false): void {
    if (!prefix || selectedAct === prefix) {
      selectedAct = null;
      selected = null;
      return;
    }
    const act = groupActs(tracks).find((item) => item.prefix === prefix);
    selectedAct = prefix;
    selected = act?.songs.find((song) => song.art) ?? act?.songs[0] ?? null;
    if (scroll) document.getElementById("campo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onEscape(e: KeyboardEvent): void {
    if (e.key !== "Escape") return;
    selected = null;
    selectedAct = null;
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
    <h1>{copy.emptyTitle}</h1>
    <p>{copy.emptyBody}</p>
    <Boton onclick={() => navigate("/archivo")}>{copy.back}</Boton>
  </div>
{:else}
  <article class="ficha" {@attach montar}>
    <section class="opening" aria-labelledby="page-title">
      <div data-in>
        <p class="kicker">{copy.eyebrow}</p>
        {#if anios.length}
          <nav class="years" aria-label="Cambiar edición">
            {#each anios as y (y)}
              <button type="button" class={[y === year && "is-on"]} onclick={() => navigate(`/edicion/${y}`)}>
                {y}
              </button>
            {/each}
          </nav>
        {/if}
        <h1 id="page-title">{year}</h1>
      </div>
      <div class="side" data-in>
        <p class="thesis">{thesis}</p>
        <p class="method">{method}</p>
        <div class="stats">
          <div class="stat"><strong>{tracks.length}</strong><span>{copy.stats.songs}</span></div>
          <div class="stat"><strong>{info.minorShare}%</strong><span>{copy.stats.minor}</span></div>
          <div class="stat"><strong>IQR {round(info.happy?.iqr)}</strong><span>{copy.stats.happy}</span></div>
          <div class="stat"><strong>IQR {round(info.aggressive?.iqr)}</strong><span>{copy.stats.aggressive}</span></div>
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
      <a class="cue" href="#tesis" onclick={(e) => irA("tesis", e)}>{copy.cue}</a>
    </section>

    <nav class="jump" aria-label="Capítulos">
      {#each copy.jump as item (item.id)}
        <a href="#{item.id}" class={[jumpOn === item.id && "is-on"]} onclick={(e) => irA(item.id, e)}>{item.label}</a>
      {/each}
    </nav>

    <section class="chapter" id="tesis" aria-labelledby="tesis-title">
      <Capitulo
        n={copy.chapters.tesis.n}
        eyebrow={copy.chapters.tesis.eyebrow}
        title={copy.chapters.tesis.title}
        titleId="tesis-title"
        question={copy.chapters.tesis.question}
        unit={copy.chapters.tesis.unit}
      />
      <div class="split">
        <Fingerprint {tracks} {selected} />
        <Polos {tracks} />
      </div>
    </section>

    <section class="chapter" id="campo" aria-labelledby="campo-title">
      <Capitulo
        n={copy.chapters.campo.n}
        eyebrow={copy.chapters.campo.eyebrow}
        title={copy.chapters.campo.title}
        titleId="campo-title"
        question={copy.chapters.campo.question}
        unit={copy.chapters.campo.unit}
      />
      <div class="split">
        <Campo {tracks} {selected} {selectedAct} onselect={elegirCancion} />
        <PanelCancion {tracks} {selected} {year} />
      </div>
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
      <Actos {tracks} {selectedAct} onact={elegirActo} />
    </section>

    <footer class="foot">
      <p>{copy.foot}</p>
      <div class="acciones">
        <Boton onclick={() => navigate("/archivo")}>{copy.back}</Boton>
        <Boton onclick={() => navigate("/ipod")}>{copy.cta}</Boton>
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
    width: min(1380px, 100%);
    margin: 0 auto;
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
  .opening {
    min-height: 100dvh;
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
    align-content: center;
    align-items: end;
    gap: clamp(28px, 6vw, 90px);
    padding: 48px var(--pad-x) 72px;
  }
  .kicker {
    margin-bottom: 12px;
    color: var(--ink-mute);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.23em;
    text-transform: uppercase;
  }
  .years {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 14px;
    margin: 0 0 8px;
  }
  .years button {
    appearance: none;
    border: 0;
    padding: 0;
    background: transparent;
    color: var(--ink-mute);
    font-size: 12px;
    letter-spacing: 0.12em;
    cursor: pointer;
  }
  .years button.is-on,
  .years button:hover {
    color: var(--ink);
  }
  h1 {
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(112px, 26vw, 340px);
    font-weight: 400;
    line-height: 0.72;
    letter-spacing: -0.045em;
  }
  .thesis {
    max-width: 22ch;
    font-size: clamp(22px, 3vw, 40px);
    line-height: 1.1;
    letter-spacing: -0.03em;
  }
  .method {
    margin-top: 18px;
    max-width: 56ch;
    color: var(--ink-mute);
    font-size: 11px;
    line-height: 1.55;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 18px;
    margin-top: 28px;
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
  }
  .cue {
    grid-column: 1 / -1;
    justify-self: start;
    margin-top: 8px;
    border-bottom: 1px solid var(--ink-soft);
    padding-bottom: 5px;
    color: var(--ink-soft);
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .chapter {
    padding: clamp(72px, 10vh, 120px) var(--pad-x);
    border-top: 1px solid rgba(255, 246, 239, 0.14);
    scroll-margin-top: 48px;
  }
  .split {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.8fr);
    gap: clamp(28px, 4vw, 64px);
    align-items: start;
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
    .split {
      grid-template-columns: 1fr;
    }
    h1 {
      font-size: clamp(96px, 32vw, 180px);
    }
  }
</style>
