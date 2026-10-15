const CROMATICA = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

const BEMOLES: Record<string, (typeof CROMATICA)[number]> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

export type ModoNota = "menor" | "mayor";

/** La4 = 440 Hz. El resto de la octava sale de ahí. */
export function hzDe(note: string, octava = 4): number | null {
  const limpia = note.trim().replace("♯", "#").replace("♭", "b");
  const nombre = BEMOLES[limpia] ?? limpia;
  const semi = CROMATICA.indexOf(nombre as (typeof CROMATICA)[number]);
  if (semi < 0) return null;
  const midi = (octava + 1) * 12 + semi;
  return 440 * 2 ** ((midi - 69) / 12);
}

type Voz = { osc: OscillatorNode; gain: GainNode };

let ctx: AudioContext | null = null;
let voces: Voz[] = [];
let generacion = 0;

function contexto(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof AudioContext === "undefined") return null;
  try {
    ctx = new AudioContext();
    return ctx;
  } catch {
    return null;
  }
}

export function prepararNota(): void {
  const audio = contexto();
  if (audio?.state === "suspended") void audio.resume().catch(() => undefined);
}

function callar(ahora: number): void {
  for (const voz of voces) {
    voz.gain.gain.cancelScheduledValues(ahora);
    voz.gain.gain.setValueAtTime(voz.gain.gain.value, ahora);
    voz.gain.gain.linearRampToValueAtTime(0, ahora + 0.03);
    try {
      voz.osc.stop(ahora + 0.04);
    } catch {
      /* ya estaba parada */
    }
  }
  voces = [];
}

function voz(audio: AudioContext, freq: number, pico: number, ahora: number): void {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, ahora);
  gain.gain.setValueAtTime(0, ahora);
  gain.gain.linearRampToValueAtTime(pico, ahora + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0008, ahora + 0.42);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(ahora);
  osc.stop(ahora + 0.44);
  voces.push({ osc, gain });
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
    voces = voces.filter((item) => item.osc !== osc);
  };
}

/** La letra suena en la octava central. Menor y mayor se distinguen por la tercera. */
export function tocarNota(note: string, modo: ModoNota): void {
  const raiz = hzDe(note);
  if (raiz == null) return;
  const audio = contexto();
  if (!audio) return;
  const turno = ++generacion;
  const lanzar = () => {
    if (turno !== generacion || audio.state !== "running") return;
    const ahora = audio.currentTime;
    callar(ahora);
    const tercera = modo === "mayor" ? 4 : 3;
    voz(audio, raiz, 0.07, ahora);
    voz(audio, raiz * 2 ** (tercera / 12), 0.035, ahora);
  };
  if (audio.state === "suspended") {
    void audio.resume().then(lanzar).catch(() => undefined);
    return;
  }
  lanzar();
}
