<script lang="ts">
  import { MENU, menuDisabled, menuLabel, type MenuId } from "../maquina";

  type Props = {
    cursor: number;
    n: number;
    year: number | null;
    onsaltar: (i: number) => void;
  };
  let { cursor, n, year, onsaltar }: Props = $props();
  const items: MenuId[] = [...MENU];
</script>

<ul class="lista">
  {#each items as id, i (id)}
    <li>
      <button
        class={["row", i === cursor && "is-on", menuDisabled(id, n) && "is-off"]}
        type="button"
        disabled={menuDisabled(id, n)}
        onclick={() => onsaltar(i)}
      >
        <span>{menuLabel(id, n, year)}</span>
        <span class="chev" aria-hidden="true">›</span>
      </button>
    </li>
  {/each}
</ul>

<style>
  .lista { list-style: none; margin: 0; padding: 2px 0 0; }
  .row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    text-align: left;
    border: 0;
    background: transparent;
    padding: 7px 10px;
    font-family: Inter, Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.2;
    cursor: pointer;
    color: #111;
  }
  .chev { color: #8d8d8d; font-size: 16px; line-height: 1; }
  .is-on {
    background: linear-gradient(180deg, #6aafff 0%, #2d78e8 42%, #1c62d6 100%);
    color: #fff;
  }
  .is-on .chev { color: #fff; }
  .is-off { color: #9a9a9a; }
  .is-on.is-off { opacity: 0.55; }
  .row:disabled { cursor: default; }
</style>
