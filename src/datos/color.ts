import type { AudioDNA, Paleta, Track } from "./tipos";

const DEFAULT: Paleta = {
  c1: "#f07810",
  c2: "#d01662",
  c3: "#011544",
  granoDensidad: 0.35,
  granoVelocidad: 0.4,
};

function clamp(n: number, a = 0, b = 100): number {
  return Math.max(a, Math.min(b, n));
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => {
    const va = (pa >> shift) & 255;
    const vb = (pb >> shift) & 255;
    return Math.round(va + (vb - va) * t);
  };
  const r = ch(16).toString(16).padStart(2, "0");
  const g = ch(8).toString(16).padStart(2, "0");
  const bl = ch(0).toString(16).padStart(2, "0");
  return `#${r}${g}${bl}`;
}

export function dnaAPaleta(dna: Partial<AudioDNA>): Paleta {
  const osc = clamp(dna.oscuridad ?? 50) / 100;
  const energy = clamp(dna.energy ?? 50) / 100;
  const nost = clamp(dna.nostalgia ?? 50) / 100;
  const frio = mixHex("#f07810", "#142878", osc);
  const vivo = mixHex("#e0086a", "#ff8c18", energy);
  const fondo = mixHex("#3a1658", "#011544", nost);
  return {
    c1: vivo,
    c2: frio,
    c3: fondo,
    granoDensidad: 0.22 + osc * 0.35,
    granoVelocidad: 0.18 + energy * 0.45,
  };
}

export function tracksAPaleta(tracks: Track[]): Paleta {
  if (!tracks.length) return { ...DEFAULT };
  const keys: (keyof AudioDNA)[] = [
    "oscuridad",
    "energy",
    "nostalgia",
    "happy",
    "danceability",
  ];
  const acc: Partial<AudioDNA> = {};
  for (const k of keys) {
    const nums = tracks.map((t) => Number(t.dna[k] ?? 0));
    (acc as Record<string, number>)[k] = nums.reduce((a, b) => a + b, 0) / nums.length;
  }
  return dnaAPaleta(acc);
}

export function artUrl(url: string | null, size: "64" | "300" | "640"): string | null {
  if (!url) return null;
  const map = { "64": "4851", "300": "1e02", "640": "b273" } as const;
  return url.replace(/ab67616d0000[0-9a-f]{4}/i, `ab67616d0000${map[size]}`);
}

export const paletaDefault: Paleta = DEFAULT;
