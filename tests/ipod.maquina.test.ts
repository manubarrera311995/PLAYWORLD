import { describe, expect, it } from "vitest";
import { aplicar, estadoInicial, meterOQuitar, visible } from "../src/ipod/maquina";
import type { Track } from "../src/datos/tipos";

function t(id: string): Track {
  return {
    id,
    year: 2013,
    artist: "A",
    track: id,
    art: null,
    dna: {
      happy: 50, sad: 50, relaxed: 50, aggressive: 50, nostalgia: 50,
      oscuridad: 50, energy: 50, danceability: 50, tempo: 120,
      spectralFlatness: 20, scale: "Menor", keyNote: "A",
    },
    dnaPct: {},
    dnaCompleto: true,
  };
}

const pool = [t("a"), t("b"), t("c"), t("d"), t("e"), t("f")];
const ctx = { pool, anios: [2013], yearHint: 2013 };

describe("máquina iPod", () => {
  it("boot → menú con select", () => {
    const e = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    expect(visible(e).kind).toBe("menu");
  });

  it("capacidad 5 y cierre", () => {
    let e = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    for (const tr of pool.slice(0, 5)) e = meterOQuitar(e, tr);
    expect(e.seleccion).toHaveLength(5);
    e = { ...e, cursor: 4 };
    e = aplicar(e, { tipo: "select" }, ctx);
    expect(e.cerrado).toBe(true);
  });

  it("no cierra con menos de 5", () => {
    let e = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    e = meterOQuitar(e, pool[0]);
    e = { ...e, cursor: 4 };
    e = aplicar(e, { tipo: "select" }, ctx);
    expect(e.cerrado).toBe(false);
  });

  it("back no sale del menú", () => {
    let e = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "back" }, ctx);
    expect(visible(e).kind).toBe("menu");
  });
});
