import { ensureGsap } from "./gsap";

export function escenaContext(root: Element, fn: () => void) {
  const gsap = ensureGsap();
  return gsap.context(fn, root);
}
