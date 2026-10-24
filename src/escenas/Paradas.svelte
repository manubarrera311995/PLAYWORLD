<script lang="ts">
  import { recorrido } from "../estado/recorrido";
  import { navigate, type RutaParsed } from "./director/router";
  import { anioDeParadas, vistaParadas } from "./paradas";

  type Props = { ruta: RutaParsed };

  let { ruta }: Props = $props();

  const rec = $derived($recorrido);
  const escena = $derived(ruta.name);
  const vista = $derived(vistaParadas(escena, anioDeParadas(ruta, rec), rec.alma != null));
  const ancho = $derived(`${Math.round(vista.avance * 1000) / 10}%`);

  let encima = $state(false);
  let visita = $state(false);
  let lejos = $state(false);
  let antes = "";

  const callado = $derived(escena === "home" && !encima && !visita);
  const oculto = $derived(callado || lejos);

  $effect(() => {
    void escena;
    const leer = (nodo: HTMLElement | null) => {
      const abajo = nodo != null && nodo.scrollTop > 1;
      lejos = abajo;
      if (abajo) encima = false;
    };
    const alScroll = (event: Event) => {
      const nodo = event.target;
      if (!(nodo instanceof HTMLElement)) return;
      if (!nodo.classList.contains("escena-capa") || !nodo.classList.contains("is-scroll")) return;
      if (nodo.classList.contains("is-leave")) return;
      leer(nodo);
    };
    leer(document.querySelector(".escena-capa.is-scroll:not(.is-leave)"));
    document.addEventListener("scroll", alScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", alScroll, { capture: true });
  });

  $effect(() => {
    const nombre = escena;
    const desde = antes;
    antes = nombre;
    if (nombre !== "home") {
      visita = false;
      encima = false;
      return;
    }
    if (!desde || desde === "home") return;
    visita = true;
    const t = window.setTimeout(() => {
      visita = false;
    }, 2400);
    return () => window.clearTimeout(t);
  });
</script>

<div
  class={["marco", oculto && "is-callado", lejos && "is-lejos"]}
  onmouseenter={() => (encima = true)}
  onmouseleave={() => (encima = false)}
>
  <div class="cuerpo">
    <div class="riel" aria-hidden="true">
      <i style:width={ancho}></i>
    </div>
    <nav aria-label="Recorrido" inert={oculto}>
      <ol>
        {#each vista.items as item (item.id)}
          <li class="parada parada--{item.estado}">
            {#if item.href}
              {@const href = item.href}
              <button type="button" onclick={() => navigate(href)}>{item.nombre}</button>
            {:else}
              <span aria-current={item.estado === "actual" ? "step" : undefined}>{item.nombre}</span>
            {/if}
          </li>
        {/each}
      </ol>
    </nav>
  </div>
</div>

<style>
  .marco {
    position: fixed;
    z-index: 5;
    top: 0;
    left: 0;
    right: 0;
    padding: 0 var(--pad-x) 8px;
    pointer-events: auto;
  }

  .cuerpo {
    transition: opacity 320ms var(--ease-out);
  }

  .marco.is-callado .cuerpo {
    opacity: 0;
    pointer-events: none;
  }

  .marco.is-lejos {
    pointer-events: none;
  }

  .riel {
    height: 2px;
    background: rgba(255, 246, 239, 0.28);
  }

  .riel i {
    display: block;
    height: 100%;
    background: var(--ink-title);
  }

  nav {
    padding-top: 7px;
  }

  ol {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.35em;
    width: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .parada {
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    line-height: 1.3;
    white-space: nowrap;
    color: var(--ink-mute);
  }

  button,
  span {
    font: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
  }

  button {
    appearance: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-soft);
    cursor: pointer;
  }

  button:hover,
  button:focus-visible {
    color: var(--ink-title);
  }

  button:focus-visible {
    outline: 1px solid var(--ink-soft);
    outline-offset: 3px;
  }

  .parada--pasada span {
    color: var(--ink-soft);
  }

  .parada--actual span {
    color: var(--ink-title);
  }

  .parada--futura span {
    opacity: 0.38;
  }

  @media (min-width: 768px) {
    .parada {
      font-size: 11px;
      letter-spacing: 0.12em;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cuerpo {
      transition: none;
    }
  }
</style>
