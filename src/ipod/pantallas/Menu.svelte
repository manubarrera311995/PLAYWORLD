<script lang="ts">
  import { menuDisabled, menuLabel, type MenuId } from "../maquina";

  type Props = {
    cursor: number;
    n: number;
    onsaltar: (i: number) => void;
  };
  let { cursor, n, onsaltar }: Props = $props();
  const items: MenuId[] = ["year", "mood", "random", "mine", "close"];
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
        {menuLabel(id, n)}
      </button>
    </li>
  {/each}
</ul>

<style>
  .lista { list-style: none; display: grid; gap: 2px; }
  .row {
    width: 100%;
    text-align: left;
    border: 0;
    background: transparent;
    padding: 8px 6px;
    font-size: 13px;
    cursor: pointer;
    color: inherit;
  }
  .is-on { background: rgba(20, 40, 16, 0.35); }
  .is-off { opacity: 0.4; }
</style>
