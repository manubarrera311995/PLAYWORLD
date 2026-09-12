export type AudioDNA = {
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
  engagement?: number;
  scale: "Mayor" | "Menor";
  keyNote: string;
};

export type DnaKey = keyof Omit<AudioDNA, "scale" | "keyNote">;

export type Track = {
  id: string;
  year: number;
  artist: string;
  track: string;
  art: string | null;
  spotifyId?: string;
  genre?: string;
  dna: AudioDNA;
  dnaPct: Partial<Record<DnaKey, number>>;
  dnaCompleto: boolean;
};

export type Edicion = {
  year: number;
  hasDNA: boolean;
  conteo: number;
  tesis: string[];
  stats: { mediana: Partial<AudioDNA>; pctMenor: number; tempoMedio: number };
  collage: { trackId: string; porQue: string }[];
  caption: string;
};

export type AlmaId =
  | "noctambula"
  | "melancolica"
  | "exploradora"
  | "colectiva"
  | "intensa"
  | "nostalgica";

export type Seleccion = {
  trackIds: string[];
  tracks: Track[];
  yearHint: number | null;
  alias: string;
  cerradaEn: string;
};

export type Paleta = {
  c1: string;
  c2: string;
  c3: string;
  granoDensidad: number;
  granoVelocidad: number;
};
