<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import Lcd from "./Lcd.svelte";
  import ClickWheel from "./ClickWheel.svelte";
  import Menu from "./pantallas/Menu.svelte";
  import Lista from "./pantallas/Lista.svelte";
  import Cancion from "./pantallas/Cancion.svelte";
  import MiIpod from "./pantallas/MiIpod.svelte";
  import copy from "./ipod.copy.json";
  import { dispatchIpod, ipod, resetIpod, setIpodCtx } from "./ipod.store";
  import { bindTeclado } from "./entrada/teclado";
  import {
    atrasDe,
    contarItems,
    enSeleccion,
    meterOQuitar,
    tituloDe,
    tracksDelAnio,
    visible,
    type EntradaIpod,
    type EstadoIpod,
    type Pantalla,
  } from "./maquina";
  import { cargarTracks } from "../datos/archivo";
  import { viewport } from "../estado/viewport";
  import { preferencias } from "../estado/preferencias";
  import { recorrido } from "../estado/recorrido";
  import { tracksAPaleta } from "../datos/color";
  import { aplicarPaleta } from "../sketches/paleta";
  import { paletaDefault } from "../datos/color";
  import type { Seleccion, Track } from "../datos/tipos";
  import { cargarSpotify, type MandoSpotify } from "./spotify";

  type Props = { oncerrar: (s: Seleccion) => void };
  let { oncerrar }: Props = $props();

  const estado = $derived($ipod);
  const v = $derived(visible(estado));
  const vp = $derived($viewport);
  const pref = $derived($preferencias);
  const rec = $derived($recorrido);
  const modo = $derived(
    pref.modoControl ?? (vp.modo === "compacto" || vp.pointer === "coarse" ? "toque" : "rueda"),
  );
  const nItems = $derived(contarItems(estado));
  const tituloLcd = $derived(
    v.kind === "menu" && estado.alias ? `iPod de ${estado.alias}` : tituloDe(v),
  );
  const atras = $derived(atrasDe(estado));
  const leyenda = $derived({
    menu: copy.teclas.menu,
    prev: copy.teclas.prev,
    next: copy.teclas.next,
    centro: leyendaCentro(v, estado),
    play: leyendaPlay(v, estado),
  });

  let mando: MandoSpotify | null = null;
  let quererOir = false;
  let escrito = $state("");
  let campo: HTMLInputElement | undefined = $state();

  function leyendaCentro(pantalla: Pantalla, e: EstadoIpod): string {
    if (pantalla.kind === "boot") return copy.teclas.centro.boot;
    if (pantalla.kind === "lista") return copy.teclas.centro.lista;
    if (pantalla.kind === "miIpod") return copy.teclas.centro.miIpod;
    if (pantalla.kind === "cancion") {
      if (enSeleccion(e, pantalla.track.id)) return copy.teclas.centro.metida;
      if (e.seleccion.length >= e.capacidad) return copy.teclas.centro.llena;
      return copy.teclas.centro.cancion;
    }
    return copy.teclas.centro.menu;
  }

  function leyendaPlay(pantalla: Pantalla, e: EstadoIpod): string {
    if (pantalla.kind !== "cancion") return leyendaCentro(pantalla, e);
    return pantalla.track.spotifyId ? copy.teclas.play : copy.teclas.sinAudio;
  }

  function onmando(siguiente: MandoSpotify | null): void {
    mando = siguiente;
    if (siguiente && quererOir) {
      quererOir = false;
      siguiente.oir();
    }
  }

  function onentrada(e: EntradaIpod): void {
    const antes = visible(get(ipod));
    const entrada: EntradaIpod =
      antes.kind === "boot" && (e.tipo === "select" || e.tipo === "play")
        ? { tipo: "select", alias: escrito }
        : e;
    if (entrada.tipo === "play" && antes.kind === "cancion") {
      if (mando) mando.alternar();
      else if (antes.track.spotifyId) quererOir = true;
    } else if (entrada.tipo === "play") {
      quererOir = true;
    }
    const next = dispatchIpod(entrada);
    if (visible(next).kind !== "cancion") quererOir = false;
    if (next.resaltada) aplicarPaleta(tracksAPaleta([next.resaltada]));
    if (next.cerrado) {
      oncerrar({
        trackIds: next.seleccion.map((t) => t.id),
        tracks: next.seleccion,
        yearHint: rec.yearHint,
        alias: next.alias || "",
        cerradaEn: new Date().toISOString(),
      });
    }
  }

  function saltar(i: number): void {
    onentrada({ tipo: "saltar", a: i });
    onentrada({ tipo: "select" });
  }

  onMount(() => {
    resetIpod();
    aplicarPaleta(paletaDefault);
    void cargarSpotify().catch(() => {});
    const stopKey = bindTeclado(onentrada);
    campo?.focus();
    const yearHint = get(recorrido).yearHint;
    const carga: Promise<Track[]> = yearHint == null ? Promise.resolve([]) : cargarTracks(yearHint);
    void carga.then((p) => {
      setIpodCtx({ pool: p, yearHint });
      ipod.update((s) => {
        const pantalla = visible(s);
        if (pantalla.kind !== "lista" || pantalla.tracks.length > 0) return s;
        const tracks = tracksDelAnio(p, yearHint);
        if (!tracks.length) return s;
        const lista: Pantalla = {
          kind: "lista",
          titulo: yearHint != null ? String(yearHint) : "Canciones",
          tracks,
        };
        return { ...s, pila: [...s.pila.slice(0, -1), lista] };
      });
    });
    return () => {
      stopKey();
    };
  });
</script>

<div class={["ipod", `ipod--${vp.modo}`, vp.corto && "ipod--corto"]}>
  <div class="ipod__cuerpo">
  <div class="ipod__well">
    <div class="ipod__lcd">
      <Lcd titulo={tituloLcd} {atras} n={estado.seleccion.length} capacidad={estado.capacidad} {onentrada}>
        {#if v.kind === "boot"}
          <form
            class="boot"
            onsubmit={(ev) => {
              ev.preventDefault();
              onentrada({ tipo: "select" });
            }}
          >
            <label class="boot__linea">
              <span>{copy.aliasDe}</span>
              <input
                bind:this={campo}
                bind:value={escrito}
                maxlength="12"
                autocomplete="nickname"
                autocapitalize="words"
                spellcheck="false"
                enterkeyhint="done"
                aria-label={copy.aliasDe}
                onkeydown={(ev) => {
                  if (ev.key !== "Enter") return;
                  ev.preventDefault();
                  onentrada({ tipo: "select" });
                }}
              />
            </label>
          </form>
        {:else if v.kind === "menu"}
          <Menu cursor={estado.cursor} n={estado.seleccion.length} year={rec.yearHint} onsaltar={saltar} />
        {:else if v.kind === "lista"}
          <Lista
            items={v.tracks}
            cursor={estado.cursor}
            onsaltar={saltar}
            metidas={estado.seleccion.map((t) => t.id)}
            vacio={rec.yearHint == null ? copy.sinAnio : undefined}
          />
        {:else if v.kind === "miIpod"}
          <MiIpod seleccion={estado.seleccion} cursor={estado.cursor} onsaltar={saltar} />
        {:else if v.kind === "cancion"}
          <Cancion
            track={v.track}
            metida={enSeleccion(estado, v.track.id)}
            llena={estado.seleccion.length >= estado.capacidad}
            {onmando}
            onmeter={() => {
              if (enSeleccion(estado, v.track.id)) {
                ipod.update((s) => meterOQuitar(s, v.track));
                return;
              }
              onentrada({ tipo: "select" });
            }}
          />
        {/if}
      </Lcd>
    </div>
  </div>
  <div class="ipod__wheel">
    {#key modo}
      <ClickWheel
        {modo}
        indice={estado.cursor}
        total={nItems}
        {onentrada}
        {leyenda}
      />
    {/key}
  </div>
  </div>
</div>

<style>
  .ipod {
    position: relative;
    container-type: inline-size;
    height: min(84dvh, 740px);
    max-height: 100%;
    width: auto;
    max-width: min(100%, 440px);
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    aspect-ratio: 618 / 1035;
    border-radius: 12% / 7.2%;
    background:
      radial-gradient(120% 55% at 50% 0%, rgba(255, 255, 255, 0.96), transparent 46%),
      linear-gradient(180deg, #fcfcfb 0%, #f0f0ee 46%, #e2e2df 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.95),
      inset 0 -3px 6px rgba(0, 0, 0, 0.06),
      0 0 0 1px #d0d0ce,
      0 0 0 2px #9c9c9a,
      0 1px 0 2px rgba(255, 255, 255, 0.65),
      0 28px 54px rgba(16, 10, 24, 0.4),
      0 8px 16px rgba(16, 10, 24, 0.18);
  }
  .ipod::after {
    content: "";
    position: absolute;
    inset: 1.5% 3% auto;
    height: 18%;
    border-radius: inherit;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.55), transparent);
  }
  .ipod__cuerpo {
    height: 100%;
    min-height: 0;
    min-width: 0;
    display: grid;
    grid-template-rows: minmax(0, 1.05fr) minmax(0, 0.95fr);
    align-items: stretch;
    justify-items: stretch;
    padding: 7.4cqw 6.6cqw 5.2cqw;
  }
  .ipod__well {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    padding: 3.4%;
    border-radius: 5px;
    background: linear-gradient(180deg, #2a2a2a 0%, #0a0a0a 38%, #161616 100%);
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.22),
      inset 0 -1px 2px rgba(0, 0, 0, 0.85),
      0 1px 0 rgba(255, 255, 255, 0.5);
  }
  .ipod__lcd {
    height: 100%;
    min-height: 0;
    min-width: 0;
    border-radius: 2px;
    overflow: hidden;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
  }
  .ipod__wheel {
    position: relative;
    z-index: 1;
    container-type: size;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    display: grid;
    place-items: center;
  }
  .ipod--compacto {
    height: min(64dvh, 560px);
    max-width: min(100%, 340px);
  }
  .ipod--corto {
    height: min(90dvh, 520px);
  }
  .boot {
    height: 100%;
    margin: 0;
    display: flex;
    align-items: center;
    padding: 18px 16px;
  }
  .boot__linea {
    display: flex;
    align-items: baseline;
    gap: 8px;
    width: 100%;
    color: #111;
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(18px, 2.6vw, 26px);
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  .boot__linea span { flex: none; }
  .boot__linea input {
    flex: 1;
    min-width: 0;
    width: 100%;
    border: 0;
    border-bottom: 2px solid #111;
    border-radius: 0;
    background: transparent;
    padding: 0 2px 2px;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
  }
  .boot__linea input:focus { outline: none; }
</style>
