import { describe, expect, it } from "vitest";
import type { AlmaId } from "../src/almas/almas";
import { lineaFila, manchaDe, type CancionMancha } from "../src/escenas/creacion/boleta";

function cancion(
  id: string,
  dna: Partial<CancionMancha["dna"]> = {},
): CancionMancha {
  return {
    id,
    dna: {
      energy: 50,
      danceability: 50,
      oscuridad: 50,
      nostalgia: 50,
      happy: 50,
      relaxed: 50,
      ...dna,
    },
  };
}

const CINCO = [
  cancion("a", { energy: 92, danceability: 88, oscuridad: 20, nostalgia: 15, happy: 80 }),
  cancion("b", { energy: 30, danceability: 22, oscuridad: 84, nostalgia: 90, happy: 18 }),
  cancion("c", { energy: 70, danceability: 40, oscuridad: 55, nostalgia: 48, happy: 44 }),
  cancion("d", { energy: 48, danceability: 76, oscuridad: 36, nostalgia: 62, happy: 58 }),
  cancion("e", { energy: 15, danceability: 18, oscuridad: 70, nostalgia: 40, happy: 22, relaxed: 80 }),
];

describe("mancha de la boleta", () => {
  it("repite la misma tira para las mismas canciones", () => {
    expect(manchaDe(CINCO).fondo).toBe(manchaDe(CINCO).fondo);
  });

  it("cambia si cambian las canciones", () => {
    const otra = CINCO.map((c, i) =>
      i === 0 ? cancion("a", { energy: 10, danceability: 12, oscuridad: 90, nostalgia: 88, happy: 8 }) : c,
    );
    expect(manchaDe(otra).fondo).not.toBe(manchaDe(CINCO).fondo);
  });

  it("cambia si el orden de las cinco es otro", () => {
    expect(manchaDe([...CINCO].reverse()).fondo).not.toBe(manchaDe(CINCO).fondo);
  });

  it("se mueve con el id aunque el adn sea el mismo", () => {
    const base = { energy: 60, danceability: 40, oscuridad: 50, nostalgia: 50, happy: 50 };
    const una = manchaDe([cancion("lava", base), cancion("rio", base)]);
    const otra = manchaDe([cancion("lava", base), cancion("sal", base)]);
    expect(una.fondo).not.toBe(otra.fondo);
  });

  it("guarda una franja por canción", () => {
    const mancha = manchaDe(CINCO);
    expect(mancha.franjas).toHaveLength(5);
    expect(mancha.fondo).toContain("linear-gradient");
  });
});

describe("línea de la fila", () => {
  it("calla cuando alguna respuesta de la fila es el alma de las canciones", () => {
    const fila: AlmaId[] = ["colectiva", "exploradora", "noctambula"];
    expect(lineaFila(fila, "exploradora")).toBeNull();
    expect(lineaFila(null, "exploradora")).toBeNull();
  });

  it("nombra lo dicho en la fila cuando no aparece en las canciones", () => {
    const fila: AlmaId[] = ["colectiva", "intensa", "nostalgica"];
    expect(lineaFila(fila, "exploradora")).toBe(
      "En la fila dijiste Colectiva, Intensa y Nostálgica. Tus canciones dicen Exploradora.",
    );
  });

  it("deja una sola alma cuando la fila repite", () => {
    expect(lineaFila(["colectiva", "colectiva", "colectiva"], "exploradora")).toBe(
      "En la fila dijiste Colectiva. Tus canciones dicen Exploradora.",
    );
  });
});
