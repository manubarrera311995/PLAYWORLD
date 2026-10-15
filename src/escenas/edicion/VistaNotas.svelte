<script lang="ts">
  import { onMount } from "svelte";
  import copy from "./edicion.copy.json";
  import { fill } from "./ficha";
  import type { NotaEscala } from "./nube";
  import { prepararNota, tocarNota, type ModoNota } from "./notaSonido";

  type Props = { notas: readonly NotaEscala[] };
  let { notas }: Props = $props();

  const max = $derived(Math.max(...notas.map((nota) => nota.menor + nota.mayor), 1));
  const hay = $derived(notas.some((nota) => nota.menor + nota.mayor > 0));

  let activo = $state<{ note: string; modo: ModoNota } | null>(null);
  let desdePuntero = false;

  onMount(() => {
    prepararNota();
  });

  function cuenta(n: number): string {
    return n === 1 ? copy.tablero.one : fill(copy.tablero.many, { n });
  }

  function anchos(nota: NotaEscala): { menor: number; mayor: number } {
    let menor = nota.menor > 0 ? Math.max((nota.menor / max) * 100, 4) : 0;
    let mayor = nota.mayor > 0 ? Math.max((nota.mayor / max) * 100, 4) : 0;
    const suma = menor + mayor;
    if (suma > 100) {
      menor = (menor / suma) * 100;
      mayor = (mayor / suma) * 100;
    }
    return { menor, mayor };
  }

  function oir(note: string, modo: ModoNota): void {
    activo = { note, modo };
    tocarNota(note, modo);
  }

  function entrar(event: PointerEvent, note: string, modo: ModoNota): void {
    if (event.pointerType === "touch") return;
    oir(note, modo);
  }

  function salir(event: PointerEvent, note: string, modo: ModoNota): void {
    if (event.pointerType === "touch") return;
    if (activo?.note === note && activo.modo === modo) activo = null;
  }

  function bajar(): void {
    desdePuntero = true;
    prepararNota();
  }

  function soltar(event: PointerEvent, note: string, modo: ModoNota): void {
    if (event.pointerType === "touch") oir(note, modo);
  }

  function enfocar(note: string, modo: ModoNota): void {
    if (desdePuntero) {
      desdePuntero = false;
      return;
    }
    oir(note, modo);
  }

  function desenfocar(note: string, modo: ModoNota): void {
    if (activo?.note === note && activo.modo === modo) activo = null;
  }
</script>

<div class="vista">
  {#if !hay}
    <p class="vacio">{copy.tablero.empty}</p>
  {:else}
    <p class="leyenda">
      <span><b class="rosa"></b>{copy.tablero.menor}</span>
      <span><b class="azul"></b>{copy.tablero.mayor}</span>
    </p>
    <div class="lista" aria-label={copy.rasgos.keysAria}>
      {#each notas as nota (nota.note)}
        {@const tramo = anchos(nota)}
        {@const encendida = activo?.note === nota.note}
        <div class="nota">
          <span>{nota.note}</span>
          <span class="pista">
            {#if nota.menor > 0}
              <button
                type="button"
                class={["zona", encendida && activo?.modo === "menor" && "is-on"]}
                style:width="{tramo.menor}%"
                aria-label="{nota.note}, {cuenta(nota.menor)}, {copy.tablero.menor}"
                onpointerenter={(event) => entrar(event, nota.note, "menor")}
                onpointerleave={(event) => salir(event, nota.note, "menor")}
                onpointerdown={bajar}
                onpointerup={(event) => soltar(event, nota.note, "menor")}
                onfocus={() => enfocar(nota.note, "menor")}
                onblur={() => desenfocar(nota.note, "menor")}
              >
                <i class="menor"></i>
                {#if encendida && activo?.modo === "menor"}
                  <span class="indicio menor">{cuenta(nota.menor)}</span>
                {/if}
              </button>
            {/if}
            {#if nota.mayor > 0}
              <button
                type="button"
                class={["zona", tramo.menor > 45 && "ancla", encendida && activo?.modo === "mayor" && "is-on"]}
                style:width="{tramo.mayor}%"
                aria-label="{nota.note}, {cuenta(nota.mayor)}, {copy.tablero.mayor}"
                onpointerenter={(event) => entrar(event, nota.note, "mayor")}
                onpointerleave={(event) => salir(event, nota.note, "mayor")}
                onpointerdown={bajar}
                onpointerup={(event) => soltar(event, nota.note, "mayor")}
                onfocus={() => enfocar(nota.note, "mayor")}
                onblur={() => desenfocar(nota.note, "mayor")}
              >
                <i class="mayor"></i>
                {#if encendida && activo?.modo === "mayor"}
                  <span class="indicio mayor">{cuenta(nota.mayor)}</span>
                {/if}
              </button>
            {/if}
          </span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .vista { height: 100%; min-height: 0; display: flex; flex-direction: column; gap: 10px; }
  .vacio { margin: auto; color: var(--ink-mute); font-size: 14px; }
  .leyenda { display: flex; gap: 14px; margin: 0; color: var(--ink-mute); font-size: 11px; }
  .leyenda b { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
  .rosa { background: #e85a86; }
  .azul { background: #7eb0ff; }
  .lista { min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 0; }
  .nota {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 10px;
    align-items: end;
    font-size: 13px;
    padding-bottom: 6px;
  }
  .pista {
    position: relative;
    height: 36px;
    display: flex;
    align-items: flex-end;
    gap: 3px;
    background:
      linear-gradient(rgba(255, 246, 239, 0.08), rgba(255, 246, 239, 0.08)) left bottom / 100% 8px no-repeat;
  }
  .zona {
    position: relative;
    flex: 0 0 auto;
    height: 28px;
    min-width: 18px;
    max-width: 100%;
    display: flex;
    align-items: flex-end;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }
  .zona:focus-visible { outline: 1px solid var(--ink-mute); outline-offset: 2px; }
  .zona i { display: block; width: 100%; height: 8px; border-radius: 99px; }
  .zona.is-on i,
  .zona:hover i { filter: brightness(1.2); }
  .zona i.menor { background: #e85a86; }
  .zona i.mayor { background: #7eb0ff; }
  .indicio {
    position: absolute;
    z-index: 2;
    left: 0;
    bottom: 12px;
    padding: 3px 7px;
    border-radius: 99px;
    background: rgba(16, 10, 18, 0.92);
    font-size: 11px;
    line-height: 1;
    white-space: nowrap;
    pointer-events: none;
  }
  .zona.ancla .indicio { left: auto; right: 0; }
  .indicio.menor { color: #e85a86; }
  .indicio.mayor { color: #7eb0ff; }
</style>
