<script lang="ts">
  type Props = { texto: string };
  let { texto }: Props = $props();
</script>

<p class="eyebrow">{texto}</p>
