import { describe, expect, it } from "vitest";
import { rankear } from "../src/almas/motor";
import type { Track } from "../src/datos/tipos";

function track(partial: Partial<Track> & { id: string; dnaPct: Track["dnaPct"] }): Track {
  return {
    year: 2013,
    artist: partial.artist ?? "x",
    track: partial.track ?? partial.id,
    art: null,
    dna: {
      happy: 50,
      sad: 50,
      relaxed: 50,
      aggressive: 50,
      nostalgia: 50,
      oscuridad: 50,
      energy: 50,
      danceability: 50,
      tempo: 50,
      spectralFlatness: 20,
      scale: "Menor",
      keyNote: "A",
    },
    dnaCompleto: true,
    ...partial,
  };
}

describe("motor de Almas", () => {
  it("cinco Carla Morrison → Nostálgica", () => {
    const tracks = Array.from({ length: 5 }, (_, i) =>
      track({
        id: `CMS_${i + 1}`,
        artist: "Carla Morrison",
        dnaPct: {
          nostalgia: 96,
          tempo: 8,
          happy: 18,
          energy: 10,
          oscuridad: 40,
          danceability: 40,
          relaxed: 90,
          aggressive: 8,
          spectralFlatness: 10,
        },
      }),
    );
    expect(rankear(tracks).principal).toBe("nostalgica");
  });

  it("cinco Crystal Castles alta energy → Intensa o Noctámbula", () => {
    const tracks = Array.from({ length: 5 }, (_, i) =>
      track({
        id: `CCS_${i + 1}`,
        artist: "Crystal Castles",
        dnaPct: {
          energy: 100,
          aggressive: 90,
          oscuridad: 88,
          danceability: 70,
          nostalgia: 40,
          tempo: 80,
          happy: 30,
          relaxed: 20,
          spectralFlatness: 50,
        },
      }),
    );
    expect(["intensa", "noctambula"]).toContain(rankear(tracks).principal);
  });
});
