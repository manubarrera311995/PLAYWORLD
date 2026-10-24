import { ScrollTrigger, ensureGsap } from "../../motion/gsap";

type Timeline = ReturnType<ReturnType<typeof ensureGsap>["timeline"]>;

/**
 * La noche cierra el marco hasta dejar una rendija.
 * El año queda partido a los lados y las fotos cruzan pegadas, sin hueco.
 */
export function cruzarUmbral(
  tl: Timeline,
  root: HTMLElement,
  ventana: { entra: number; sale: number },
): () => void {
  const gsap = ensureGsap();
  const anio = root.querySelector<HTMLElement>(".home__anio");
  const umbral = root.querySelector<HTMLElement>(".home__umbral");
  const rendija = root.querySelector<HTMLElement>(".home__rendija");
  const copia = root.querySelector<HTMLElement>(".home__umbral-copy");
  const lados = Array.from(root.querySelectorAll<HTMLElement>(".home__cierre-izq, .home__cierre-der"));
  const frentes = Array.from(root.querySelectorAll<HTMLElement>(".home__cierre-arriba, .home__cierre-abajo"));
  const cinta = root.querySelector<HTMLElement>(".home__cinta");
  const fotos = Array.from(root.querySelectorAll<HTMLElement>(".home__umbral-foto"));
  const stage = root.querySelector<HTMLElement>(".home__stage");
  const pin = root.querySelector<HTMLElement>(".home__pin");
  const cierre = root.querySelector<HTMLElement>(".home__cierre");
  const arriba = root.querySelector<HTMLElement>(".home__cierre-arriba");
  const abajo = root.querySelector<HTMLElement>(".home__cierre-abajo");
  const izq = lados[0];
  const der = lados[1];
  if (!anio || !umbral || !rendija || !cinta || !copia || !stage || !pin || !cierre || !arriba || !abajo || !izq || !der || fotos.length < 2) {
    return () => undefined;
  }

  const medir = () => {
    const s = stage.getBoundingClientRect();
    const p = pin.getBoundingClientRect();
    const ancho = Math.max(108, Math.min(p.width * 0.13, 210));
    const alto = Math.max(220, Math.min(p.height * 0.56, p.height - 168));
    const top = (p.height - alto) / 2 - (s.top - p.top) - p.height * 0.03;
    const sobra = 12;
    gsap.set(cierre, {
      top: -s.top - sobra,
      left: -s.left - sobra,
      width: window.innerWidth + sobra * 2,
      height: window.innerHeight + sobra * 2,
    });
    gsap.set(rendija, { width: ancho, height: alto, top });
    gsap.set(anio, { top: top + alto / 2 });
    root.style.setProperty("--corte", `${Math.round(ancho)}px`);
    const c = cierre.getBoundingClientRect();
    const r = rendija.getBoundingClientRect();
    gsap.set(izq, { width: Math.max(0, r.left - c.left) });
    gsap.set(der, { width: Math.max(0, c.right - r.right) });
    gsap.set(arriba, { left: r.left - c.left, width: r.width, height: Math.max(0, r.top - c.top) });
    gsap.set(abajo, {
      left: r.left - c.left,
      width: r.width,
      top: r.bottom - c.top,
      height: Math.max(0, c.bottom - r.bottom),
    });
  };
  medir();
  ScrollTrigger.addEventListener("refresh", medir);

  const { entra, sale } = ventana;
  const dur = Math.max(0.05, sale - entra);
  const tCierre = dur * 0.16;
  const aliento = dur * 0.045;
  const salida = dur * 0.11;
  const pasoEn = entra + tCierre + aliento;
  const cruce = sale - salida - pasoEn;

  gsap.set(anio, { autoAlpha: 0 });
  gsap.set(umbral, { autoAlpha: 0 });
  gsap.set(copia, { autoAlpha: 0, y: 16 });
  gsap.set(cinta, { x: () => rendija.offsetWidth, force3D: true });
  gsap.set(lados, { scaleX: 0, transformOrigin: (i) => (i === 0 ? "left center" : "right center") });
  gsap.set(frentes, { scaleY: 0, transformOrigin: (i) => (i === 0 ? "center top" : "center bottom") });

  tl.to(
    lados,
    {
      scaleX: 1,
      duration: tCierre,
      ease: "power3.inOut",
      transformOrigin: (i: number) => (i === 0 ? "left center" : "right center"),
    },
    entra,
  );
  tl.to(
    frentes,
    {
      scaleY: 1,
      duration: tCierre,
      ease: "power3.inOut",
      transformOrigin: (i: number) => (i === 0 ? "center top" : "center bottom"),
    },
    entra,
  );
  tl.to(anio, { autoAlpha: 1, duration: tCierre * 0.55, ease: "power2.out" }, entra + tCierre * 0.45);
  tl.to(umbral, { autoAlpha: 1, duration: dur * 0.03, ease: "none" }, entra + tCierre * 0.9);

  tl.fromTo(
    cinta,
    { x: () => rendija.offsetWidth },
    {
      x: () => -cinta.scrollWidth,
      duration: cruce,
      ease: "none",
      force3D: true,
      immediateRender: false,
    },
    pasoEn,
  );

  tl.to(copia, { autoAlpha: 1, y: 0, duration: dur * 0.05, ease: "power2.out" }, pasoEn);
  tl.to(copia, { autoAlpha: 0, duration: salida * 0.35, ease: "power1.in" }, sale - salida);

  tl.to(umbral, { autoAlpha: 0, duration: salida * 0.3, ease: "power1.in" }, sale - salida);
  tl.to(anio, { autoAlpha: 0, duration: salida * 0.4, ease: "power1.in" }, sale - salida);
  tl.to(lados, { scaleX: 0, duration: salida * 0.7, ease: "power2.inOut" }, sale - salida * 0.75);
  tl.to(frentes, { scaleY: 0, duration: salida * 0.7, ease: "power2.inOut" }, sale - salida * 0.75);

  return () => ScrollTrigger.removeEventListener("refresh", medir);
}
