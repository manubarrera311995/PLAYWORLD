import { describe, expect, it } from "vitest";
import type { Track } from "../src/datos/tipos";
import { binsDe, escalaDe, etiquetaGenero, pasaFiltro, PLOT, puntoDe } from "../src/escenas/edicion/nube";

function track(partial: Partial<Track> & { id: string }): Track {
  return {
    year: 2022,
    artist: "Acto",
    track: partial.id,
    art: null,
    genre: "Latin",
    dna: {
      happy: 28,
      sad: 72,
      relaxed: 35,
      aggressive: 62,
      nostalgia: 75,
      oscuridad: 89,
      energy: 38,
      danceability: 37,
      tempo: 133,
      spectralFlatness: 30,
      approachability: 64,
      engagement: 36,
      scale: "Menor",
      keyNote: "A",
    },
    dnaPct: {},
    dnaCompleto: true,
    ...partial,
  };
}

describe("nube del año", () => {
  it("toma el primer género y nombra el vacío", () => {
    expect(etiquetaGenero(track({ id: "a", genre: "Latin, Pop" }))).toBe("Latin");
    expect(etiquetaGenero(track({ id: "b", genre: "  " }))).toBe("Sin género");
    expect(etiquetaGenero(track({ id: "c", genre: undefined }))).toBe("Sin género");
  });

  it("cruza búsqueda, género y artista", () => {
    const latin = track({ id: "a_1", artist: "Doja Cat", track: "Woman" });
    const rock = track({ id: "b_1", artist: "Turnstile", track: "Blackout", genre: "Rock" });
    const filtro = { q: "black", genres: ["Rock"], prefix: "b" };
    expect(pasaFiltro(rock, filtro, "b", "Rock")).toBe(true);
    expect(pasaFiltro(latin, filtro, "a", "Latin")).toBe(false);
    expect(pasaFiltro(rock, { q: "", genres: [], prefix: null }, "b", "Rock")).toBe(true);
  });

  it("deja el punto dentro del plano, también en los extremos", () => {
    for (const energy of [0, 38, 100]) {
      const punto = puntoDe(track({ id: `e${energy}`, dna: { ...track({ id: "z" }).dna, energy, oscuridad: energy } }), "energy", "oscuridad");
      expect(punto).not.toBeNull();
      expect(punto!.x).toBeGreaterThanOrEqual(PLOT.l);
      expect(punto!.x).toBeLessThanOrEqual(PLOT.w - PLOT.r);
      expect(punto!.y).toBeGreaterThanOrEqual(PLOT.t);
      expect(punto!.y).toBeLessThanOrEqual(PLOT.h - PLOT.b);
    }
  });

  it("reparte en diez tramos y deja el 100 en el último", () => {
    expect(binsDe([0, 9, 10, 99, 100])).toEqual([2, 1, 0, 0, 0, 0, 0, 0, 0, 2]);
  });

  it("separa menor y mayor por nota", () => {
    const notas = escalaDe([
      track({ id: "a", dna: { ...track({ id: "z" }).dna, keyNote: "A", scale: "Menor" } }),
      track({ id: "b", dna: { ...track({ id: "z" }).dna, keyNote: "A", scale: "Mayor" } }),
      track({ id: "c", dna: { ...track({ id: "z" }).dna, keyNote: "B", scale: "Menor" } }),
    ]);
    expect(notas.find((nota) => nota.note === "A")).toEqual({ note: "A", menor: 1, mayor: 1 });
    expect(notas.find((nota) => nota.note === "B")).toEqual({ note: "B", menor: 1, mayor: 0 });
    expect(notas.map((nota) => nota.note)).toContain("C");
  });
});
