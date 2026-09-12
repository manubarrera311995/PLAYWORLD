import { ensureGsap, ScrollTrigger } from "../../motion/gsap";

type Marco = {
  n: number;
  play: HTMLElement;
  stage: HTMLElement;
  pin: HTMLElement;
  compacto: boolean;
  cue: HTMLElement | null;
};

function distPolar(r1: number, a1: number, r2: number, a2: number): number {
  return Math.hypot(
    r1 * Math.cos(a1) - r2 * Math.cos(a2),
    r1 * Math.sin(a1) - r2 * Math.sin(a2),
  );
}

function radioMax(m: Marco, card: number): number {
  const s = m.stage.getBoundingClientRect();
  const p = m.pin.getBoundingClientRect();
  const cx = s.left + s.width * 0.5;
  const cy = s.top + s.height * 0.5;
  const margen = card * 0.5 + 8;
  const cueTop = m.cue?.getBoundingClientRect().top;
  const toBottom = (cueTop ?? p.bottom) - cy;
  return Math.max(
    48,
    Math.min(cx - p.left, p.right - cx, cy - p.top, toBottom) - margen,
  );
}

function layoutDe(m: Marco) {
  const playSize = m.play.offsetWidth || (m.compacto ? 88 : 128);
  const pares = Math.max(Math.floor(m.n / 2), 3);
  const paso = (Math.PI * 2) / pares;
  const cuerda = 2 * Math.sin(Math.PI / pares);
  const floor = m.compacto ? 56 : 84;
  const cap = m.compacto ? 112 : 156;
  const gapPlay = m.compacto ? 22 : 32;
  let card = Math.min(cap, Math.round(playSize * 1.22));

  for (let s = 0; s < 24; s += 1) {
    const maxR = radioMax(m, card);
    const minR = playSize * 0.5 + card * 0.5 + gapPlay;
    const rNeed = (card * 1.06) / cuerda;
    const rIn = Math.max(minR, rNeed);
    const rOut = maxR;
    const sepMin = card * 1.05;
    const ok =
      rOut > rIn + card * 0.38 &&
      rIn * cuerda >= sepMin &&
      rOut * cuerda >= sepMin &&
      distPolar(rIn, 0, rOut, paso * 0.5) >= sepMin;
    if (ok) return { rIn, rOut, card };
    card = Math.max(floor, card - 4);
  }

  const maxR = radioMax(m, card);
  const minR = playSize * 0.5 + card * 0.5 + gapPlay;
  return { rIn: Math.max(minR, maxR * 0.62), rOut: maxR, card };
}

/** Mitad de años en el anillo interno, mitad en el externo, desfasados para no montarse. */
function poseDe(i: number, m: Marco) {
  const { rIn, rOut } = layoutDe(m);
  const pares = Math.max(Math.floor(m.n / 2), 3);
  const paso = (Math.PI * 2) / pares;
  const interior = i < pares;
  const k = interior ? i : i - pares;
  const a = k * paso + (interior ? 0 : paso * 0.5) - Math.PI / 2;
  const r = interior ? rIn : rOut;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r, a };
}

/** El scroller es `.escena-capa`. Sin pin de GSAP: el marco va con sticky. */
export function montarOrbita(root: HTMLElement): () => void {
  const gsap = ensureGsap();
  const pin = root.querySelector<HTMLElement>(".home__pin");
  const stage = root.querySelector<HTMLElement>(".home__stage");
  const orbita = root.querySelector<HTMLElement>(".home__orbita");
  const copyEl = root.querySelector<HTMLElement>(".home__copy");
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

      const CARD_INICIO = 0.32;
      const CARD_STAGGER = 0.4;
      const Y_ENTRADA = 20;

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
        gsap.set(play, { autoAlpha: 0, scale: 0.42 });
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

      const marco = (): Marco => ({ n, play, stage, pin, compacto, cue });
      const aplicarMedida = () => {
        const { card } = layoutDe(marco());
        gsap.set(cards, {
          width: card,
          height: card,
          x: (i: number) => poseDe(i, marco()).x,
          y: (i: number) => poseDe(i, marco()).y + (aparecidas.has(i) ? 0 : Y_ENTRADA),
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
          y: () => poseDe(i, marco()).y,
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
        x: (i) => poseDe(i, marco()).x,
        y: (i) => poseDe(i, marco()).y + Y_ENTRADA,
        rotation: 0,
        autoAlpha: 0,
        scale: 0.85,
        filter: "blur(8px)",
      });
      gsap.set(orbita, { rotation: 0 });
      gsap.set(copyEl, { autoAlpha: 1, scale: 1, y: 0 });
      gsap.set(play, { autoAlpha: 0, scale: 0.42, rotation: 0, y: 0 });
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
            const vivo = self.progress >= 0.2;
            play.classList.toggle("is-vivo", vivo);
            if (vivo) play.removeAttribute("inert");
            else play.setAttribute("inert", "");
            if (vivo && self.direction >= 0) encenderDestello();
            else if (!vivo) apagarDestello();
          },
        },
      });

      if (cue) tl.to(cue, { autoAlpha: 0, duration: 0.1, ease: "power1.out" }, 0.04);

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

      if (foot) tl.to(foot, { autoAlpha: 1, duration: 0.12, ease: "power1.out" }, 0.62);

      const giro = compacto ? 160 : 210;
      tl.to(orbita, { rotation: giro, duration: 0.38, ease: "none" }, 0.74);
      tl.to(cards, { rotation: -giro, duration: 0.38, ease: "none" }, 0.74);

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

      return () => {
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
