import type { AlmaId, Paleta } from "../datos/tipos";
import textos from "./textos.json";

export type { AlmaId };

export type MediaDNA = {
  happy: number;
  sad: number;
  relaxed: number;
  aggressive: number;
  nostalgia: number;
  oscuridad: number;
  energy: number;
  danceability: number;
  tempo: number;
  spectralFlatness: number;
  approachability?: number;
};

export type ContextoSeleccion = {
  artistasUnicos: number;
  aniosUnicos: number;
  aniosDisponibles: number;
  sigmaFlatness: number;
};

export type AlmaDef = {
  id: AlmaId;
  nombre: string;
  corto: string;
  texto: string;
  paleta: Paleta;
  grano: { densidad: number; velocidad: number };
  puntuar: (m: MediaDNA, ctx: ContextoSeleccion) => number;
};

const T = textos as Record<AlmaId, { nombre: string; corto: string; texto: string }>;

function clip(n: number): number {
  return Math.max(0, Math.min(100, n));
}

export const ALMA_IDS: AlmaId[] = [
  "noctambula",
  "melancolica",
  "exploradora",
  "colectiva",
  "intensa",
  "nostalgica",
];

export const almas: Record<AlmaId, AlmaDef> = {
  noctambula: {
    id: "noctambula",
    ...T.noctambula,
    paleta: { c1: "#3a1658", c2: "#e0086a", c3: "#011544", granoDensidad: 0.5, granoVelocidad: 0.45 },
    grano: { densidad: 0.5, velocidad: 0.45 },
    puntuar: (m) => clip(0.34 * m.oscuridad + 0.33 * m.danceability + 0.33 * m.energy),
  },
  melancolica: {
    id: "melancolica",
    ...T.melancolica,
    paleta: { c1: "#ff8c18", c2: "#d01662", c3: "#7a1458", granoDensidad: 0.38, granoVelocidad: 0.28 },
    grano: { densidad: 0.38, velocidad: 0.28 },
    puntuar: (m) => clip(0.55 * m.nostalgia + 0.45 * (100 - Math.abs(m.happy - 50))),
  },
  exploradora: {
    id: "exploradora",
    ...T.exploradora,
    paleta: { c1: "#f07810", c2: "#142878", c3: "#3a1658", granoDensidad: 0.32, granoVelocidad: 0.4 },
    grano: { densidad: 0.32, velocidad: 0.4 },
    puntuar: (m, ctx) => {
      const diversidad = 100 * (
        0.45 * (ctx.artistasUnicos / 5) +
        0.25 * (ctx.aniosUnicos / Math.max(1, ctx.aniosDisponibles)) +
        0.3 * Math.min(1, ctx.sigmaFlatness / 25)
      );
      const base = 0.4 * (0.5 * m.spectralFlatness + 0.5 * (100 - Math.abs(m.energy - 50))) + 0.6 * diversidad;
      if (m.approachability == null) return clip(base);
      const extra = 0.2 * (100 - m.approachability);
      return clip(base * 0.8 + extra);
    },
  },
  colectiva: {
    id: "colectiva",
    ...T.colectiva,
    paleta: { c1: "#e83a28", c2: "#8a1458", c3: "#011544", granoDensidad: 0.3, granoVelocidad: 0.32 },
    grano: { densidad: 0.3, velocidad: 0.32 },
    puntuar: (m) => clip(0.55 * m.relaxed + 0.45 * (100 - Math.abs(m.energy - 40))),
  },
  intensa: {
    id: "intensa",
    ...T.intensa,
    paleta: { c1: "#e0086a", c2: "#ff8c18", c3: "#3a1658", granoDensidad: 0.28, granoVelocidad: 0.62 },
    grano: { densidad: 0.28, velocidad: 0.62 },
    puntuar: (m) => clip(0.5 * m.aggressive + 0.5 * m.energy),
  },
  nostalgica: {
    id: "nostalgica",
    ...T.nostalgica,
    paleta: { c1: "#d01662", c2: "#7a1458", c3: "#142878", granoDensidad: 0.42, granoVelocidad: 0.22 },
    grano: { densidad: 0.42, velocidad: 0.22 },
    puntuar: (m) => clip(0.62 * m.nostalgia + 0.38 * (100 - m.tempo)),
  },
};

export function paletaDeAlma(id: AlmaId): Paleta {
  const a = almas[id];
  return { ...a.paleta, granoDensidad: a.grano.densidad, granoVelocidad: a.grano.velocidad };
}
