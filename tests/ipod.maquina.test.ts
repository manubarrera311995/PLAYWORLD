import { describe, expect, it } from "vitest";
import { NOMBRES } from "../src/ipod/alias";
import { aplicar, atrasDe, estadoInicial, meterOQuitar, visible } from "../src/ipod/maquina";
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
  it("el boot guarda el nombre y, si queda vacío, asigna uno", () => {
    const escrito = aplicar(estadoInicial(), { tipo: "select", alias: "  Vera  " }, ctx);
    expect(visible(escrito).kind).toBe("menu");
    expect(escrito.alias).toBe("Vera");

    const largo = aplicar(estadoInicial(), { tipo: "select", alias: "abcdefghijklmno" }, ctx);
    expect(largo.alias).toBe("abcdefghijkl");

    const vacio = aplicar(estadoInicial(), { tipo: "select", alias: "   " }, ctx);
    expect(NOMBRES).toContain(vacio.alias);
  });

  it("boot abre el menú y de ahí el listado del año", () => {
    const menu = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    expect(visible(menu).kind).toBe("menu");
    const e = aplicar(menu, { tipo: "select" }, ctx);
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
    e = aplicar(e, { tipo: "select" }, mix);
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
    const e = aplicar(aplicar(estadoInicial(), { tipo: "select" }, mix), { tipo: "select" }, mix);
    const v = visible(e);
    expect(v.kind).toBe("lista");
    if (v.kind === "lista") expect(v.tracks.map((tr) => tr.id)).toEqual(["c", "a", "b"]);
  });

  it("sin año el listado queda vacío", () => {
    const e = aplicar(
      aplicar(estadoInicial(), { tipo: "select" }, { pool, yearHint: null }),
      { tipo: "select" },
      { pool, yearHint: null },
    );
    const v = visible(e);
    expect(v.kind).toBe("lista");
    if (v.kind === "lista") expect(v.tracks).toHaveLength(0);
  });

  it("meter vuelve a la lista en la misma canción", () => {
    let e = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "saltar", a: 2 }, ctx);
    e = aplicar(e, { tipo: "select" }, ctx);
    expect(visible(e).kind).toBe("cancion");
    e = aplicar(e, { tipo: "select" }, ctx);
    expect(visible(e).kind).toBe("lista");
    expect(e.cursor).toBe(2);
    expect(e.seleccion.map((tr) => tr.id)).toEqual(["c"]);
  });

  it("quitar se queda en la canción y el centro no la saca", () => {
    let e = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "select" }, ctx);
    expect(visible(e).kind).toBe("cancion");
    expect(e.seleccion).toHaveLength(1);
    e = aplicar(e, { tipo: "select" }, ctx);
    expect(visible(e).kind).toBe("cancion");
    expect(e.seleccion).toHaveLength(1);
    const pantalla = visible(e);
    if (pantalla.kind !== "cancion") return;
    e = meterOQuitar(e, pantalla.track);
    expect(visible(e).kind).toBe("cancion");
    expect(e.seleccion).toHaveLength(0);
  });

  it("volver conserva el lugar", () => {
    let e = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "paso", delta: 1 }, ctx);
    e = aplicar(e, { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "back" }, ctx);
    expect(visible(e).kind).toBe("menu");
    expect(e.cursor).toBe(1);

    e = aplicar(e, { tipo: "paso", delta: -1 }, ctx);
    e = aplicar(e, { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "saltar", a: 4 }, ctx);
    e = aplicar(e, { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "back" }, ctx);
    expect(visible(e).kind).toBe("lista");
    expect(e.cursor).toBe(4);
    e = aplicar(e, { tipo: "back" }, ctx);
    expect(visible(e).kind).toBe("menu");
    expect(e.cursor).toBe(0);
  });

  it("el play en la ficha no mete la canción", () => {
    let e = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "select" }, ctx);
    expect(visible(e).kind).toBe("cancion");
    e = aplicar(e, { tipo: "play" }, ctx);
    expect(visible(e).kind).toBe("cancion");
    expect(e.seleccion).toHaveLength(0);
  });

  it("el play en la lista abre la canción sin meterla", () => {
    let e = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "play" }, ctx);
    expect(visible(e).kind).toBe("cancion");
    expect(e.seleccion).toHaveLength(0);
  });

  it("atrás nombra la pantalla anterior", () => {
    let e = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    expect(atrasDe(e)).toBeNull();
    e = aplicar(e, { tipo: "select" }, ctx);
    expect(atrasDe(e)).toBe("iPod");
    e = aplicar(e, { tipo: "select" }, ctx);
    expect(atrasDe(e)).toBe("2013");
  });
});
