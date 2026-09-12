<script lang="ts">
  type Props = {
    onclick?: (e: MouseEvent) => void;
    href?: string;
    disabled?: boolean;
    children?: import("svelte").Snippet;
  };
  let { onclick, href, disabled = false, children }: Props = $props();
</script>

{#if href && !disabled}
  <a class="boton" {href} onclick={(e) => {
    if (onclick) {
      e.preventDefault();
      onclick(e);
    }
  }}>
    {@render children?.()}
  </a>
{:else}
  <button class="boton" {onclick} {disabled} type="button">
    {@render children?.()}
  </button>
{/if}

<style>
  .boton {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 248, 242, 0.88);
    border-radius: 999px;
    padding: 10px 16px;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .boton:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .boton:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 3px;
  }
</style>
