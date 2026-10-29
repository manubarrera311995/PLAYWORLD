import { describe, expect, it } from "vitest";
import { NOMBRES } from "../src/ipod/alias";
import {
  MENU,
  aplicar,
  artistasVisibles,
  atrasDe,
  estadoInicial,
  estadoSellado,
  meterOQuitar,
  tracksVisibles,
  visible,
} from "../src/ipod/maquina";
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
    e = { ...e, cursor: MENU.indexOf("close") };
    e = aplicar(e, { tipo: "select" }, ctx);
    expect(e.cerrado).toBe(true);
  });

  it("no cierra con menos de 5", () => {
    let e = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    e = meterOQuitar(e, pool[0]);
    e = aplicar(e, { tipo: "back" }, ctx);
    e = { ...e, cursor: MENU.indexOf("close") };
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

  it("un iPod sellado muestra el nombre y las canciones y no deja cambiarlas", () => {
    const tracks = pool.slice(0, 5);
    let e = estadoSellado("Vera", tracks);
    expect(e.sellado).toBe(true);
    expect(e.alias).toBe("Vera");
    expect(e.seleccion.map((tr) => tr.id)).toEqual(["a", "b", "c", "d", "e"]);
    expect(visible(e).kind).toBe("miIpod");

    e = aplicar(e, { tipo: "back" }, ctx);
    expect(visible(e).kind).toBe("menu");
    expect(e.cursor).toBe(MENU.indexOf("mine"));
    e = { ...e, cursor: 0 };
    const quieto = aplicar(e, { tipo: "select" }, ctx);
    expect(visible(quieto).kind).toBe("menu");
    expect(quieto.seleccion).toHaveLength(5);

    const ficha = aplicar(estadoSellado("Vera", tracks), { tipo: "select" }, ctx);
    expect(visible(ficha).kind).toBe("cancion");
    const metida = aplicar(ficha, { tipo: "select" }, ctx);
    expect(metida.seleccion).toHaveLength(5);
    expect(visible(metida).kind).toBe("cancion");
    const pantalla = visible(metida);
    if (pantalla.kind !== "cancion") return;
    expect(meterOQuitar(metida, pantalla.track).seleccion).toHaveLength(5);

    e = { ...e, cursor: MENU.indexOf("artists") };
    const artistas = aplicar(e, { tipo: "select" }, ctx);
    expect(visible(artistas).kind).toBe("menu");

    const cierre = aplicar({ ...e, cursor: MENU.indexOf("close") }, { tipo: "select" }, ctx);
    expect(cierre.cerrado).toBe(true);
    expect(cierre.seleccion.map((tr) => tr.id)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("atrás nombra la pantalla anterior", () => {
    let e = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    expect(atrasDe(e)).toBeNull();
    e = aplicar(e, { tipo: "select" }, ctx);
    expect(atrasDe(e)).toBe("iPod");
    e = aplicar(e, { tipo: "select" }, ctx);
    expect(atrasDe(e)).toBe("2013");
  });

  it("artistas agrupa el año y abre solo sus canciones", () => {
    const mix = {
      pool: [
        { ...t("b"), artist: "Zeta", track: "Bruma" },
        { ...t("a"), artist: "Café Tacvba", track: "Aurora" },
        { ...t("c"), artist: "Café Tacvba", track: "Abismo" },
        { ...t("z"), artist: "Zeta", track: "Otra", year: 1999 },
      ],
      yearHint: 2013,
    };
    let e = aplicar(estadoInicial(), { tipo: "select" }, mix);
    e = aplicar(e, { tipo: "paso", delta: 1 }, mix);
    e = aplicar(e, { tipo: "select" }, mix);
    const artistas = visible(e);
    expect(artistas.kind).toBe("artistas");
    if (artistas.kind === "artistas") {
      expect(artistasVisibles(artistas)).toEqual(["Café Tacvba", "Zeta"]);
    }
    e = aplicar(e, { tipo: "filtrar", q: "zeta" }, mix);
    const filtrados = visible(e);
    if (filtrados.kind === "artistas") expect(artistasVisibles(filtrados)).toEqual(["Zeta"]);
    e = aplicar(e, { tipo: "select" }, mix);
    const lista = visible(e);
    expect(lista.kind).toBe("lista");
    if (lista.kind === "lista") {
      expect(lista.titulo).toBe("Zeta");
      expect(lista.tracks.map((tr) => tr.id)).toEqual(["b"]);
      expect(lista.q).toBe("");
    }
    expect(atrasDe(e)).toBe("Artistas");
  });

  it("filtra canciones por título o artista, sin tildes", () => {
    const mix = {
      pool: [
        { ...t("b"), artist: "Zeta", track: "Bruma" },
        { ...t("a"), artist: "Café Tacvba", track: "Aurora" },
        { ...t("c"), artist: "Café Tacvba", track: "Abismo" },
      ],
      yearHint: 2013,
    };
    let e = aplicar(aplicar(estadoInicial(), { tipo: "select" }, mix), { tipo: "select" }, mix);
    e = aplicar(e, { tipo: "saltar", a: 1 }, mix);
    e = aplicar(e, { tipo: "filtrar", q: "cafe" }, mix);
    const cafe = visible(e);
    expect(cafe.kind).toBe("lista");
    if (cafe.kind === "lista") {
      expect(cafe.q).toBe("cafe");
      expect(tracksVisibles(cafe).map((tr) => tr.id)).toEqual(["c", "a"]);
    }
    expect(e.cursor).toBe(1);
    expect(e.resaltada?.id).toBe("a");

    e = aplicar(e, { tipo: "filtrar", q: "bru" }, mix);
    const bru = visible(e);
    if (bru.kind === "lista") expect(tracksVisibles(bru).map((tr) => tr.id)).toEqual(["b"]);
    expect(e.cursor).toBe(0);

    e = aplicar(e, { tipo: "filtrar", q: "   " }, mix);
    const todo = visible(e);
    if (todo.kind === "lista") expect(tracksVisibles(todo)).toHaveLength(3);

    e = aplicar(e, { tipo: "filtrar", q: "zzz" }, mix);
    const nada = visible(e);
    if (nada.kind === "lista") expect(tracksVisibles(nada)).toHaveLength(0);
    expect(e.cursor).toBe(0);
  });

  it("el filtro sigue al volver de la canción", () => {
    let e = aplicar(aplicar(estadoInicial(), { tipo: "select" }, ctx), { tipo: "select" }, ctx);
    e = aplicar(e, { tipo: "filtrar", q: "c" }, ctx);
    e = aplicar(e, { tipo: "select" }, ctx);
    expect(visible(e).kind).toBe("cancion");
    if (visible(e).kind === "cancion") expect(visible(e).track.id).toBe("c");
    e = aplicar(e, { tipo: "back" }, ctx);
    const vuelta = visible(e);
    expect(vuelta.kind).toBe("lista");
    if (vuelta.kind === "lista") {
      expect(vuelta.q).toBe("c");
      expect(tracksVisibles(vuelta).map((tr) => tr.id)).toEqual(["c"]);
    }
  });

  it("filtrar fuera de una lista no hace nada", () => {
    const menu = aplicar(estadoInicial(), { tipo: "select" }, ctx);
    const e = aplicar(menu, { tipo: "filtrar", q: "a" }, ctx);
    expect(visible(e).kind).toBe("menu");
    expect(e.cursor).toBe(0);
  });
});
