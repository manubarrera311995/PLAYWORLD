<script lang="ts">
  import { onMount } from "svelte";
  import Director from "./escenas/director/Director.svelte";
  import Boot from "./escenas/boot/Boot.svelte";
  import { granoSketch } from "./sketches/grano.sketch";
  import { p5Isla } from "./sketches/p5Isla";
  import { paleta } from "./sketches/paleta";
  import { initReducedMotion } from "./motion/reducedMotion";
  import { initViewport } from "./estado/viewport";

  let directorOn = $state(false);
  let bootOn = $state(true);

  const grano = (el: HTMLElement) => {
    const isla = p5Isla(el, granoSketch, {}, paleta);
    return () => isla.destroy();
  };

  onMount(() => {
    const stopMotion = initReducedMotion();
    const stopView = initViewport();
    return () => {
      stopMotion();
      stopView();
    };
  });
</script>

<div class="mundo">
  <div class="mundo__bg" aria-hidden="true">
    <div class="mundo__veil"></div>
  </div>
  <img class="mundo__eco" src="/assets/home/fondo.jpeg" alt="" aria-hidden="true" />
  <div class="grano" {@attach grano} aria-hidden="true"></div>
  {#if directorOn}
    <Director />
  {/if}
  {#if bootOn}
    <Boot onrevelar={() => (directorOn = true)} onsalida={() => (bootOn = false)} />
  {/if}
</div>
