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
    MOODS,
    visible,
    type EntradaIpod,
  } from "./maquina";
  import { aniosDelPool as yearsOf, cargarPool, poolPorAnio } from "../datos/pool";
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

  let pool = $state<Track[]>([]);
  const estado = $derived($ipod);
  const v = $derived(visible(estado));
  const vp = $derived($viewport);
  const pref = $derived($preferencias);
  const rec = $derived($recorrido);
  const modo = $derived(
    pref.modoControl ?? (vp.modo === "compacto" || vp.pointer === "coarse" ? "toque" : "rueda"),
  );
  const orderedPool = $derived(poolPorAnio(pool, rec.yearHint));
  const anios = $derived(yearsOf(pool));
  const nItems = $derived(contarItems(estado, orderedPool, anios));

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
    void cargarPool().then((p) => {
      pool = p;
      setIpodCtx({ pool: poolPorAnio(p, rec.yearHint), anios: yearsOf(p), yearHint: rec.yearHint });
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
  <div class="ipod__lcd">
    <Lcd n={estado.seleccion.length} capacidad={estado.capacidad} {onentrada}>
      {#if v.kind === "boot"}
        <p class="boot">{copy.boot}</p>
      {:else if v.kind === "menu"}
        <Menu cursor={estado.cursor} n={estado.seleccion.length} onsaltar={saltar} />
      {:else if v.kind === "years"}
        <Lista titulo="Por año" items={anios.map(String)} cursor={estado.cursor} onsaltar={saltar} />
      {:else if v.kind === "moods"}
        <Lista titulo="Por mood" items={MOODS.map((m) => m.label)} cursor={estado.cursor} onsaltar={saltar} />
      {:else if v.kind === "lista"}
        <Lista titulo={v.titulo} items={v.tracks} cursor={estado.cursor} onsaltar={saltar} />
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
  <div class="ipod__wheel">
    {#key modo}
      <ClickWheel {modo} indice={estado.cursor} total={nItems} {onentrada} />
    {/key}
  </div>
</div>

<style>
  .ipod {
    display: grid;
    grid-template-rows: 1fr auto;
    gap: 16px;
    width: min(100%, 360px);
    height: min(100%, 640px);
    margin: 0 auto;
    padding: 12px;
    background: linear-gradient(180deg, #f6f1ea 0%, #d9d2ca 100%);
    border-radius: 36px;
    box-shadow: 0 24px 60px rgba(20, 0, 40, 0.35);
  }
  .ipod__lcd { min-height: 0; height: 100%; }
  .ipod--compacto { width: 100%; height: 100%; border-radius: 0; }
  .ipod--compacto .ipod__lcd { height: 55%; }
  .ipod--corto {
    grid-template-rows: 1fr;
    grid-template-columns: auto 1fr;
    width: 100%;
    height: 100%;
  }
  .ipod--corto .ipod__wheel { width: min(42vw, 240px); }
  .boot {
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(18px, 4vw, 28px);
    line-height: 1.15;
    padding: 18px 8px;
  }
</style>
