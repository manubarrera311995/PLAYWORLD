<script lang="ts">
  type Props = {
    on: boolean;
    onclick?: () => void;
    children?: import("svelte").Snippet;
  };
  let { on, onclick, children }: Props = $props();
</script>

<button class={["chip", on && "is-on"]} type="button" {onclick} aria-pressed={on}>
  {@render children?.()}
</button>
