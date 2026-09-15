/**
 * Contratos estáticos del markup y el CSS de `FondoHome.svelte` (tarea 7.1).
 *
 * La suite corre con `environment: "node"` y sin DOM, así que las cuatro capas
 * se verifican leyendo la fuente del componente: orden en el DOM, atributos
 * decorativos, apilado por debajo de `--z-grain`, mezcla admitida, ausencia de
 * `isolation` / `filter` / `backdrop-filter` / `opacity` en reposo sobre
 * `.home__fondo` y el fallback de `@supports`.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.9, 2.10, 6.8, 10.6, 12.5
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { MEZCLAS_PERMITIDAS, Z_GRAIN, Z_OVERLAYS } from "../src/escenas/home/fondo.curvas";

const rutaComponente = fileURLToPath(
  new URL("../src/escenas/home/FondoHome.svelte", import.meta.url),
);
const rutaFoto = fileURLToPath(new URL("../public/assets/home/fondo.jpeg", import.meta.url));
const fuente = readFileSync(rutaComponente, "utf8");

/** Devuelve el cuerpo de la primera regla CSS cuyo selector coincide exactamente. */
function bloque(selector: string): string {
  const escapado = selector.replace(/[.[\]"=^$*+?()|{}\\/]/g, (c) => `\\${c}`);
  const encontrado = new RegExp(`(?:^|\\n)\\s*${escapado}\\s*\\{([^}]*)\\}`).exec(fuente);
  expect(encontrado, `no hay regla CSS para ${selector}`).not.toBeNull();
  return (encontrado as RegExpExecArray)[1];
}

/** Lee una declaración concreta dentro de un cuerpo de regla. */
function declaracion(cuerpo: string, propiedad: string): string | null {
  const encontrado = new RegExp(`(?:^|;|\\n)\\s*${propiedad}\\s*:\\s*([^;]+)`).exec(cuerpo);
  return encontrado === null ? null : encontrado[1].trim();
}

const OVERLAYS: readonly { capa: keyof typeof Z_OVERLAYS; selector: string }[] = [
  { capa: "onda", selector: ".home__fondo-onda" },
  { capa: "eq", selector: ".home__fondo-eq" },
  { capa: "halo", selector: ".home__fondo-halo" },
];

describe("FondoHome.svelte · markup de las cuatro capas", () => {
  it("renderiza la foto existente y las tres overlays, en ese orden en el DOM", () => {
    expect(fuente).toContain('<div class="home__fondo" aria-hidden="true">');
    expect(fuente).toContain('class="home__fondo-foto"');
    expect(fuente).toContain('src="/assets/home/fondo.jpeg"');
    expect(fuente).toContain('alt=""');

    const posFoto = fuente.indexOf('class="home__fondo-foto"');
    const capas = [...fuente.matchAll(/data-fondo-capa="(onda|eq|halo)"/g)];
    expect(capas.map((c) => c[1])).toEqual(["onda", "eq", "halo"]);
    for (const capa of capas) {
      expect(capa.index as number).toBeGreaterThan(posFoto);
    }
  });

  it("dibuja la onda con dos trazos SVG y el ecualizador con siete barras", () => {
    const trazos = [...fuente.matchAll(/class="home__fondo-onda-trazo/g)];
    expect(trazos).toHaveLength(2);

    const literal = /const BARRAS: readonly number\[\] = \[([^\]]*)\]/.exec(fuente);
    expect(literal).not.toBeNull();
    const barras = (literal as RegExpExecArray)[1]
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    expect(barras).toHaveLength(7);
    expect(fuente).toContain('class="home__fondo-barra"');
  });

  it("no introduce nodos enfocables ni assets nuevos", () => {
    expect(fuente).not.toMatch(/<(button|a|input|select|textarea)\b/);
    expect(fuente).not.toContain("tabindex");
    expect(fuente).toContain('focusable="false"');
    // El halo y las barras son gradientes puros: ni imágenes ni vídeos nuevos.
    expect(fuente).not.toContain("url(");
    expect(existsSync(rutaFoto)).toBe(true);
  });
});

describe("FondoHome.svelte · CSS de las capas", () => {
  it("mantiene el layout de `.home__fondo` sin mezcla ni atenuación en reposo", () => {
    const cuerpo = bloque(".home__fondo");
    expect(declaracion(cuerpo, "position")).toBe("absolute");
    expect(declaracion(cuerpo, "height")).toBe("100dvh");
    expect(declaracion(cuerpo, "overflow")).toBe("hidden");
    expect(declaracion(cuerpo, "pointer-events")).toBe("none");
    expect(declaracion(cuerpo, "isolation")).toBeNull();
    expect(declaracion(cuerpo, "filter")).toBeNull();
    expect(declaracion(cuerpo, "backdrop-filter")).toBeNull();
    expect(declaracion(cuerpo, "opacity")).toBeNull();
  });

  it("deja la foto visible con su `src` y su encuadre intactos", () => {
    const cuerpo = bloque(".home__fondo-foto");
    expect(declaracion(cuerpo, "object-fit")).toBe("cover");
    expect(declaracion(cuerpo, "display")).toBeNull();
    expect(declaracion(cuerpo, "visibility")).toBeNull();
    expect(declaracion(cuerpo, "opacity")).toBeNull();
  });

  it("apila cada overlay por debajo del grano, sin puntero y con mezcla admitida", () => {
    for (const { capa, selector } of OVERLAYS) {
      const cuerpo = bloque(selector);
      expect(declaracion(cuerpo, "position")).toBe("absolute");
      expect(declaracion(cuerpo, "pointer-events")).toBe("none");

      const z = Number(declaracion(cuerpo, "z-index"));
      expect(z).toBe(Z_OVERLAYS[capa]);
      expect(z).toBeGreaterThanOrEqual(1);
      expect(z).toBeLessThan(Z_GRAIN);

      const mezcla = declaracion(cuerpo, "mix-blend-mode");
      expect(mezcla).not.toBeNull();
      expect(["screen", "plus-lighter"]).toContain(mezcla);
      expect(MEZCLAS_PERMITIDAS as readonly string[]).toContain(mezcla as string);

      // Con `.home__copy` visible ninguna overlay pasa de 0.35 (Req 2.7).
      const opacidad = Number(declaracion(cuerpo, "opacity"));
      expect(opacidad).toBeGreaterThan(0);
      expect(opacidad).toBeLessThanOrEqual(0.35);
    }
  });

  it("baja las tres overlays a 0.18 sin soporte de mezcla", () => {
    const supports = /@supports not \(mix-blend-mode: plus-lighter\) \{([\s\S]*?)\n {2}\}/.exec(
      fuente,
    );
    expect(supports).not.toBeNull();
    const cuerpo = (supports as RegExpExecArray)[1];
    for (const { selector } of OVERLAYS) {
      expect(cuerpo).toContain(selector);
    }
    expect(/opacity:\s*0?\.18/.test(cuerpo)).toBe(true);
  });

  it("ancla las barras del ecualizador en su borde inferior", () => {
    expect(declaracion(bloque(".home__fondo-barra"), "transform-origin")).toBe("50% 100%");
  });
});
