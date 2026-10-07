<script lang="ts">
  import { almas, type AlmaId } from "../../almas/almas";
  import { anclasSello, puntosSello, SELLO, verticesSello } from "./sello";

  type Props = {
    puntajes: Partial<Record<AlmaId, number>>;
    principal: AlmaId;
    eco: AlmaId;
  };
  let { puntajes, principal, eco }: Props = $props();

  const forma = $derived(puntosSello(verticesSello(puntajes)));
  const anclas = $derived(anclasSello());
  const leyenda = $derived("Esta alma salió de las cinco canciones que elegiste.");
</script>

<figure class="sello">
  <svg viewBox={SELLO.viewBox} aria-hidden="true">
    <polygon class="cuerpo" points={forma} />
    <polygon class="contorno" points={forma} />
    {#each anclas as a (a.id)}
      <text
        x={a.x}
        y={a.y}
        text-anchor={a.anchor}
        dominant-baseline="middle"
        class={{ principal: a.id === principal, eco: a.id === eco }}
      >{almas[a.id].corto}</text>
    {/each}
  </svg>
  <figcaption>{leyenda}</figcaption>
</figure>

<style>
  .sello {
    display: grid;
    justify-items: center;
    gap: 8px;
    margin: 0;
  }
  svg {
    width: min(100%, 420px);
    height: auto;
    overflow: visible;
  }
  .cuerpo {
    fill: var(--c1);
    opacity: 0.88;
  }
  .contorno {
    fill: none;
    stroke: var(--c2);
    stroke-width: 5;
    stroke-linejoin: round;
  }
  text {
    font-family: Inter, system-ui, sans-serif;
    font-size: 13px;
    font-weight: 400;
    fill: var(--ink-mute);
  }
  text.principal,
  text.eco {
    fill: var(--ink-title);
    font-weight: 500;
  }
  figcaption {
    font-size: 12px;
    letter-spacing: 0.04em;
    color: var(--ink-mute);
    text-align: center;
  }
</style>
