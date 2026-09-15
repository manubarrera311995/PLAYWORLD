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
    amplitudDe,
    caracterDe,
    fill,
    generosDe,
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
  import Generos from "./Generos.svelte";
  import Boton from "../../ui/Boton.svelte";
  import { navigate } from "../director/router";

  type Props = { year: number };
  let { year }: Props = $props();

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
    if (info.split) return copy.tesis.partida;
    return fill(copy.tesis.simple, {
      character: copy.character[info.kind],
      energyMedian: round(info.energy?.median),
    });
  });
  const thesisLead = $derived(
    info.split
      ? copy.tesisLead.partida
      : fill(copy.tesisLead.simple, { diff: copy.tesisLeadDiff[amplitudDe(info.energy?.iqr)] }),
  );
  const happySpread = $derived(amplitudDe(info.happy?.iqr));
  const aggressiveSpread = $derived(amplitudDe(info.aggressive?.iqr));
  const mix = $derived(generosDe(tracks));
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
      <div class="year" data-in>
        <h1 id="page-title">{year}</h1>
      </div>
      <div class="side" data-in>
        <p class="thesis">{thesis}</p>
        <p class="thesis-lead">{thesisLead}</p>
        <div class="stats">
          <div class="stat"><strong>{tracks.length}</strong><span>{copy.stats.songs}</span></div>
          <div class="stat"><strong>{info.minorShare}%</strong><span>{copy.stats.minor}</span></div>
          <div class="stat is-words">
            <strong>{copy.stats.spread[happySpread]}</strong>
            <span>{copy.stats.happy}</span>
          </div>
          <div class="stat is-words">
            <strong>{copy.stats.spread[aggressiveSpread]}</strong>
            <span>{copy.stats.aggressive}</span>
          </div>
          <p class="stats-hint">{copy.statsHint}</p>
        </div>
        <Generos {mix} />
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
      <div class="split split--campo">
        <Campo {tracks} {selected} {selectedAct} onselect={elegirCancion} />
        <PanelCancion {tracks} {selected} {year} />
      </div>
    </section>

    <section class="chapter chapter--wide" id="actos" aria-labelledby="actos-title">
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
    width: 100%;
  }
  .opening,
  .jump,
  .foot,
  .chapter:not(.chapter--wide) {
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
  .opening {
    min-height: 100dvh;
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
    align-content: center;
    align-items: center;
    gap: clamp(28px, 6vw, 90px);
    padding: 48px var(--pad-x) 72px;
  }
  .year {
    display: grid;
    align-items: center;
    justify-items: center;
    align-self: stretch;
    min-height: 0;
    text-align: center;
  }
  h1 {
    margin: 0;
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(112px, 26vw, 340px);
    font-weight: 400;
    line-height: 0.72;
    letter-spacing: -0.045em;
  }
  .thesis {
    max-width: 26ch;
    font-size: clamp(22px, 3vw, 40px);
    line-height: 1.12;
    letter-spacing: -0.03em;
  }
  .thesis-lead {
    max-width: 38ch;
    margin-top: 12px;
    color: var(--ink-soft);
    font-size: 13px;
    line-height: 1.45;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 18px;
    margin-top: 28px;
  }
  .stats-hint {
    grid-column: 1 / -1;
    margin: 2px 0 0;
    max-width: 46ch;
    color: var(--ink-mute);
    font-size: 11px;
    line-height: 1.45;
    letter-spacing: 0;
    text-transform: none;
  }
  .stat strong {
    display: block;
    font-family: Anton, Impact, sans-serif;
    font-size: 28px;
    letter-spacing: -0.03em;
  }
  .stat.is-words strong {
    font-size: clamp(20px, 2.2vw, 26px);
    line-height: 1.05;
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
  .chapter--wide {
    width: 100%;
  }
  .split {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.8fr);
    gap: clamp(28px, 4vw, 64px);
    align-items: start;
  }
  .split--campo {
    grid-template-areas:
      "map panel"
      "legend legend";
    row-gap: 16px;
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
    .split--campo {
      grid-template-areas:
        "map"
        "panel"
        "legend";
    }
    h1 {
      font-size: clamp(96px, 32vw, 180px);
    }
  }
</style>
