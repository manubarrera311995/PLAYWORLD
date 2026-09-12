import { writable } from "svelte/store";

const query = typeof window !== "undefined"
  ? window.matchMedia("(prefers-reduced-motion: reduce)")
  : null;

export const reduce = writable(query?.matches ?? false);

export function initReducedMotion(): () => void {
  if (!query) return () => undefined;
  const onChange = () => reduce.set(query.matches);
  onChange();
  query.addEventListener("change", onChange);
  document.documentElement.classList.toggle("reduce", query.matches);
  const unsub = reduce.subscribe((v) => {
    document.documentElement.classList.toggle("reduce", v);
  });
  return () => {
    query.removeEventListener("change", onChange);
    unsub();
  };
}
