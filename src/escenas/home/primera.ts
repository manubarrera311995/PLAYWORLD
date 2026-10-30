import { ensureGsap, ScrollTrigger } from "../../motion/gsap";
import { cruceSuave } from "../paradas";
import { consumirPregunta, crucePrimera, enPregunta } from "./ancla";
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
const PESO_CAMARA = 9;
const PESO_SIGUE = 6;
const PESO_CIERRE = 8;

function pesosDe(beats: HTMLElement[]): number[] {
  const umbralI = beats.findIndex((beat) => beat.classList.contains("home__beat--umbral"));
  return beats.map((beat, i) => {
    if (beat.classList.contains("home__beat--lado")) return PESO_CAMARA;
    if (beat.classList.contains("home__beat--umbral")) return PESO_UMBRAL;
    if (beat.classList.contains("home__beat--fan")) return PESO_FAN;
    if (beat.classList.contains("home__beat--entendido")) return PESO_ENTENDIDO;
    if (beat.classList.contains("home__beat--cierre")) return PESO_CIERRE;
    if (beat.classList.contains("home__beat--sigue")) return PESO_SIGUE;
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
 * Las frases no se disuelven: la que sale se recorta hacia arriba y la
 * siguiente ya viene subiendo, con un solape corto.
 */
const Y_FUERA = 118;
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
      if (context.conditions?.isReduce) {
        if (consumirPregunta()) {
          root.querySelector(".home__beat--pregunta")?.scrollIntoView({ block: "center" });
          enPregunta.set(true);
          crucePrimera.set(1);
        }
        return () => {
          enPregunta.set(false);
          crucePrimera.set(0);
        };
      }
      const compacto = Boolean(context.conditions?.isCompacto);
      const pesos = pesosDe(beats);
      const n = beats.length;
      const fade = Math.min(0.028, ((FIN - INICIO) / n) * 0.3);
      const camaraI = beats.findIndex((beat) => beat.classList.contains("home__beat--lado"));
      const entendidoI = beats.findIndex((beat) => beat.classList.contains("home__beat--entendido"));
      const toma = root.querySelector<HTMLElement>(".home__toma");
      const pila = root.querySelector<HTMLElement>(".home__pila");
      const orbita = root.querySelector<HTMLElement>(".home__orbita");
      const lado = camaraI >= 0 ? beats[camaraI]?.querySelector<HTMLElement>(".home__lado") : null;
      const ventana = camaraI >= 0 ? tramo(camaraI, pesos) : null;
      const vertical = entendidoI >= 0 ? tramo(entendidoI, pesos) : null;
      const tomaDesde = vertical?.entra ?? ventana?.entra ?? FIN;
      const tomaHasta = ventana?.sale ?? vertical?.sale ?? FIN;

      /** La cámara nace de pie en la columna derecha. El ancho visual es el alto del cuerpo. */
      const pose = (): { x: number; y: number; scale: number } => {
        const stage = root.querySelector<HTMLElement>(".home__stage");
        if (!stage || !toma) return { x: 220, y: 0, scale: 0.32 };
        const s = stage.getBoundingClientRect();
        const base = toma.offsetWidth || 1;
        const alto = s.height * (compacto ? 0.42 : 0.58);
        const ancho = s.width * (compacto ? 0.34 : 0.28);
        const porAlto = alto / base;
        const porAncho = (ancho * 1.4994) / base;
        const scale = Math.min(0.5, Math.max(0.16, Math.min(porAlto, porAncho)));
        const col = s.width * (compacto ? 0.58 : 0.74);
        return {
          x: col - s.width / 2,
          y: compacto ? -s.height * 0.14 : s.height * 0.02,
          scale,
        };
      };

      gsap.set(beats, { autoAlpha: 1 });
      gsap.set(
        beats.flatMap((beat) => {
          if (beat.classList.contains("home__beat--umbral")) return [];
          const frase = beat.querySelector<HTMLElement>(".home__frase");
          return frase ? [frase] : [];
        }),
        { yPercent: Y_FUERA, autoAlpha: 0 },
      );
      beats.forEach((el) => {
        el.setAttribute("aria-hidden", "true");
        el.setAttribute("inert", "");
      });

      let tiraFin = PLAY_VIVO;
      let dentro = false;
      let crucePublicado = -1;
      let anclar = false;
      const entraPregunta = tramo(0, pesos).entra;
      const vaAPregunta = consumirPregunta();
      if (vaAPregunta) {
        anclar = true;
        dentro = true;
        enPregunta.set(true);
        crucePublicado = 1;
        crucePrimera.set(1);
      }
      const marcar = (valor: boolean) => {
        if (valor === dentro) return;
        dentro = valor;
        enPregunta.set(valor);
      };
      const publicarCruce = (progress: number) => {
        if (anclar) return;
        const valor = Math.round(cruceSuave(progress) * 10000) / 10000;
        if (valor === crucePublicado) return;
        crucePublicado = valor;
        crucePrimera.set(valor);
      };

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
            publicarCruce(self.progress);
            marcar(self.progress >= entraPregunta);
            let vivo = indice(self.progress, pesos);
            const cierreI = beats.findIndex((beat) => beat.classList.contains("home__beat--cierre"));
            if (cierreI >= 0 && vivo < 0 && self.progress >= tramo(cierreI, pesos).entra) vivo = cierreI;
            const tomaViva = self.progress >= tomaDesde && self.progress < tomaHasta;
            const ancho = ventana ? ventana.sale - ventana.entra : 1;
            const llena =
              ventana !== null &&
              self.progress >= ventana.entra + ancho * 0.56 &&
              self.progress < ventana.entra + ancho * 0.9;
            root.classList.toggle("is-toma", tomaViva);
            root.classList.toggle("is-llena", llena);
            beats.forEach((el, i) => {
              const on = i === vivo;
              el.toggleAttribute("aria-hidden", !on);
              if (on) el.removeAttribute("inert");
              else el.setAttribute("inert", "");
            });
            if (toma) toma.toggleAttribute("aria-hidden", !tomaViva);
            const encendido = root.classList.contains("is-listo");
            if (!encendido && self.progress >= tiraFin) {
              root.classList.add("is-listo");
              root.dispatchEvent(new Event("home-play"));
            } else if (encendido && self.progress < tiraFin - 0.05) {
              root.classList.remove("is-listo");
              root.dispatchEvent(new Event("home-play-off"));
            }
            const listo = root.classList.contains("is-listo");
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
          transformOrigin: "50% 50%",
          rotation: -90,
          x: () => pose().x,
          y: () => pose().y + 72,
          scale: () => pose().scale * 0.7,
          autoAlpha: 0,
          force3D: true,
        });
      }

      const cierreI = beats.findIndex((beat) => beat.classList.contains("home__beat--cierre"));

      beats.forEach((beat, i) => {
        if (beat.classList.contains("home__beat--umbral") || beat.classList.contains("home__beat--lado")) return;
        const frase = beat.querySelector<HTMLElement>(".home__frase");
        if (!frase) return;
        const { entra, sale } = tramo(i, pesos);
        const ancho = Math.max(0.02, sale - entra);
        const d = Math.min(Math.max(ancho * 0.3, 0.016), 0.046);
        const inicio = entra - (i === 0 ? 0 : d * 0.55);
        const finEntrada = inicio + d;
        tl.set(frase, { autoAlpha: 1 }, inicio);
        tl.fromTo(
          frase,
          { yPercent: Y_FUERA },
          { yPercent: 0, duration: d, ease: "none", immediateRender: false, force3D: true },
          inicio,
        );
        if (i === cierreI) return;
        let salida = sale - d * 0.72;
        if (salida < finEntrada + ancho * 0.08) salida = finEntrada + ancho * 0.12;
        tl.to(
          frase,
          { yPercent: -Y_FUERA, duration: d, ease: "none", immediateRender: false, force3D: true },
          salida,
        );
        tl.to(
          frase,
          { autoAlpha: 0, duration: d * 0.28, ease: "power1.in", immediateRender: false },
          salida + d * 0.72,
        );
      });

      const umbralI = beats.findIndex((beat) => beat.classList.contains("home__beat--umbral"));
      const soltarUmbral = umbralI >= 0 ? cruzarUmbral(tl, root, tramo(umbralI, pesos)) : null;

      const fanI = beats.findIndex((beat) => beat.classList.contains("home__beat--fan"));
      const pista = root.querySelector<HTMLElement>(".home__beat--fan .tira__pista");
      if (pista && fanI >= 0) {
        const { entra, sale } = tramo(fanI, pesos);
        const dur = sale - entra;
        const abajo = () => pista.parentElement?.clientHeight ?? 0;
        const tiraFan = pista.closest<HTMLElement>(".tira");
        gsap.set(pista, { y: abajo });
        if (tiraFan) {
          gsap.set(tiraFan, { autoAlpha: 0 });
          tl.to(tiraFan, { autoAlpha: 1, duration: fade, ease: "power1.out" }, entra);
          tl.to(tiraFan, { autoAlpha: 0, duration: fade, ease: "power1.in" }, Math.max(entra, sale - fade));
        }
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

      const sigueIdx = beats
        .map((beat, i) => (beat.classList.contains("home__beat--sigue") ? i : -1))
        .filter((i) => i >= 0);
      const cola =
        sigueIdx.length > 0
          ? {
              entra: tramo(sigueIdx[0] ?? 0, pesos).entra,
              sale: tramo(sigueIdx[sigueIdx.length - 1] ?? 0, pesos).sale,
            }
          : null;
      tiraFin = cola?.sale ?? PLAY_VIVO;

      if (orbita && vertical) {
        tl.to(orbita, { autoAlpha: 0, duration: fade, ease: "power1.in" }, vertical.entra);
      }

      const tiraDer = root.querySelector<HTMLElement>(".tira--der");
      const pistaDer = root.querySelector<HTMLElement>(".tira--der .tira__pista");
      const alCargar = () => {
        tl.invalidate();
        tl.progress(tl.progress());
      };
      tiraDer?.addEventListener("cargada", alCargar);
      if (tiraDer) gsap.set(tiraDer, { autoAlpha: 0 });
      if (pistaDer && cola) {
        const { entra, sale } = cola;
        const dur = sale - entra;
        const abajo = () => pistaDer.parentElement?.clientHeight ?? 0;
        gsap.set(pistaDer, { y: abajo });
        tl.to(tiraDer, { autoAlpha: 1, duration: fade * 1.4, ease: "power1.out" }, entra);
        tl.fromTo(
          pistaDer,
          { y: abajo },
          {
            y: () => abajo() - pistaDer.offsetHeight,
            duration: dur * 0.92,
            ease: "none",
            immediateRender: false,
          },
          entra + dur * 0.02,
        );
        tl.to(tiraDer, { autoAlpha: 0, duration: fade, ease: "power1.in" }, sale - fade);
      }

      if (toma && vertical && ventana) {
        const nace = vertical.entra + (vertical.sale - vertical.entra) * 0.04;
        const gira = ventana.entra + (ventana.sale - ventana.entra) * 0.34;
        tl.to(
          toma,
          { autoAlpha: 1, duration: (vertical.sale - vertical.entra) * 0.14, ease: "power1.out" },
          nace,
        );
        tl.fromTo(
          toma,
          {
            rotation: -90,
            x: () => pose().x,
            y: () => pose().y + 28,
            scale: () => pose().scale * 0.7,
          },
          {
            rotation: -90,
            x: () => pose().x,
            y: () => pose().y,
            scale: () => Math.min(0.68, pose().scale * 1.85),
            duration: gira - nace,
            ease: "none",
            immediateRender: false,
          },
          nace,
        );
        const { entra, sale } = ventana;
        const dur = sale - entra;
        tl.to(
          toma,
          {
            rotation: 0,
            x: 0,
            y: 0,
            scale: 1,
            duration: dur * 0.22,
            ease: "power2.inOut",
            immediateRender: false,
          },
          gira,
        );
        const fraseLado = lado?.querySelector<HTMLElement>(".home__frase");
        if (fraseLado) {
          const hueco = Math.max(0.02, gira - ventana.entra);
          const sube = Math.min(hueco * 0.42, 0.03);
          tl.set(fraseLado, { autoAlpha: 1 }, ventana.entra);
          tl.fromTo(
            fraseLado,
            { yPercent: Y_FUERA },
            { yPercent: 0, duration: sube, ease: "none", immediateRender: false, force3D: true },
            ventana.entra,
          );
          const corta = Math.min(hueco * 0.34, 0.028);
          tl.to(
            fraseLado,
            { yPercent: -Y_FUERA, duration: corta, ease: "none", immediateRender: false, force3D: true },
            gira,
          );
          tl.to(
            fraseLado,
            { autoAlpha: 0, duration: corta * 0.28, ease: "power1.in", immediateRender: false },
            gira + corta * 0.72,
          );
        }
        tl.to(
          toma,
          {
            autoAlpha: 0,
            scale: 0.9,
            y: -24,
            duration: dur * 0.1,
            ease: "power2.in",
          },
          entra + dur * 0.9,
        );
      }
      tl.set({}, {}, 1);
      publicarCruce(tl.scrollTrigger?.progress ?? 0);

      if (vaAPregunta) {
        const { entra, sale } = tramo(0, pesos);
        const progreso = entra + (sale - entra) * 0.45;
        const colocar = (intento: number) => {
          const st = tl.scrollTrigger;
          if (!st) return;
          const largo = st.end - st.start;
          if (largo < 1 && intento < 8) {
            requestAnimationFrame(() => colocar(intento + 1));
            return;
          }
          const y = st.start + largo * progreso;
          const scroller = st.scroller;
          anclar = false;
          if (scroller instanceof HTMLElement) scroller.scrollTop = y;
          else window.scrollTo(0, y);
          ScrollTrigger.update();
        };
        requestAnimationFrame(() => colocar(0));
      }

      return () => {
        enPregunta.set(false);
        crucePrimera.set(0);
        soltarUmbral?.();
        tl.scrollTrigger?.kill();
        tl.kill();
        play.classList.remove("is-vivo");
        play.removeAttribute("inert");
        play.setAttribute("aria-label", etiqueta);
        beats.forEach((el) => el.removeAttribute("inert"));
        tiraDer?.removeEventListener("cargada", alCargar);
        root.classList.remove("is-toma");
        root.classList.remove("is-llena");
        root.classList.remove("is-listo");
      };
    },
    root,
  );

  return () => mm.revert();
}
