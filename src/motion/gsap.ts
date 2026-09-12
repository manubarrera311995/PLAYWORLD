import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function ensureGsap(): typeof gsap {
  if (!registered) {
    gsap.registerPlugin(Flip, ScrollTrigger);
    registered = true;
  }
  return gsap;
}

export { gsap, Flip, ScrollTrigger };
