/**
 * Contrato del cascarón de `FondoHome.svelte`.
 *
 * La onda, el ecualizador y el halo ya no se pintan. El nodo `.home__fondo`
 * permanece: es la puerta de la cascada de ecos, del parallax y de la
 * disolución hacia el hook. La suite corre sin DOM y lee la fuente.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const rutaComponente = fileURLToPath(
  new URL("../src/escenas/home/FondoHome.svelte", import.meta.url),
);
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

describe("FondoHome.svelte · cascarón sin overlays", () => {
  it("conserva el nodo del fondo y no pinta onda, ecualizador ni halo", () => {
    expect(fuente).toContain('<div class="home__fondo" aria-hidden="true">');
    expect(fuente).not.toContain("data-fondo-capa");
    expect(fuente).not.toContain("home__fondo-onda");
    expect(fuente).not.toContain("home__fondo-eq");
    expect(fuente).not.toContain("home__fondo-halo");
    expect(fuente).not.toContain("home__fondo-barra");
    expect(fuente).not.toContain("home__fondo-foto");
    expect(fuente).not.toContain("<svg");
  });

  it("no introduce nodos enfocables ni assets", () => {
    expect(fuente).not.toMatch(/<(button|a|input|select|textarea)\b/);
    expect(fuente).not.toContain("tabindex");
    expect(fuente).not.toContain("url(");
    expect(fuente).not.toContain("fondo.jpeg");
  });

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
    expect(declaracion(cuerpo, "mix-blend-mode")).toBeNull();
  });
});
