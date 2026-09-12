<script lang="ts">
  import { paleta } from "./paleta";
  import { p5Isla, type Sketch } from "./p5Isla";

  type Props = {
    sketch: Sketch<unknown>;
    params?: unknown;
    capa?: "fondo" | "capa" | "frente";
    class?: string;
  };

  let { sketch, params = {}, capa = "capa", class: className = "" }: Props = $props();

  const mount = (el: HTMLElement) => {
    const isla = p5Isla(el, sketch, params, paleta);
    return () => isla.destroy();
  };
</script>

<div
  class={["sketch-slot", `sketch-slot--${capa}`, className]}
  {@attach mount}
  aria-hidden="true"
></div>

<style>
  .sketch-slot {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .sketch-slot--fondo {
    z-index: 0;
  }
  .sketch-slot--capa {
    z-index: 1;
  }
  .sketch-slot--frente {
    z-index: 3;
    pointer-events: auto;
  }
</style>
