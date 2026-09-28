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
const ctx = { pool, yearHint: 2013 };

describe("máquina iPod", () => {
  it("boot abre el listado del año", () => {
    const e = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    const v = visible(e);
    expect(v.kind).toBe("lista");
    if (v.kind === "lista") expect(v.titulo).toBe("2013");
  });

  it("capacidad 5 y cierre", () => {
    let e = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    for (const tr of pool.slice(0, 5)) e = meterOQuitar(e, tr);
    expect(e.seleccion).toHaveLength(5);
    e = aplicar(e, { tipo: "back" }, ctx);
    expect(visible(e).kind).toBe("menu");
    e = { ...e, cursor: 2 };
    e = aplicar(e, { tipo: "select" }, ctx);
    expect(e.cerrado).toBe(true);
  });

  it("no cierra con menos de 5", () => {
    let e = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    e = meterOQuitar(e, pool[0]);
    e = aplicar(e, { tipo: "back" }, ctx);
    e = { ...e, cursor: 2 };
    e = aplicar(e, { tipo: "select" }, ctx);
    expect(e.cerrado).toBe(false);
  });

  it("back no sale del menú", () => {
    let e = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "back" }, ctx);
    expect(visible(e).kind).toBe("menu");
    e = aplicar(e, { tipo: "back" }, ctx);
    expect(visible(e).kind).toBe("menu");
  });

  it("el listado no sale del año de llegada", () => {
    const otro = { ...t("z"), year: 1999 };
    const mix = { pool: [...pool, otro], yearHint: 2013 };
    let e = aplicar(estadoInicial(), { tipo: "select" }, mix);
    const lista = visible(e);
    expect(lista.kind).toBe("lista");
    if (lista.kind === "lista") {
      expect(lista.tracks.every((tr) => tr.year === 2013)).toBe(true);
      expect(lista.tracks.map((tr) => tr.id)).not.toContain("z");
    }
    e = aplicar(e, { tipo: "back" }, mix);
    e = { ...e, cursor: 0 };
    e = aplicar(e, { tipo: "select" }, mix);
    const otra = visible(e);
    expect(otra.kind).toBe("lista");
    if (otra.kind === "lista") expect(otra.tracks.every((tr) => tr.year === 2013)).toBe(true);
  });

  it("ordena el año por artista y canción", () => {
    const mix = {
      pool: [
        { ...t("b"), artist: "Zeta", track: "Bruma" },
        { ...t("a"), artist: "Alfa", track: "Aurora" },
        { ...t("c"), artist: "Alfa", track: "Abismo" },
      ],
      yearHint: 2013,
    };
    const e = aplicar(estadoInicial(), { tipo: "select" }, mix);
    const v = visible(e);
    expect(v.kind).toBe("lista");
    if (v.kind === "lista") expect(v.tracks.map((tr) => tr.id)).toEqual(["c", "a", "b"]);
  });

  it("sin año el listado queda vacío", () => {
    const e = aplicar(estadoInicial(), { tipo: "select" }, { pool, yearHint: null });
    const v = visible(e);
    expect(v.kind).toBe("lista");
    if (v.kind === "lista") expect(v.tracks).toHaveLength(0);
  });
});
