<script lang="ts">
  import { get } from "svelte/store";
  import Ipod from "../../ipod/Ipod.svelte";
  import copy from "../../ipod/ipod.copy.json";
  import Marca from "../../ui/Marca.svelte";
  import { navigate, type RutaParsed } from "../director/router";
  import { parcheRecorrido, recorrido } from "../../estado/recorrido";
  import { rankear } from "../../almas/motor";
  import { guardar } from "../../rastros/store";
  import type { Seleccion } from "../../datos/tipos";
  import { viewport } from "../../estado/viewport";
  import { aplicarPaleta } from "../../sketches/paleta";
  import { paletaDeAlma } from "../../almas/almas";
  import { ensureGsap } from "../../motion/gsap";
  import { reduce } from "../../motion/reducedMotion";

  type Props = { ruta?: RutaParsed };
  let { ruta: _ruta }: Props = $props();
  const vp = $derived($viewport);
  const rec = $derived($recorrido);
  const year = $derived(rec.yearHint);
  const instruccion = $derived(
    year != null ? copy.instruccion.replace("{year}", String(year)) : copy.sinAnio,
  );

  function oncerrar(s: Seleccion): void {
    const ranking = rankear(s.tracks);
    parcheRecorrido({ seleccion: s, alma: ranking });
    aplicarPaleta(paletaDeAlma(ranking.principal));
    void guardar({
      alias: s.alias || null,
      almaId: ranking.principal,
      trackIds: s.trackIds,
      yearHint: s.yearHint,
    }).then((r) => parcheRecorrido({ rastroPropio: r }));
    navigate("/creacion");
  }

  function entrar(el: HTMLElement): () => void {
    const gsap = ensureGsap();
    const ctx = gsap.context(() => {
      if (get(reduce)) return;
      const tl = gsap.timeline();
      tl.from("[data-ipod]", {
        x: -72,
        scale: 0.82,
        autoAlpha: 0,
        duration: 0.7,
        ease: "back.out(1.6)",
        transformOrigin: "50% 55%",
      });
      tl.from(
        "[data-copy]",
        {
          x: 28,
          autoAlpha: 0,
          duration: 0.55,
          ease: "power3.out",
        },
        "-=0.35",
      );
    }, el);
    return () => ctx.revert();
  }
</script>

<section class={["ipod-esc", `ipod-esc--${vp.modo}`]} {@attach entrar}>
  <div class="ipod-esc__device" data-ipod>
    <Ipod {oncerrar} />
  </div>
  <aside class="ipod-esc__copy" data-copy>
    <Marca />
    {#if year != null}
      <p class="eyebrow">{year}</p>
    {/if}
    <h1 class="tipo-seccion">{copy.momento}</h1>
    <p class="tipo-cuerpo">{copy.subtitle}</p>
    <p class="tipo-pie">{instruccion}</p>
  </aside>
</section>

<style>
  .ipod-esc {
    height: 100%;
    min-height: 100dvh;
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
    align-items: center;
    gap: clamp(16px, 3vw, 48px);
    padding: var(--pad-y) var(--pad-x);
    overflow: hidden;
  }
  .ipod-esc__device {
    display: grid;
    place-items: center;
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }
  .ipod-esc__copy {
    display: grid;
    align-content: center;
    justify-items: start;
    gap: 14px;
    max-width: 36rem;
    text-align: left;
  }
  .ipod-esc--compacto {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
    align-items: stretch;
    gap: 10px;
    padding: 16px 16px 12px;
  }
  .ipod-esc--compacto .ipod-esc__copy {
    order: -1;
    justify-items: center;
    text-align: center;
    gap: 6px;
    max-width: none;
  }
  .ipod-esc--compacto .tipo-seccion {
    font-size: clamp(26px, 8vw, 40px);
  }
  .ipod-esc--compacto .tipo-cuerpo,
  .ipod-esc--compacto .tipo-pie {
    font-size: 14px;
  }
</style>
