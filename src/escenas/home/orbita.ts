import { ensureGsap, ScrollTrigger } from "../../motion/gsap";

type Marco = {
  n: number;
  play: HTMLElement;
  stage: HTMLElement;
  pin: HTMLElement;
  compacto: boolean;
  cue: HTMLElement | null;
};

type Ejes = { rx: number; ry: number; card: number };

/** El óvalo usa el ancho de la pantalla y queda más bajo que ancho. */
function ejesDe(m: Marco): Ejes {
  const s = m.stage.getBoundingClientRect();
  const p = m.pin.getBoundingClientRect();
  const cx = s.left + s.width * 0.5;
  const cy = s.top + s.height * 0.5;
  const cueTop = m.cue?.getBoundingClientRect().top;
  const toBottom = (cueTop ?? p.bottom) - cy;
  const cap = m.compacto ? 78 : 104;
  const floor = m.compacto ? 48 : 68;
  const card = Math.max(floor, Math.min(cap, Math.round(s.width * 0.072)));
  const margen = card * 0.5 + 12;
  const rx = Math.max(96, Math.min(cx - p.left, p.right - cx) - margen);
  const ryTope = Math.max(72, Math.min(cy - p.top, toBottom) - margen);
  const ry = Math.min(ryTope, rx * (m.compacto ? 0.7 : 0.56));
  return { rx, ry, card };
}

/** Reparte los ángulos por arco, para que no se junten en las puntas del óvalo. */
function fasesDe(n: number, rx: number, ry: number): number[] {
  const pasos = 480;
  const dist = new Array<number>(pasos);
  let total = 0;
  let px = rx;
  let py = 0;
  for (let i = 1; i <= pasos; i += 1) {
    const a = (i / pasos) * Math.PI * 2;
    const x = rx * Math.cos(a);
    const y = ry * Math.sin(a);
    total += Math.hypot(x - px, y - py);
    dist[i - 1] = total;
    px = x;
    py = y;
  }
  const out: number[] = [];
  for (let k = 0; k < n; k += 1) {
    const objetivo = (k / n) * total;
    let a = 0;
    for (let i = 0; i < pasos; i += 1) {
      if (dist[i]! >= objetivo) {
        a = ((i + 1) / pasos) * Math.PI * 2;
        break;
      }
    }
    out.push(a - Math.PI / 2);
  }
  return out;
}

/** Rectángulo del centro que no toca las carátulas, sea cual sea el giro. */
function huecoDe(ejes: Ejes): { w: number; h: number } {
  const radio = ejes.card * 0.5 + 18;
  let hh = Math.min(ejes.ry * 0.58, 168);
  let hw = Math.min(ejes.rx * 0.62, 300);
  const muestras = 180;
  const choca = (w: number, h: number) => {
    for (let i = 0; i < muestras; i += 1) {
      const a = (i / muestras) * Math.PI * 2;
      const cx = ejes.rx * Math.cos(a);
      const cy = ejes.ry * Math.sin(a);
      const nx = Math.max(-w, Math.min(w, cx));
      const ny = Math.max(-h, Math.min(h, cy));
      if (Math.hypot(cx - nx, cy - ny) < radio) return true;
    }
    return false;
  };
  while (hh > 72 && choca(hw, hh)) hh -= 6;
  while (hw > 110 && choca(hw, hh)) hw -= 6;
  return { w: Math.round(hw * 2), h: Math.round(hh * 2) };
}

/** El scroller es `.escena-capa`. Sin pin de GSAP: el marco va con sticky. */
export function montarOrbita(root: HTMLElement): () => void {
  const gsap = ensureGsap();
  const pin = root.querySelector<HTMLElement>(".home__pin");
  const stage = root.querySelector<HTMLElement>(".home__stage");
  const orbita = root.querySelector<HTMLElement>(".home__orbita");
  const copyEl = root.querySelector<HTMLElement>(".home__copy");
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

      const CARD_INICIO = 0.18;
      const CARD_STAGGER = 0.64;
      /** El scroll de la entrada cabe en este largo. Lo de después son los ocho fragmentos. */
      const DURACION = 2.4;
      const alTiempo = (p: number) => p * DURACION;
      let giroActual = 0;

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
        const ejes = ejesDe(marco());
        const fases = fasesDe(n, ejes.rx, ejes.ry);
        const hueco = huecoDe(ejes);
        stage.style.setProperty("--hueco", hueco.w + "px");
        stage.style.setProperty("--hueco-alto", hueco.h + "px");
        gsap.set(cards, {
          width: ejes.card,
          height: ejes.card,
          x: (i: number) => Math.cos((fases[i] ?? 0) + giroActual) * ejes.rx,
          y: (i: number) => Math.sin((fases[i] ?? 0) + giroActual) * ejes.ry,
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
        rotation: 0,
        autoAlpha: 0,
        scale: 0.85,
        filter: "blur(8px)",
      });
      gsap.set(orbita, { rotation: 0 });
      gsap.set(copyEl, { autoAlpha: 1, scale: 1, y: 0 });
      if (fragmentos) gsap.set(fragmentos, { autoAlpha: 1 });
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
            if (self.progress >= 0.92 && self.direction >= 0) encenderDestello();
            else if (self.progress < 0.88) apagarDestello();
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
      if (fragmentos) {
        tl.to(fragmentos, { autoAlpha: 0, duration: 0.28, ease: "power2.inOut" }, 0.06);
      }

      const viaje = { a: 0 };
      const giroInicio = alTiempo(0.18);
      const giroFin = alTiempo(0.88);
      tl.to(
        viaje,
        {
          a: (compacto ? 110 : 150) * (Math.PI / 180),
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
