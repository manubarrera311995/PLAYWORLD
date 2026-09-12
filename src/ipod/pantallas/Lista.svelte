<script lang="ts">
  import type { Track } from "../../datos/tipos";
  import { artUrl } from "../../datos/color";

  type Props = {
    titulo?: string;
    items: Array<string | Track>;
    cursor: number;
    onsaltar: (i: number) => void;
  };
  let { titulo, items, cursor, onsaltar }: Props = $props();

  function label(it: string | Track): string {
    return typeof it === "string" ? it : `${it.artist} — ${it.track}`;
  }
</script>

{#if titulo}
  <p class="tit">{titulo}</p>
{/if}
<ul class="lista">
  {#each items as it, i (typeof it === "string" ? it : it.id)}
    <li>
      <button class={["row", i === cursor && "is-on"]} type="button" onclick={() => onsaltar(i)}>
        {#if typeof it !== "string" && artUrl(it.art, "64")}
          <img src={artUrl(it.art, "64") ?? ""} alt="" width="28" height="28" />
        {/if}
        <span>{label(it)}</span>
      </button>
    </li>
  {/each}
</ul>

<style>
  .tit { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 6px; opacity: 0.7; }
  .lista { list-style: none; display: grid; gap: 2px; }
  .row {
    width: 100%;
    display: flex;
    gap: 8px;
    align-items: center;
    text-align: left;
    border: 0;
    background: transparent;
    padding: 7px 6px;
    font-size: 13px;
    cursor: pointer;
    color: inherit;
  }
  .row img { border-radius: 2px; }
  .is-on { background: rgba(20, 40, 16, 0.35); }
</style>
