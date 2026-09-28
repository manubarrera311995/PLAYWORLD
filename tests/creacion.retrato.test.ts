import { describe, expect, it } from "vitest";
import type { AlmaId } from "../src/almas/almas";
import { ALMA_IDS } from "../src/almas/almas";
import type { AudioDNA, Track } from "../src/datos/tipos";
import { fraseDeSeleccion, giroDe, rotulosDe } from "../src/escenas/creacion/frase";
import { anclasSello, SELLO, verticesSello } from "../src/escenas/creacion/sello";

function track(
  id: string,
  partial: Partial<AudioDNA> & { track?: string; artist?: string },
): Track {
  return {
    id,
    year: 2013,
    artist: partial.artist ?? "Artista",
    track: partial.track ?? id,
    art: null,
    dna: {
      happy: 40,
      sad: 60,
      relaxed: 50,
      aggressive: 40,
      nostalgia: 50,
      oscuridad: 50,
      energy: 50,
      danceability: 40,
      tempo: 120,
      spectralFlatness: 20,
      scale: "Mayor",
      keyNote: "C",
      ...partial,
    },
    dnaPct: {},
    dnaCompleto: true,
  };
}

describe("frase de la selección", () => {
  it("une la tonalidad clara con la distancia al año", () => {
    const tracks = [
      track("a", { scale: "Menor", oscuridad: 96, nostalgia: 72, energy: 42, track: "Lava" }),
      track("b", { scale: "Menor", oscuridad: 94, nostalgia: 71, energy: 40 }),
      track("c", { scale: "Menor", oscuridad: 92, nostalgia: 70, energy: 41 }),
      track("d", { scale: "Menor", oscuridad: 90, nostalgia: 73, energy: 39 }),
      track("e", { scale: "Mayor", oscuridad: 88, nostalgia: 69, energy: 43 }),
    ];
    const texto = fraseDeSeleccion(tracks, 2013, { oscuridad: 80, nostalgia: 70, energy: 40 });
    expect(texto).toBe("Cuatro de cinco en menor, y más oscura que 2013.");
  });

  it("elige la distancia más grande cuando hay varias", () => {
    const tracks = [
      track("a", { scale: "Mayor", energy: 10, nostalgia: 50 }),
      track("b", { scale: "Mayor", energy: 12, nostalgia: 52 }),
      track("c", { scale: "Menor", energy: 14, nostalgia: 48 }),
    ];
    const texto = fraseDeSeleccion(tracks, 2013, { energy: 40, nostalgia: 50, oscuridad: 50 });
    expect(texto).toBe("Más quieta que 2013.");
  });

  it("no afirma una mayoría débil ni una diferencia chica", () => {
    const tracks = [
      track("a", { scale: "Menor", oscuridad: 52, nostalgia: 50, energy: 50, tempo: 120 }),
      track("b", { scale: "Menor", oscuridad: 50, nostalgia: 51, energy: 49, tempo: 118 }),
      track("c", { scale: "Menor", oscuridad: 48, nostalgia: 49, energy: 51, tempo: 122 }),
      track("d", { scale: "Mayor", oscuridad: 51, nostalgia: 50, energy: 50, tempo: 119 }),
      track("e", { scale: "Mayor", oscuridad: 49, nostalgia: 50, energy: 50, tempo: 121 }),
    ];
    expect(fraseDeSeleccion(tracks, 2013, { oscuridad: 50, nostalgia: 50, energy: 50 })).toBeNull();
  });

  it("nombra el extremo solo cuando no hay otra frase", () => {
    const tracks = [
      track("a", { scale: "Menor", oscuridad: 96, track: "Lava", artist: "Alerta" }),
      track("b", { scale: "Mayor", oscuridad: 40 }),
      track("c", { scale: "Mayor", oscuridad: 42 }),
      track("d", { scale: "Menor", oscuridad: 44 }),
      track("e", { scale: "Mayor", oscuridad: 46 }),
    ];
    expect(fraseDeSeleccion(tracks, null, null)).toBe(
      "La más oscura de las tuyas es Lava, de Alerta.",
    );
  });
});

describe("rótulos de la mesa", () => {
  it("marca el extremo único y calla el empate", () => {
    const tracks = [
      track("oscura", { oscuridad: 96, energy: 80 }),
      track("par", { oscuridad: 40, energy: 80 }),
      track("otra", { oscuridad: 42, energy: 20 }),
    ];
    const rotulos = rotulosDe(tracks);
    expect(rotulos.oscura).toBe("la más oscura");
    expect(rotulos.par).toBeUndefined();
    expect(rotulos.otra).toBe("la más quieta");
  });

  it("el giro cabe en unos pocos grados", () => {
    expect(giroDe("ALK_3")).toBeGreaterThanOrEqual(-5);
    expect(giroDe("ALK_3")).toBeLessThanOrEqual(5);
  });
});

describe("sello", () => {
  it("aleja del centro el puntaje más alto", () => {
    const puntajes = Object.fromEntries(ALMA_IDS.map((id) => [id, 20])) as Record<AlmaId, number>;
    puntajes.noctambula = 90;
    puntajes.intensa = 50;
    const vs = verticesSello(puntajes);
    const dist = (id: AlmaId) => {
      const v = vs.find((x) => x.id === id)!;
      return Math.hypot(v.x - SELLO.cx, v.y - SELLO.cy);
    };
    expect(vs).toHaveLength(6);
    expect(dist("noctambula")).toBeGreaterThan(dist("intensa"));
    expect(dist("intensa")).toBeGreaterThan(dist("melancolica"));
  });

  it("dibuja un hexágono parejo cuando los puntajes empatan", () => {
    const puntajes = Object.fromEntries(ALMA_IDS.map((id) => [id, 60])) as Record<AlmaId, number>;
    const vs = verticesSello(puntajes);
    const distancias = vs.map((v) => Math.hypot(v.x - SELLO.cx, v.y - SELLO.cy));
    const primera = distancias[0]!;
    for (const d of distancias) expect(d).toBeCloseTo(primera, 5);
  });

  it("pone una ancla por alma, fuera del cuerpo", () => {
    const anclas = anclasSello();
    expect(anclas.map((a) => a.id)).toEqual(ALMA_IDS);
    for (const a of anclas) {
      const lejos = Math.hypot(a.x - SELLO.cx, a.y - SELLO.cy);
      expect(lejos).toBeGreaterThan(SELLO.radio);
    }
  });
});
