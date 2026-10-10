<script lang="ts">
  import copy from "./edicion.copy.json";
  import type { NotaEscala } from "./nube";

  type Props = { notas: readonly NotaEscala[] };
  let { notas }: Props = $props();

  const max = $derived(Math.max(...notas.map((nota) => nota.menor + nota.mayor), 1));
  const hay = $derived(notas.some((nota) => nota.menor + nota.mayor > 0));
</script>

<div class="vista">
  {#if !hay}
    <p class="vacio">{copy.tablero.empty}</p>
  {:else}
    <p class="leyenda">
      <span><b class="rosa"></b>{copy.tablero.menor}</span>
      <span><b class="azul"></b>{copy.tablero.mayor}</span>
    </p>
    <div class="lista">
      {#each notas as nota (nota.note)}
        <div class="nota">
          <span>{nota.note}</span>
          <span class="pista">
            <i class="menor" style:width="{(nota.menor / max) * 100}%"></i>
            <i class="mayor" style:width="{(nota.mayor / max) * 100}%"></i>
          </span>
          <span>{nota.menor + nota.mayor}</span>
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
  .lista { min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 7px; }
  .nota { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; gap: 10px; align-items: center; font-size: 13px; }
  .pista {
    height: 8px;
    border-radius: 99px;
    background: rgba(255, 246, 239, 0.08);
    overflow: hidden;
    display: flex;
  }
  .pista i { display: block; height: 100%; }
  .menor { background: #e85a86; }
  .mayor { background: #7eb0ff; }
</style>
