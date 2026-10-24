<script lang="ts">
  import { almas, type AlmaId } from "../../almas/almas";
  import cartas from "./carta.copy.json";

  type Dato = { etiqueta: string; valor: string };
  type CartaCopy = {
    fondo: string;
    tinta: string;
    pastilla: string;
    caja: string;
    borde: string;
    lineas: string[];
    rasgos: string[];
    lema: string;
    numero: string;
    titular: string[];
    cuerpo: string;
    datos: Dato[];
  };

  type Props = { id: AlmaId };
  let { id }: Props = $props();

  let vuelta = $state(false);
  const c = $derived((cartas as Record<AlmaId, CartaCopy>)[id]);
  const nombre = $derived(almas[id].nombre);

  const frente = [
    { x: 6, y: 18, n: 4.2, g: 12 },
    { x: 86, y: 14, n: 3.2, g: -8 },
    { x: 90, y: 58, n: 3.6, g: 18 },
    { x: 4, y: 62, n: 2.6, g: -14 },
  ];
  const reves = [
    { x: 8, y: 38, n: 3.4, g: 8 },
    { x: 78, y: 46, n: 4.4, g: -16 },
    { x: 18, y: 58, n: 2.4, g: 20 },
    { x: 88, y: 62, n: 2.8, g: -6 },
  ];
</script>

{#snippet estrella(x: number, y: number, n: number, g: number)}
  <svg
    class="estrella"
    style:left="{x}%"
    style:top="{y}%"
    style:width="{n}%"
    style:transform="rotate({g}deg)"
    viewBox="-12 -12 24 24"
    aria-hidden="true"
  >
    <g fill="currentColor">
      <rect x="-1.7" y="-10.5" width="3.4" height="21" rx="1.7" />
      <rect x="-1.7" y="-10.5" width="3.4" height="21" rx="1.7" transform="rotate(60)" />
      <rect x="-1.7" y="-10.5" width="3.4" height="21" rx="1.7" transform="rotate(120)" />
    </g>
  </svg>
{/snippet}

<div class="envoltorio">
  <div class="giro">
    <button
      type="button"
      class={["carta", vuelta && "is-vuelta"]}
      aria-pressed={vuelta}
      style:--fondo={c.fondo}
      style:--tinta={c.tinta}
      style:--pastilla={c.pastilla}
      style:--caja={c.caja}
      style:--borde={c.borde}
      onclick={() => (vuelta = !vuelta)}
    >
      <span class="sr">Dar la vuelta.</span>
      <span class="cara frente" aria-hidden={vuelta}>
        {#each frente as s, i (i)}
          {@render estrella(s.x, s.y, s.n, s.g)}
        {/each}
        <p class="ceja">Tu alma en Playworld</p>
        <div class="dibujo">
          <img src="/assets/almas/{id}.png" alt="" />
        </div>
        <div class="pie">
          <p class="nombre">
            {#each c.lineas as linea (linea)}
              <span>{linea}</span>
            {/each}
          </p>
          <span class="regla" aria-hidden="true"></span>
          <p class="rasgos">{c.rasgos.join("  ·  ")}</p>
          <p class="pastilla">* {c.lema} *</p>
        </div>
      </span>
      <span class="cara reves" aria-hidden={!vuelta}>
        {#each reves as s, i (i)}
          {@render estrella(s.x, s.y, s.n, s.g)}
        {/each}
        <div class="tope">
          <p class="indice">{c.numero}. {nombre}</p>
          <img class="mini" src="/assets/almas/{id}.png" alt="" />
        </div>
        <p class="titular">
          {#each c.titular as linea, i (i)}
            {linea}{#if i < c.titular.length - 1}<br />{/if}
          {/each}
        </p>
        <span class="regla" aria-hidden="true"></span>
        <p class="cuerpo">{c.cuerpo}</p>
        <div class="datos">
          <p class="datos-ceja">Datos rápidos</p>
          {#each c.datos as dato (dato.etiqueta)}
            <p class="etiq">* {dato.etiqueta}</p>
            <p class="valor">{dato.valor}</p>
          {/each}
        </div>
      </span>
    </button>
  </div>
  <p class="pista">
    {vuelta ? "Toca para volver al frente" : "Toca para dar la vuelta"}
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 12a8 8 0 1 1-2.3-5.6"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
      <path d="M20 4.5V9h-4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </p>
</div>

<style>
  .envoltorio {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    width: 100%;
    height: 100%;
    gap: 12px;
  }

  .giro {
    width: min(100%, calc((100dvh - 168px) * 9 / 16));
    aspect-ratio: 9 / 16;
    container-type: inline-size;
    perspective: 1400px;
  }

  .carta {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: none;
    transform-style: preserve-3d;
    transition: transform 0.7s var(--ease-out);
    cursor: pointer;
  }

  .carta.is-vuelta { transform: rotateY(180deg); }

  .carta:focus-visible {
    outline: 2px solid var(--ink-title);
    outline-offset: 8px;
  }

  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .cara {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 6.2% 7% 5.6%;
    border: 1.5px solid var(--borde);
    border-radius: 5.6cqw;
    background: var(--fondo);
    color: var(--tinta);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  .reves { transform: rotateY(180deg); }

  .estrella {
    position: absolute;
    height: auto;
    color: var(--tinta);
    opacity: 0.42;
    pointer-events: none;
  }

  .ceja,
  .indice,
  .datos-ceja,
  .etiq {
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .ceja {
    font-size: 2.7cqw;
    text-indent: 0.16em;
  }

  .dibujo {
    flex: 1;
    min-height: 0;
    display: grid;
    place-items: center;
    margin: 1% 0 2%;
  }

  .dibujo img {
    width: auto;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .nombre span {
    display: block;
    font-family: Outfit, sans-serif;
    font-weight: 800;
    font-size: 11.2cqw;
    line-height: 0.88;
    letter-spacing: -0.045em;
  }

  .regla {
    display: block;
    height: 1px;
    margin: 3.2% 0 2.6%;
    background: currentColor;
    opacity: 0.55;
  }

  .rasgos {
    font-size: 3cqw;
    font-weight: 500;
    letter-spacing: -0.01em;
  }

  .pastilla {
    align-self: flex-start;
    margin-top: 4.5%;
    padding: 0.62em 1.05em 0.58em;
    border-radius: 999px;
    background: var(--pastilla);
    color: #fff;
    font-family: Outfit, sans-serif;
    font-size: 2.7cqw;
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1;
    text-transform: uppercase;
  }

  .tope {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8%;
    min-height: 16%;
  }

  .indice {
    max-width: 16ch;
    font-size: 2.7cqw;
    line-height: 1.35;
    text-indent: 0.16em;
  }

  .mini {
    width: 22%;
    height: auto;
    object-fit: contain;
  }

  .titular {
    margin-top: 5%;
    font-family: Outfit, sans-serif;
    font-weight: 800;
    font-size: 6.3cqw;
    line-height: 0.98;
    letter-spacing: -0.04em;
  }

  .cuerpo {
    font-size: 3.15cqw;
    font-weight: 500;
    line-height: 1.35;
  }

  .datos {
    margin-top: auto;
    padding: 4.5% 5% 5%;
    border-radius: 4.4cqw;
    background: var(--caja);
    color: #fff;
  }

  .datos-ceja {
    margin-bottom: 0.85em;
    font-size: 2.15cqw;
    opacity: 0.72;
  }

  .etiq {
    margin-top: 0.7em;
    font-size: 2.15cqw;
    opacity: 0.72;
  }

  .valor {
    margin-top: 0.12em;
    font-family: Outfit, sans-serif;
    font-weight: 700;
    font-size: 3.35cqw;
    line-height: 1.15;
    letter-spacing: -0.03em;
  }

  .pista {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    letter-spacing: 0.04em;
    color: var(--ink-mute);
  }

  .pista svg {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 1180px) {
    .giro { width: min(100%, calc((100dvh - 180px) * 9 / 16)); }
  }

  @media (max-width: 767px) {
    .envoltorio { align-items: center; }
    .giro { width: min(320px, 74vw, calc(58dvh * 9 / 16)); }
  }

  @media (prefers-reduced-motion: reduce) {
    .carta { transition: none; }
  }
</style>
