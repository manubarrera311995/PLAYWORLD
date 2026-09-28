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
    contarItems,
    enSeleccion,
    meterOQuitar,
    tracksDelAnio,
    visible,
    type EntradaIpod,
    type Pantalla,
  } from "./maquina";
  import { cargarTracks } from "../datos/archivo";
  import { viewport } from "../estado/viewport";
  import { preferencias } from "../estado/preferencias";
  import { recorrido } from "../estado/recorrido";
  import { tracksAPaleta } from "../datos/color";
  import { aplicarPaleta } from "../sketches/paleta";
  import { paletaDefault } from "../datos/color";
  import { reduce } from "../motion/reducedMotion";
  import type { Seleccion, Track } from "../datos/tipos";

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
  const tituloLcd = $derived(tituloDe(v));

  function tituloDe(pantalla: Pantalla): string {
    if (pantalla.kind === "boot") return "PLAYWORLD";
    if (pantalla.kind === "menu") return "iPod";
    if (pantalla.kind === "lista") return pantalla.titulo;
    if (pantalla.kind === "miIpod") return "Mi iPod";
    if (pantalla.kind === "cancion") return pantalla.track.track;
    return "iPod";
  }

  function onentrada(e: EntradaIpod): void {
    const next = dispatchIpod(e);
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
    const stopKey = bindTeclado(onentrada);
    let bootTimer: ReturnType<typeof setTimeout> | undefined;
    const yearHint = get(recorrido).yearHint;
    const carga: Promise<Track[]> = yearHint == null ? Promise.resolve([]) : cargarTracks(yearHint);
    void carga.then((p) => {
      setIpodCtx({ pool: p, yearHint });
      ipod.update((s) => {
        const pantalla = visible(s);
        if (pantalla.kind !== "lista" || s.pila.length !== 1 || pantalla.tracks.length > 0) return s;
        const tracks = tracksDelAnio(p, yearHint);
        if (!tracks.length) return s;
        return {
          ...s,
          pila: [{ kind: "lista", titulo: yearHint != null ? String(yearHint) : "Canciones", tracks }],
        };
      });
    });
    const ms = get(reduce) ? 0 : 1200;
    bootTimer = setTimeout(() => {
      if (visible(get(ipod)).kind === "boot") onentrada({ tipo: "select" });
    }, ms);
    return () => {
      stopKey();
      if (bootTimer) clearTimeout(bootTimer);
    };
  });
</script>

<div class={["ipod", `ipod--${vp.modo}`, vp.corto && "ipod--corto"]}>
  <div class="ipod__well">
    <div class="ipod__lcd">
      <Lcd titulo={tituloLcd} n={estado.seleccion.length} capacidad={estado.capacidad} {onentrada}>
        {#if v.kind === "boot"}
          <p class="boot">{copy.boot}</p>
        {:else if v.kind === "menu"}
          <Menu cursor={estado.cursor} n={estado.seleccion.length} year={rec.yearHint} onsaltar={saltar} />
        {:else if v.kind === "lista"}
          <Lista
            items={v.tracks}
            cursor={estado.cursor}
            onsaltar={saltar}
            vacio={rec.yearHint == null ? copy.sinAnio : undefined}
          />
        {:else if v.kind === "miIpod"}
          <MiIpod seleccion={estado.seleccion} cursor={estado.cursor} onsaltar={saltar} />
        {:else if v.kind === "cancion"}
          <Cancion
            track={v.track}
            metida={enSeleccion(estado, v.track.id)}
            llena={estado.seleccion.length >= estado.capacidad}
            onmeter={() => {
              ipod.update((s) => meterOQuitar(s, v.track));
            }}
          />
        {/if}
      </Lcd>
    </div>
  </div>
  <div class="ipod__wheel">
    {#key modo}
      <ClickWheel {modo} indice={estado.cursor} total={nItems} {onentrada} />
    {/key}
  </div>
</div>

<style>
  .ipod {
    position: relative;
    display: grid;
    grid-template-rows: minmax(0, 1.05fr) minmax(0, 0.95fr);
    align-items: stretch;
    justify-items: stretch;
    height: min(84dvh, 740px);
    max-height: 100%;
    width: auto;
    max-width: min(100%, 440px);
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    aspect-ratio: 618 / 1035;
    padding: 7.4% 6.6% 5.2%;
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
    margin: 0;
    padding: 22px 14px;
    color: #111;
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(16px, 2.4vw, 22px);
    line-height: 1.15;
  }
</style>
