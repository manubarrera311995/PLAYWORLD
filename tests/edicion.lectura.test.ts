import { describe, expect, it } from "vitest";
import type { Track } from "../src/datos/tipos";
import { corteDe, cubetasDe, filasArtistas, formaDe, tonalidadesDe } from "../src/escenas/edicion/lectura";

function track(id: string, energy: number, artist = "Acto", note = "A"): Track {
  return {
    id,
    year: 2015,
    artist,
    track: id,
    art: null,
    genre: "Rock",
    dna: {
      happy: 40,
      sad: 60,
      relaxed: 50,
      aggressive: 40,
      nostalgia: 70,
      oscuridad: 80,
      energy,
      danceability: 40,
      tempo: 120,
      spectralFlatness: 20,
      approachability: 55,
      engagement: 30,
      scale: "Menor",
      keyNote: note,
    },
    dnaPct: {},
    dnaCompleto: true,
  };
}

describe("lectura simple del año", () => {
  it("reparte las canciones en cinco tramos y deja el 100 en el último", () => {
    const cubetas = cubetasDe([0, 19, 20, 39, 40, 59, 60, 79, 80, 100]);
    expect(cubetas.map((cubeta) => cubeta.n)).toEqual([2, 2, 2, 2, 2]);
    expect(cubetas[0]).toMatchObject({ desde: 0, hasta: 19 });
    expect(cubetas[4]).toMatchObject({ desde: 80, hasta: 100 });
  });

  it("cuenta el 50 del lado de arriba", () => {
    expect(corteDe([49, 50, 100, 0])).toEqual({ bajo: 2, alto: 2 });
  });

  it("marca cerca del año con el borde de 10 puntos incluido", () => {
    const tracks = [
      ...Array.from({ length: 5 }, (_, i) => track(`A_${i}`, 50, "Ancla")),
      track("B_1", 60, "Borde"),
      track("B_2", 60, "Borde"),
      track("C_1", 61, "Lejos"),
      track("C_2", 61, "Lejos"),
      track("C_3", 61, "Lejos"),
    ];
    const borde = filasArtistas(tracks.filter((song) => !song.id.startsWith("C")), "energy");
    expect(borde.year).toBe(50);
    expect(borde.filas.find((fila) => fila.prefix === "B")).toMatchObject({ cerca: true, thin: true, center: 60 });

    const lejos = filasArtistas(
      tracks.filter((song) => !song.id.startsWith("B")),
      "energy",
    );
    expect(lejos.year).toBe(50);
    expect(lejos.filas.find((fila) => fila.prefix === "C")?.cerca).toBe(false);
    expect(lejos.reparto).toEqual({ n: 1, total: 2 });
  });

  it("nombra los extremos y ordena las tonalidades por cantidad", () => {
    const tracks = [
      ...Array.from({ length: 5 }, (_, i) => track(`A_${i}`, 40, "Ancla", "F")),
      track("B_1", 60, "Borde", "A"),
      track("B_2", 60, "Borde", "A"),
    ];
    const forma = formaDe(tracks, "energy");
    expect(forma?.highArtist).toBe("Borde");
    expect(forma?.lowArtist).toBe("Ancla");
    expect(forma?.corte).toEqual({ bajo: 5, alto: 2 });
    expect(tonalidadesDe(tracks)).toEqual([
      { note: "F", n: 5 },
      { note: "A", n: 2 },
    ]);
  });
});
