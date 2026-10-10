<script lang="ts">
  import { untrack } from "svelte";
  import { cartelDe } from "./carteles";

  type Hoja = { id: number; src: string; viva: boolean };
  type Props = { year: number };

  let { year }: Props = $props();

  let hojas = $state<Hoja[]>([]);
  let seq = 0;
  let actual = "";
  let frame = 0;

  function revelar(id: number): void {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        hojas = hojas.map((h) => (h.id === id ? { ...h, viva: true } : h));
      });
    });
  }

  $effect(() => {
    const src = cartelDe(year) ?? "";
    let cancel = false;

    const poner = (listo: string) => {
      if (cancel || listo === actual) return;
      actual = listo;
      const previas = untrack(() =>
        hojas.filter((h) => h.viva).slice(-1).map((h) => ({ ...h, viva: false })),
      );
      if (!listo) {
        hojas = previas;
        return;
      }
      const id = ++seq;
      hojas = [...previas, { id, src: listo, viva: false }];
      revelar(id);
    };

    if (!src) {
      poner("");
      return () => {
        cancel = true;
      };
    }

    const img = new Image();
    img.onload = () => poner(src);
    img.onerror = () => poner("");
    img.src = src;

    return () => {
      cancel = true;
      cancelAnimationFrame(frame);
    };
  });
</script>

<div class="cartel" aria-hidden="true">
  <div class="cartel__tinta">
    {#each hojas as hoja (hoja.id)}
      <img
        class={["cartel__hoja", hoja.viva && "is-viva"]}
        src={hoja.src}
        alt=""
        draggable="false"
      />
    {/each}
  </div>
</div>

<style>
  .cartel {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    -webkit-mask-image:
      linear-gradient(90deg, transparent 0, transparent 2.5rem, rgb(0 0 0 / 0.28) 8rem, #000 18rem),
      radial-gradient(
        ellipse 88% 58% at 51% 49%,
        transparent 0%,
        transparent 32%,
        rgb(0 0 0 / 0.05) 46%,
        rgb(0 0 0 / 0.14) 58%,
        rgb(0 0 0 / 0.28) 70%,
        rgb(0 0 0 / 0.48) 82%,
        rgb(0 0 0 / 0.7) 92%,
        #000 100%
      );
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: 100% 100%;
    -webkit-mask-composite: source-in;
    mask-image:
      linear-gradient(90deg, transparent 0, transparent 2.5rem, rgb(0 0 0 / 0.28) 8rem, #000 18rem),
      radial-gradient(
        ellipse 88% 58% at 51% 49%,
        transparent 0%,
        transparent 32%,
        rgb(0 0 0 / 0.05) 46%,
        rgb(0 0 0 / 0.14) 58%,
        rgb(0 0 0 / 0.28) 70%,
        rgb(0 0 0 / 0.48) 82%,
        rgb(0 0 0 / 0.7) 92%,
        #000 100%
      );
    mask-repeat: no-repeat;
    mask-size: 100% 100%;
    mask-composite: intersect;
  }

  .cartel__tinta {
    position: absolute;
    inset: -12%;
    opacity: 0.72;
    filter: grayscale(0.35) contrast(1.02) brightness(1.04) blur(10px);
  }

  .cartel__hoja {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 720ms var(--ease-out);
  }

  .cartel__hoja.is-viva {
    opacity: 1;
  }

  @media (max-width: 767px) {
    .cartel__tinta {
      opacity: 0.76;
      filter: grayscale(0.32) contrast(1.02) brightness(1.04) blur(7px);
    }

    .cartel {
      -webkit-mask-image:
        linear-gradient(to top, transparent 0, transparent 2.5rem, rgb(0 0 0 / 0.25) 9rem, #000 18rem),
        radial-gradient(
          ellipse 150% 46% at 50% 44%,
          transparent 0%,
          transparent 30%,
          rgb(0 0 0 / 0.06) 44%,
          rgb(0 0 0 / 0.16) 58%,
          rgb(0 0 0 / 0.32) 72%,
          rgb(0 0 0 / 0.55) 86%,
          #000 100%
        );
      mask-image:
        linear-gradient(to top, transparent 0, transparent 2.5rem, rgb(0 0 0 / 0.25) 9rem, #000 18rem),
        radial-gradient(
          ellipse 150% 46% at 50% 44%,
          transparent 0%,
          transparent 30%,
          rgb(0 0 0 / 0.06) 44%,
          rgb(0 0 0 / 0.16) 58%,
          rgb(0 0 0 / 0.32) 72%,
          rgb(0 0 0 / 0.55) 86%,
          #000 100%
        );
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cartel__hoja {
      transition: none;
    }
  }
</style>
