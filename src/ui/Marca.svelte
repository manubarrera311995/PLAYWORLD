<script lang="ts">
  type Props = { texto?: string };
  let { texto = "PLAYWORLD" }: Props = $props();
</script>

<p class="tipo-marca">{texto}</p>
