import { describe, expect, it } from "vitest";
import type { Track } from "../src/datos/tipos";
import {
  actPrefix,
  caracterDe,
  clusterOf,
  groupActs,
  median,
  moodStats,
  quantile,
} from "../src/escenas/edicion/ficha";

function track(id: string, energy: number, artist = "Acto"): Track {
  return {
    id,
    year: 2011,
    artist,
    track: id,
    art: null,
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
});
