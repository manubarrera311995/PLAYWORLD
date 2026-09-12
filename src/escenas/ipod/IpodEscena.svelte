<script lang="ts">
  import Ipod from "../../ipod/Ipod.svelte";
  import copy from "../../ipod/ipod.copy.json";
  import Marca from "../../ui/Marca.svelte";
  import { navigate, type RutaParsed } from "../director/router";
  import { parcheRecorrido } from "../../estado/recorrido";
  import { rankear } from "../../almas/motor";
  import { guardar } from "../../rastros/store";
  import type { Seleccion } from "../../datos/tipos";
  import { viewport } from "../../estado/viewport";
  import { aplicarPaleta } from "../../sketches/paleta";
  import { paletaDeAlma } from "../../almas/almas";

  type Props = { ruta?: RutaParsed };
  let { ruta: _ruta }: Props = $props();
  const vp = $derived($viewport);

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
</script>

<section class={["ipod-esc", `ipod-esc--${vp.modo}`]}>
  <header>
    <Marca />
    <h1 class="tipo-seccion">{copy.title}</h1>
    <p class="tipo-cuerpo">{copy.subtitle}</p>
  </header>
  <Ipod {oncerrar} />
</section>

<style>
  .ipod-esc {
    height: 100%;
    min-height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr;
    padding: var(--pad-y) var(--pad-x);
    gap: 12px;
  }
  header { text-align: center; display: grid; gap: 8px; justify-items: center; }
  .ipod-esc--compacto {
    padding: 8px;
  }
  .ipod-esc--compacto header { display: none; }
</style>
