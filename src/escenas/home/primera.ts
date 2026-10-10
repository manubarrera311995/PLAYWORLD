import { ensureGsap } from "../../motion/gsap";

/** Los ocho fragmentos caben en el mismo scroll que gira las carátulas. */
const INICIO = 0.18;
const FIN = 0.88;
const PLAY_VIVO = 0.94;

function indice(p: number, n: number): number {
  if (p < INICIO || p >= FIN || n < 1) return -1;
  const i = Math.floor(((p - INICIO) / (FIN - INICIO)) * n);
  return Math.min(n - 1, Math.max(0, i));
}

/**
 * «Mi primera vez» en el hueco del círculo. Cada frase entra mientras las
 * carátulas siguen girando; el play solo se enciende al final.
 */
export function montarPrimera(root: HTMLElement): () => void {
  const gsap = ensureGsap();
  const relato = root.querySelector<HTMLElement>(".home__relato");
  const play = root.querySelector<HTMLElement>(".home__play");
  const beats = Array.from(root.querySelectorAll<HTMLElement>(".home__beat"));
  if (!relato || !play || beats.length < 2) return () => undefined;

  const scroller = root.closest(".escena-capa") as HTMLElement | null;
  const etiqueta = play.getAttribute("aria-label") ?? "";
  const fila = play.dataset.fila ?? etiqueta;
  const mm = gsap.matchMedia();

  mm.add(
    {
      isReduce: "(prefers-reduced-motion: reduce)",
      isMotion: "(prefers-reduced-motion: no-preference)",
      isCompacto: "(max-width: 767px)",
    },
    (context) => {
      if (context.conditions?.isReduce) return undefined;
      const compacto = Boolean(context.conditions?.isCompacto);
      const n = beats.length;
      const slot = (FIN - INICIO) / n;
      const fade = Math.min(0.028, slot * 0.3);

      gsap.set(beats, { autoAlpha: 0 });
      beats.forEach((el) => el.setAttribute("aria-hidden", "true"));

      const tl = gsap.timeline({
        defaults: { ease: "none", immediateRender: false },
        scrollTrigger: {
          id: "home-primera",
          scroller: scroller ?? undefined,
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: compacto ? 1.25 : 2.2,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const vivo = indice(self.progress, n);
            beats.forEach((el, i) => el.toggleAttribute("aria-hidden", i !== vivo));
            const listo = self.progress >= PLAY_VIVO;
            play.classList.toggle("is-vivo", listo);
            if (listo) {
              play.removeAttribute("inert");
              play.setAttribute("aria-label", fila);
            } else {
              play.setAttribute("inert", "");
              play.setAttribute("aria-label", etiqueta);
            }
          },
        },
      });

      beats.forEach((beat, i) => {
        const entra = INICIO + i * slot;
        const sale = i === n - 1 ? FIN : entra + slot;
        tl.to(beat, { autoAlpha: 1, duration: fade }, entra);
        tl.to(beat, { autoAlpha: 0, duration: fade }, sale);
      });
      tl.set({}, {}, 1);

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        play.classList.remove("is-vivo");
        play.removeAttribute("inert");
        play.setAttribute("aria-label", etiqueta);
      };
    },
    root,
  );

  return () => mm.revert();
}
