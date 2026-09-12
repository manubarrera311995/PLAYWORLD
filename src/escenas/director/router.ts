import { get } from "svelte/store";
import { recorrido } from "../../estado/recorrido";

export type RutaParsed =
  | { name: "home"; path: "/" }
  | { name: "hook"; path: "/hook" }
  | { name: "archivo"; path: "/archivo"; year: number | null }
  | { name: "edicion"; path: "/edicion"; year: number }
  | { name: "ipod"; path: "/ipod" }
  | { name: "creacion"; path: "/creacion" }
  | { name: "colectiva"; path: "/colectiva" };

export type Listener = (ruta: RutaParsed) => void;

const listeners = new Set<Listener>();

function yearFromSearch(search: string): number | null {
  const y = new URLSearchParams(search).get("y");
  if (!y) return null;
  const n = Number(y);
  return Number.isFinite(n) ? n : null;
}

export function parsePath(pathname: string, search = ""): RutaParsed {
  if (pathname === "/" || pathname === "") return { name: "home", path: "/" };
  if (pathname === "/hook") return { name: "hook", path: "/hook" };
  if (pathname === "/archivo" || pathname.startsWith("/archivo")) {
    return { name: "archivo", path: "/archivo", year: yearFromSearch(search) };
  }
  const ed = pathname.match(/^\/edicion\/(\d{4})$/);
  if (ed) return { name: "edicion", path: "/edicion", year: Number(ed[1]) };
  if (pathname === "/ipod") return { name: "ipod", path: "/ipod" };
  if (pathname === "/creacion") return { name: "creacion", path: "/creacion" };
  if (pathname === "/colectiva") return { name: "colectiva", path: "/colectiva" };
  return { name: "home", path: "/" };
}

export function currentRuta(): RutaParsed {
  if (typeof location === "undefined") return { name: "home", path: "/" };
  return parsePath(location.pathname, location.search);
}

function gate(ruta: RutaParsed): RutaParsed {
  const rec = get(recorrido);
  if (ruta.name === "creacion" && !rec.alma) {
    return { name: "ipod", path: "/ipod" };
  }
  return ruta;
}

export function hrefOf(ruta: RutaParsed): string {
  if (ruta.name === "archivo") {
    return ruta.year ? `/archivo?y=${ruta.year}` : "/archivo";
  }
  if (ruta.name === "edicion") return `/edicion/${ruta.year}`;
  return ruta.path;
}

export function navigate(href: string, replace = false): void {
  const url = new URL(href, location.origin);
  let ruta = parsePath(url.pathname, url.search);
  ruta = gate(ruta);
  const next = hrefOf(ruta);
  if (replace) history.replaceState({}, "", next);
  else history.pushState({}, "", next);
  emit();
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(): void {
  const ruta = gate(currentRuta());
  if (hrefOf(ruta) !== location.pathname + location.search) {
    history.replaceState({}, "", hrefOf(ruta));
  }
  for (const fn of listeners) fn(ruta);
}

export function initRouter(): () => void {
  const onPop = () => emit();
  window.addEventListener("popstate", onPop);
  emit();
  return () => window.removeEventListener("popstate", onPop);
}
