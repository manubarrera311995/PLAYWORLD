<script lang="ts">
  import type { Track } from "../../datos/tipos";

  type Props = {
    items: Array<string | Track>;
    cursor: number;
    onsaltar: (i: number) => void;
    vacio?: string;
  };
  let { items, cursor, onsaltar, vacio }: Props = $props();

  function label(it: string | Track): string {
    return typeof it === "string" ? it : `${it.artist} — ${it.track}`;
  }

  function seguir(indice: number) {
    return (el: HTMLElement) => {
      el.querySelectorAll<HTMLElement>(".row")[indice]?.scrollIntoView({ block: "nearest" });
    };
  }
</script>

{#if items.length === 0 && vacio}
  <p class="vacio">{vacio}</p>
{:else}
  <ul class="lista" {@attach seguir(cursor)}>
    {#each items as it, i (typeof it === "string" ? it : it.id)}
      <li>
        <button class={["row", i === cursor && "is-on"]} type="button" onclick={() => onsaltar(i)}>
          <span class="name">{label(it)}</span>
          <span class="chev" aria-hidden="true">›</span>
        </button>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .vacio {
    margin: 0;
    padding: 16px 12px;
    color: #111;
    font-family: Inter, Helvetica, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.35;
  }
  .lista { list-style: none; margin: 0; padding: 2px 0 0; min-width: 0; }
  .row {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    text-align: left;
    border: 0;
    background: transparent;
    padding: 6px 10px;
    font-family: Inter, Helvetica, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.25;
    cursor: pointer;
    color: #111;
  }
  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .chev { flex: none; color: #8d8d8d; font-size: 16px; line-height: 1; }
  .is-on {
    background: linear-gradient(180deg, #6aafff 0%, #2d78e8 42%, #1c62d6 100%);
    color: #fff;
  }
  .is-on .chev { color: #fff; }
</style>
