<script lang="ts">
  type Props = { class?: string };
  let { class: className = "" }: Props = $props();
</script>

<span class={["asterisco", className]} aria-hidden="true">✱</span>

<style>
  .asterisco {
    font-size: 18px;
    color: rgba(255, 248, 242, 0.85);
    line-height: 1;
  }
</style>
