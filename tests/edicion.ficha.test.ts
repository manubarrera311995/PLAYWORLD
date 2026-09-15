import { describe, expect, it } from "vitest";
import type { Track } from "../src/datos/tipos";
import {
  actPrefix,
  amplitudDe,
  caracterDe,
  clusterOf,
  generosDe,
  groupActs,
  median,
  moodStats,
  quantile,
} from "../src/escenas/edicion/ficha";

function track(id: string, energy: number, artist = "Acto", genre?: string): Track {
  return {
    id,
    year: 2011,
    artist,
    track: id,
    art: null,
    genre,
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
      scale: "Menor",
      keyNote: "A",
    },
    dnaPct: {},
    dnaCompleto: true,
  };
}

describe("ficha de edición", () => {
  it("mediana impar y par", () => {
    expect(median([1, 3, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("cuantil interpola", () => {
    expect(quantile([0, 100], 0.25)).toBe(25);
  });

  it("agrupa actos por prefijo del id", () => {
    const acts = groupActs([track("CSS_1", 20, "Crystal Castles"), track("CSS_2", 80, "Crystal Castles"), track("SXL_1", 10, "Súper Extra")]);
    expect(actPrefix("CSS_8.json")).toBe("CSS");
    expect(acts).toHaveLength(2);
    expect(acts.find((a) => a.prefix === "CSS")?.songs).toHaveLength(2);
  });

  it("nombra la amplitud según qué tanto se abren las canciones", () => {
    expect(amplitudDe(4)).toBe("pareja");
    expect(amplitudDe(18)).toBe("media");
    expect(amplitudDe(37)).toBe("abierta");
    expect(amplitudDe(null)).toBe("pareja");
  });

  it("parte el año en dos cuerpos cuando energy y relaxed se abren", () => {
    const suave = Array.from({ length: 8 }, (_, i) => {
      const t = track(`A_${i}`, 20);
      t.dna.relaxed = 80;
      return t;
    });
    const duro = Array.from({ length: 8 }, (_, i) => {
      const t = track(`B_${i}`, 90);
      t.dna.relaxed = 10;
      return t;
    });
    const c = caracterDe([...suave, ...duro]);
    expect(c.kind).toBe("partida");
    expect(c.split).toBe(true);
    expect(clusterOf(suave[0]!)).toBe("suave");
    expect(clusterOf(duro[0]!)).toBe("intenso");
  });

  it("fingerprint reporta IQR de happy", () => {
    const songs = [20, 22, 21, 80].map((h, i) => {
      const t = track(`X_${i}`, 40);
      t.dna.happy = h;
      return t;
    });
    const stats = moodStats(songs, "happy");
    expect(stats?.n).toBe(4);
    expect(stats?.iqr).toBeGreaterThan(0);
  });

  it("nombra una pluralidad cuando el líder se separa y hay cobertura", () => {
    const songs = [
      ...Array.from({ length: 39 }, (_, i) => track(`L_${i}`, 40, "A", "Latin")),
      ...Array.from({ length: 21 }, (_, i) => track(`E_${i}`, 40, "B", "Electrónica")),
      ...Array.from({ length: 10 }, (_, i) => track(`R_${i}`, 40, "C", "Rock")),
      ...Array.from({ length: 30 }, (_, i) => track(`X_${i}`, 40, "D")),
    ];
    const mix = generosDe(songs);
    expect(mix.kind).toBe("pluralidad");
    expect(mix.top).toBe("Latin");
    expect(mix.topPct).toBe(56);
    expect(mix.second).toBe("Electrónica");
    expect(mix.bars[0]?.label).toBe("Latin");
    expect(mix.unlabeledPct).toBe(30);
  });

  it("dice cartel mezclado si el 1º y el 2º están a menos de 8 puntos", () => {
    const songs = [
      ...Array.from({ length: 20 }, (_, i) => track(`E_${i}`, 40, "A", "Electrónica")),
      ...Array.from({ length: 19 }, (_, i) => track(`P_${i}`, 40, "B", "Pop")),
      ...Array.from({ length: 18 }, (_, i) => track(`L_${i}`, 40, "C", "Latin")),
      ...Array.from({ length: 10 }, (_, i) => track(`X_${i}`, 40, "D")),
    ];
    const mix = generosDe(songs);
    expect(mix.kind).toBe("mezcla");
    expect(mix.top).toBe("Electrónica");
    expect(mix.topPct - mix.secondPct).toBeLessThan(8);
  });

  it("no corona un género si más del 60% no tiene etiqueta", () => {
    const songs = [
      ...Array.from({ length: 20 }, (_, i) => track(`E_${i}`, 40, "A", "Electrónica")),
      ...Array.from({ length: 80 }, (_, i) => track(`X_${i}`, 40, "B")),
    ];
    const mix = generosDe(songs);
    expect(mix.kind).toBe("incompleto");
    expect(mix.unlabeledPct).toBe(80);
    expect(mix.bars[0]?.label).toBe("Electrónica");
  });

  it("agrupa a partir del cuarto género en resto", () => {
    const songs = [
      ...Array.from({ length: 10 }, (_, i) => track(`A_${i}`, 40, "A", "Latin")),
      ...Array.from({ length: 8 }, (_, i) => track(`B_${i}`, 40, "B", "Rock")),
      ...Array.from({ length: 6 }, (_, i) => track(`C_${i}`, 40, "C", "Pop")),
      ...Array.from({ length: 4 }, (_, i) => track(`D_${i}`, 40, "D", "Jazz")),
      ...Array.from({ length: 3 }, (_, i) => track(`E_${i}`, 40, "E", "Metal")),
    ];
    const mix = generosDe(songs);
    expect(mix.bars).toHaveLength(4);
    expect(mix.bars[3]?.rest).toBe(true);
    expect(mix.bars[3]?.n).toBe(7);
  });
});
