import { ensureGsap } from "../../motion/gsap";
import { cruzarUmbral } from "./umbral";

/**
 * Los dos primeros pesan más para que el portal empiece cuando el logo ya se fue.
 * El portal, la frase que lo sigue y la cámara se reparten el cuerpo del scroll.
 */
const INICIO = 0.18;
const FIN = 0.88;
const PLAY_VIVO = 0.94;
const PESO_PREVIO = 4;
const PESO_FAN = 7;
const PESO_UMBRAL = 8;
const PESO_ENTENDIDO = 7;
const PESO_CAMARA = 7;

function pesosDe(beats: HTMLElement[]): number[] {
  const umbralI = beats.findIndex((beat) => beat.classList.contains("home__beat--umbral"));
  return beats.map((beat, i) => {
    if (beat.classList.contains("home__beat--lado")) return PESO_CAMARA;
    if (beat.classList.contains("home__beat--umbral")) return PESO_UMBRAL;
    if (beat.classList.contains("home__beat--fan")) return PESO_FAN;
    if (beat.classList.contains("home__beat--entendido")) return PESO_ENTENDIDO;
    if (umbralI >= 0 && i < umbralI) return PESO_PREVIO;
    return 1;
  });
}

function indice(p: number, pesos: number[]): number {
  if (p < INICIO || p >= FIN || pesos.length < 1) return -1;
  const total = pesos.reduce((suma, peso) => suma + peso, 0);
  const span = FIN - INICIO;
  let acc = INICIO;
  for (let i = 0; i < pesos.length; i += 1) {
    const ancho = ((pesos[i] ?? 1) / total) * span;
    if (p < acc + ancho) return i;
    acc += ancho;
  }
  return pesos.length - 1;
}

function tramo(i: number, pesos: number[]): { entra: number; sale: number } {
  const total = pesos.reduce((suma, peso) => suma + peso, 0);
  const span = FIN - INICIO;
  let acc = INICIO;
  for (let k = 0; k < i; k += 1) acc += ((pesos[k] ?? 1) / total) * span;
  const ancho = ((pesos[i] ?? 1) / total) * span;
  return { entra: acc, sale: i === pesos.length - 1 ? FIN : acc + ancho };
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
      const pesos = pesosDe(beats);
      const n = beats.length;
      const fade = Math.min(0.028, ((FIN - INICIO) / n) * 0.3);
      const camaraI = beats.findIndex((beat) => beat.classList.contains("home__beat--lado"));
      const toma = root.querySelector<HTMLElement>(".home__toma");
      const pila = root.querySelector<HTMLElement>(".home__pila");
      const lado = camaraI >= 0 ? beats[camaraI]?.querySelector<HTMLElement>(".home__lado") : null;
      const ventana = camaraI >= 0 ? tramo(camaraI, pesos) : null;

      const reposo = (): { x: number; y: number; scale: number } => {
        const hueco = pila?.querySelector<HTMLElement>(".hueco");
        const stage = root.querySelector<HTMLElement>(".home__stage");
        if (!hueco || !stage || !toma) return { x: 0, y: 0, scale: 0.28 };
        const h = hueco.getBoundingClientRect();
        const s = stage.getBoundingClientRect();
        const base = toma.offsetWidth || 1;
        return {
          x: h.left + h.width / 2 - (s.left + s.width / 2),
          y: h.top + h.height / 2 - (s.top + s.height / 2),
          scale: Math.min(0.46, Math.max(0.16, h.width / base)),
        };
      };

      gsap.set(beats, { autoAlpha: 0 });
      beats.forEach((el) => {
        el.setAttribute("aria-hidden", "true");
        el.setAttribute("inert", "");
      });

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
            const vivo = indice(self.progress, pesos);
            const tomaViva = camaraI >= 0 && vivo === camaraI;
            const ancho = ventana ? ventana.sale - ventana.entra : 1;
            const llena =
              ventana !== null &&
              self.progress >= ventana.entra + ancho * 0.5 &&
              self.progress < ventana.entra + ancho * 0.8;
            root.classList.toggle("is-toma", tomaViva);
            root.classList.toggle("is-llena", llena);
            beats.forEach((el, i) => {
              const on = i === vivo;
              el.toggleAttribute("aria-hidden", !on);
              if (on) el.removeAttribute("inert");
              else el.setAttribute("inert", "");
            });
            if (toma) toma.toggleAttribute("aria-hidden", !tomaViva);
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

      if (pila) gsap.set(pila, { autoAlpha: 0 });
      if (toma) {
        gsap.set(toma, {
          xPercent: -50,
          yPercent: -50,
          x: () => reposo().x,
          y: () => reposo().y,
          scale: () => reposo().scale,
          autoAlpha: 0,
          force3D: true,
        });
      }

      beats.forEach((beat, i) => {
        const { entra, sale } = tramo(i, pesos);
        tl.to(beat, { autoAlpha: 1, duration: fade }, entra);
        tl.to(beat, { autoAlpha: 0, duration: fade }, sale);
      });

      const umbralI = beats.findIndex((beat) => beat.classList.contains("home__beat--umbral"));
      const soltarUmbral = umbralI >= 0 ? cruzarUmbral(tl, root, tramo(umbralI, pesos)) : null;

      const fanI = beats.findIndex((beat) => beat.classList.contains("home__beat--fan"));
      const pista = root.querySelector<HTMLElement>(".tira__pista");
      if (pista && fanI >= 0) {
        const { entra, sale } = tramo(fanI, pesos);
        const dur = sale - entra;
        const abajo = () => pista.parentElement?.clientHeight ?? 0;
        gsap.set(pista, { y: abajo });
        tl.fromTo(
          pista,
          { y: abajo },
          {
            y: () => abajo() - pista.offsetHeight,
            duration: dur * 0.92,
            ease: "none",
            immediateRender: false,
          },
          entra + dur * 0.02,
        );
      }

      if (toma && ventana) {
        const { entra, sale } = ventana;
        const dur = sale - entra;
        tl.to(
          toma,
          {
            autoAlpha: 1,
            x: () => reposo().x,
            y: () => reposo().y,
            scale: () => reposo().scale,
            duration: dur * 0.16,
            ease: "power2.out",
          },
          entra,
        );
        tl.to(
          toma,
          { x: 0, y: 0, scale: 1, duration: dur * 0.24, ease: "power2.inOut" },
          entra + dur * 0.34,
        );
        if (lado) {
          tl.to(lado, { autoAlpha: 0, y: -16, duration: dur * 0.12, ease: "power1.in" }, entra + dur * 0.36);
        }
        if (pila) {
          tl.to(pila, { autoAlpha: 0, duration: dur * 0.14, ease: "power1.in" }, entra + dur * 0.4);
        }
        tl.to(
          toma,
          {
            autoAlpha: 0,
            scale: () => Math.max(0.18, reposo().scale * 0.72),
            x: () => reposo().x * 0.35,
            y: -36,
            duration: dur * 0.22,
            ease: "power2.in",
          },
          entra + dur * 0.78,
        );
      }
      tl.set({}, {}, 1);

      return () => {
        soltarUmbral?.();
        tl.scrollTrigger?.kill();
        tl.kill();
        play.classList.remove("is-vivo");
        play.removeAttribute("inert");
        play.setAttribute("aria-label", etiqueta);
        beats.forEach((el) => el.removeAttribute("inert"));
        root.classList.remove("is-toma");
        root.classList.remove("is-llena");
      };
    },
    root,
  );

  return () => mm.revert();
}
