import { ensureGsap, ScrollTrigger } from "../../motion/gsap";

type Marco = {
  n: number;
  play: HTMLElement;
  stage: HTMLElement;
  pin: HTMLElement;
  compacto: boolean;
  cue: HTMLElement | null;
};

type Puesto = { x: number; y: number; card: number };

/**
 * La frase ocupa la izquierda. Las carátulas viven en el campo de la derecha
 * y se desplazan con el scroll. En compacto quedan en una franja alta.
 */
function puestoDe(i: number, n: number, giro: number, m: Marco, aparte: number): Puesto {
  const s = m.stage.getBoundingClientRect();
  const cap = m.compacto ? 64 : 92;
  const floor = m.compacto ? 42 : 60;
  const card = Math.max(floor, Math.min(cap, Math.round(s.width * (m.compacto ? 0.16 : 0.058))));
  const aire = card * 0.5 + (m.compacto ? 8 : 12);
  const cols = m.compacto ? 4 : s.width > 1100 ? 3 : 2;
  const col = i % cols;
  const fila = Math.floor(i / cols);
  const filas = Math.max(1, Math.ceil(n / cols));
  const oscila = ((i * 17) % 11) - 5;

  if (m.compacto) {
    const x0 = -s.width * 0.5 + aire;
    const x1 = s.width * 0.5 - aire;
    const y0 = -s.height * 0.5 + aire;
    const y1 = -s.height * 0.5 + s.height * 0.4;
    return {
      x: x0 + ((col + 0.5) / cols) * (x1 - x0) + oscila * 3,
      y: y0 + ((fila + 0.5) / filas) * (y1 - y0) - giro * 36,
      card,
    };
  }

  const texto = Math.min(s.width * 0.42, 600);
  const x0 = -s.width * 0.5 + texto + card * 0.15;
  const x1 = s.width * 0.5 - aire;
  const y0 = -s.height * 0.5 + aire;
  const y1 = s.height * 0.5 - aire;
  const x = x0 + ((col + 0.5) / cols) * (x1 - x0) + oscila * 8;
  const y = y0 + ((fila + 0.5) / filas) * (y1 - y0) + (giro - 0.08) * (y1 - y0) * 0.4;
  return {
    x: x + aparte * (x1 - x) * 0.62,
    y,
    card,
  };
}

/** El scroller es `.escena-capa`. Sin pin de GSAP: el marco va con sticky. */
export function montarOrbita(root: HTMLElement): () => void {
  const gsap = ensureGsap();
  const pin = root.querySelector<HTMLElement>(".home__pin");
  const stage = root.querySelector<HTMLElement>(".home__stage");
  const orbita = root.querySelector<HTMLElement>(".home__orbita");
  const copyEl = root.querySelector<HTMLElement>(".home__copy");
  const plano = root.querySelector<HTMLElement>(".home__plano");
  const veloPlano = root.querySelector<HTMLElement>(".home__plano-velo");
  const cielo = [plano, veloPlano].filter((nodo): nodo is HTMLElement => nodo !== null);
  const fragmentos = root.querySelector<HTMLElement>(".home__fragmentos");
  const play = root.querySelector<HTMLElement>(".home__play");
  const destello = root.querySelector<HTMLElement>(".home__play-destello");
  const brillo = root.querySelector<HTMLElement>(".home__play-brillo");
  const core = root.querySelector<HTMLElement>(".home__play-core");
  const cue = root.querySelector<HTMLElement>(".home__cue");
  const foot = root.querySelector<HTMLElement>(".home__foot");
  const cards = Array.from(root.querySelectorAll<HTMLElement>(".collage article"));
  if (!pin || !stage || !orbita || !copyEl || !play || cards.length === 0) {
    return () => undefined;
  }
  const icono = play.querySelector<SVGElement>("svg");

  const scroller = root.closest(".escena-capa") as HTMLElement | null;
  const n = cards.length;
  const mm = gsap.matchMedia();

  mm.add(
    {
      isReduce: "(prefers-reduced-motion: reduce)",
      isMotion: "(prefers-reduced-motion: no-preference)",
      isCompacto: "(max-width: 767px)",
    },
    (context) => {
      const reduce = Boolean(context.conditions?.isReduce);
      const compacto = Boolean(context.conditions?.isCompacto);

      if (reduce) {
        root.classList.add("is-quieto");
        play.classList.add("is-vivo");
        play.removeAttribute("inert");
        return () => {
          root.classList.remove("is-quieto");
          play.classList.remove("is-vivo");
        };
      }

      root.classList.remove("is-quieto");
      gsap.set(cards, { xPercent: -50, yPercent: -50, force3D: true });
      gsap.set(play, { xPercent: -50, yPercent: -50, force3D: true });
      if (destello) gsap.set(destello, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.4 });
      if (brillo) gsap.set(brillo, { autoAlpha: 0, "--shine-x": "-20%" });
      if (core) gsap.set(core, { scale: 1, transformOrigin: "50% 50%" });
      if (icono) gsap.set(icono, { scale: 1, transformOrigin: "50% 50%" });

      const CARD_INICIO = 0.66;
      const CARD_STAGGER = 0.18;
      /** El scroll de la entrada cabe en este largo. Lo de después son los ocho fragmentos. */
      const DURACION = 2.4;
      const alTiempo = (p: number) => p * DURACION;
      let giroActual = 0;
      let aparte = 0;

      let destelloHecho = false;
      let destelloTl: gsap.core.Timeline | undefined;
      let pulsoTl: gsap.core.Timeline | undefined;

      const aparecidas = new Set<number>();
      const tweens: Array<gsap.core.Tween | undefined> = new Array(n);

      const apagarDestello = () => {
        destelloHecho = false;
        destelloTl?.kill();
        pulsoTl?.kill();
        destelloTl = undefined;
        pulsoTl = undefined;
        gsap.set(play, { autoAlpha: 0, scale: 0.42, x: 0, y: 0 });
        if (core) gsap.set(core, { scale: 1 });
        if (icono) gsap.set(icono, { scale: 1 });
        if (destello) gsap.set(destello, { autoAlpha: 0, scale: 0.4 });
        if (brillo) gsap.set(brillo, { autoAlpha: 0, "--shine-x": "-20%" });
      };

      const encenderPulso = () => {
        pulsoTl?.kill();
        pulsoTl = gsap.timeline({ repeat: -1 });
        if (core) {
          pulsoTl.to(core, { scale: 1.08, duration: 1.15, ease: "sine.inOut" }, 0);
          pulsoTl.to(core, { scale: 1, duration: 1.15, ease: "sine.inOut" });
        }
        if (brillo) {
          pulsoTl.fromTo(
            brillo,
            { autoAlpha: 0, "--shine-x": "-18%" },
            { autoAlpha: 0.85, "--shine-x": "118%", duration: 0.85, ease: "power2.inOut" },
            0.35,
          );
          pulsoTl.to(brillo, { autoAlpha: 0, duration: 0.22, ease: "power1.out" }, ">-0.12");
        }
      };

      const encenderDestello = () => {
        if (destelloHecho) return;
        destelloHecho = true;
        destelloTl?.kill();
        pulsoTl?.kill();
        destelloTl = gsap.timeline({ onComplete: encenderPulso });
        destelloTl.fromTo(
          play,
          { autoAlpha: 0, scale: 0.42 },
          { autoAlpha: 1, scale: 1, duration: 0.72, ease: "back.out(2.2)" },
          0,
        );
        if (icono) {
          destelloTl.fromTo(
            icono,
            { scale: 0.55 },
            { scale: 1, duration: 0.55, ease: "back.out(2.4)" },
            0.1,
          );
        }
        if (destello) {
          destelloTl.fromTo(
            destello,
            { scale: 0.22, autoAlpha: 1 },
            { scale: 3.1, autoAlpha: 0, duration: 0.82, ease: "power2.out" },
            0,
          );
          destelloTl.fromTo(
            destello,
            { scale: 0.45, autoAlpha: 0.55 },
            { scale: 2.15, autoAlpha: 0, duration: 0.58, ease: "power1.out", immediateRender: false },
            0.2,
          );
        }
        if (brillo) {
          destelloTl.fromTo(
            brillo,
            { autoAlpha: 0, "--shine-x": "-18%" },
            { autoAlpha: 0.92, "--shine-x": "118%", duration: 0.7, ease: "power2.inOut" },
            0.08,
          );
          destelloTl.to(brillo, { autoAlpha: 0, duration: 0.2, ease: "power1.out" }, 0.62);
        }
      };

      const marcoBase = (): Marco => ({ n, play, stage, pin, compacto, cue });
      const aplicarMedida = () => {
        gsap.set(cards, {
          width: (i: number) => puestoDe(i, n, giroActual, marcoBase(), aparte).card,
          height: (i: number) => puestoDe(i, n, giroActual, marcoBase(), aparte).card,
          x: (i: number) => puestoDe(i, n, giroActual, marcoBase(), aparte).x,
          y: (i: number) => puestoDe(i, n, giroActual, marcoBase(), aparte).y,
        });
      };

      const mostrarCard = (i: number) => {
        aparecidas.add(i);
        const t = tweens[i];
        if (t) {
          t.play();
          return;
        }
        tweens[i] = gsap.to(cards[i], {
          autoAlpha: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power2.out",
        });
      };

      const ocultarCard = (i: number) => {
        if (!aparecidas.has(i) && !tweens[i]) return;
        aparecidas.delete(i);
        tweens[i]?.reverse();
      };

      aplicarMedida();
      gsap.set(cards, {
        rotation: (i: number) => (i % 5 - 2) * 4,
        autoAlpha: 0,
        scale: 0.85,
        filter: "blur(8px)",
      });
      gsap.set(orbita, { rotation: 0 });
      gsap.set(copyEl, { autoAlpha: 1, scale: 1, y: 0 });
      if (cielo.length) gsap.set(cielo, { autoAlpha: 1 });
      if (fragmentos) gsap.set(fragmentos, { autoAlpha: 1 });
      gsap.set(play, { autoAlpha: 0, scale: 0.42, rotation: 0, y: 0, x: 0 });
      if (cue) gsap.set(cue, { autoAlpha: 1 });
      if (foot) gsap.set(foot, { autoAlpha: 0 });
      play.classList.remove("is-vivo");
      play.setAttribute("inert", "");

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "home-orbita",
          scroller: scroller ?? undefined,
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: compacto ? 1.25 : 2.2,
          invalidateOnRefresh: true,
          onRefresh: aplicarMedida,
          onUpdate: (self) => {
            const siguiente = self.progress >= 0.9 ? 1 : 0;
            if (siguiente !== aparte) {
              aparte = siguiente;
              aplicarMedida();
            }
          },
        },
      });

      if (cue) tl.to(cue, { autoAlpha: 0, duration: 0.1, ease: "power1.out" }, 0.04);
      if (cielo.length) tl.to(cielo, { autoAlpha: 0, duration: 0.34, ease: "power2.inOut" }, 0.04);

      tl.to(
        copyEl,
        {
          autoAlpha: 0,
          scale: 0.88,
          y: compacto ? -28 : -40,
          duration: 0.3,
          ease: "power2.inOut",
        },
        0.06,
      );
      if (fragmentos) {
        tl.to(fragmentos, { autoAlpha: 0, duration: 0.28, ease: "power2.inOut" }, 0.06);
      }

      const viaje = { a: 0 };
      const giroInicio = alTiempo(0.18);
      const giroFin = alTiempo(0.88);
      tl.to(
        viaje,
        {
          a: compacto ? 0.12 : 0.16,
          duration: giroFin - giroInicio,
          ease: "none",
          onUpdate: () => {
            giroActual = viaje.a;
            aplicarMedida();
          },
        },
        giroInicio,
      );
      tl.set({}, {}, DURACION);

      const denom = Math.max(n - 1, 1);
      cards.forEach((_, i) => {
        ScrollTrigger.create({
          id: `home-burbuja-${i}`,
          scroller: scroller ?? undefined,
          trigger: root,
          start: () => {
            const parent = ScrollTrigger.getById("home-orbita");
            if (!parent) return "top top";
            const p = CARD_INICIO + (i / denom) * CARD_STAGGER;
            return parent.start + (parent.end - parent.start) * p;
          },
          end: "+=1",
          invalidateOnRefresh: true,
          onEnter: () => mostrarCard(i),
          onLeaveBack: () => ocultarCard(i),
        });
      });

      const sentarPlay = () => {
        const tira = root.querySelector<HTMLElement>(".tira--der");
        const stage = root.querySelector<HTMLElement>(".home__stage");
        if (!tira || !stage) return;
        const t = tira.getBoundingClientRect();
        const s = stage.getBoundingClientRect();
        gsap.set(play, {
          x: t.left + t.width / 2 - (s.left + s.width / 2),
          y: t.top + t.height / 2 - (s.top + s.height / 2),
        });
      };
      const alPlay = () => {
        sentarPlay();
        destelloTl?.kill();
        pulsoTl?.kill();
        destelloTl = undefined;
        pulsoTl = undefined;
        destelloHecho = true;
        if (destello) gsap.set(destello, { autoAlpha: 0, scale: 0.4 });
        if (brillo) gsap.set(brillo, { autoAlpha: 0, "--shine-x": "-20%" });
        gsap.set(play, { scale: 1 });
        gsap.to(play, {
          autoAlpha: 1,
          duration: 0.35,
          ease: "power1.out",
          overwrite: "auto",
        });
      };
      const alOff = () => apagarDestello();
      root.addEventListener("home-play", alPlay);
      root.addEventListener("home-play-off", alOff);

      return () => {
        root.removeEventListener("home-play", alPlay);
        root.removeEventListener("home-play-off", alOff);
        tweens.forEach((t) => t?.kill());
        tweens.fill(undefined);
        aparecidas.clear();
        apagarDestello();
        play.classList.remove("is-vivo");
        play.removeAttribute("inert");
      };
    },
    root,
  );

  const refrescar = () => ScrollTrigger.refresh();
  const id = requestAnimationFrame(() => {
    refrescar();
    void document.fonts?.ready.then(refrescar);
  });

  return () => {
    cancelAnimationFrame(id);
    mm.revert();
  };
}
