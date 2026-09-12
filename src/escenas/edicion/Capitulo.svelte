<script lang="ts">
  type Props = {
    n: string;
    eyebrow: string;
    title: string;
    titleId: string;
    question: string;
    unit: string;
  };
  let { n, eyebrow, title, titleId, question, unit }: Props = $props();
</script>

<header class="head">
  <p class="num">{n}</p>
  <div>
    <p class="kicker">{eyebrow}</p>
    <h2 id={titleId}>{title}</h2>
    <p class="q">{question}</p>
  </div>
  <p class="unit">{unit}</p>
</header>

<style>
  .head {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr) auto;
    align-items: start;
    gap: 20px;
    margin-bottom: clamp(32px, 5vh, 56px);
  }
  .num {
    font-family: Anton, Impact, sans-serif;
    color: var(--ink-mute);
    font-size: 34px;
  }
  .kicker {
    margin-bottom: 12px;
    color: var(--ink-mute);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.23em;
    text-transform: uppercase;
  }
  h2 {
    font-family: Anton, Impact, sans-serif;
    font-size: clamp(32px, 4.4vw, 56px);
    font-weight: 400;
    letter-spacing: -0.03em;
    line-height: 0.92;
  }
  .q {
    margin-top: 10px;
    max-width: 46ch;
    color: var(--ink-soft);
    font-size: 15px;
    line-height: 1.4;
  }
  .unit {
    color: var(--ink-mute);
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  @media (max-width: 980px) {
    .head {
      grid-template-columns: 1fr;
    }
  }
</style>
