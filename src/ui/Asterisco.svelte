<script lang="ts">
  type Props = { class?: string };
  let { class: className = "" }: Props = $props();
</script>

<span class={["asterisco", className]} aria-hidden="true">✱</span>

<style>
  .asterisco {
    font-size: 18px;
    color: var(--ink-soft);
    line-height: 1;
  }
</style>
