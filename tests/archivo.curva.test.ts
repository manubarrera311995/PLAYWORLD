import { describe, expect, it } from "vitest";
import {
  LUPA_RADIO,
  PAD,
  añosVentana,
  curvaDe,
  etiquetaCanciones,
  formatN,
  pathLinea,
  puntosDe,
  segmentos,
  techo,
  vistaLupa,
} from "../src/escenas/archivo/curva";

const YEARS = [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const CONTEOS: Record<number, number> = {
  2011: 202,
  2012: 220,
  2013: 262,
  2014: 475,
  2015: 608,
  2016: 576,
  2017: 584,
  2018: 606,
  2019: 655,
  2020: 0,
  2021: 0,
  2022: 782,
  2023: 1057,
  2024: 971,
  2025: 1113,
  2026: 817,
};

describe("curva del archivo", () => {
  it("parte la línea en el hueco sin DNA", () => {
    const segs = segmentos(YEARS.map((year) => ({ year, n: CONTEOS[year] ?? 0 })));
    expect(segs).toHaveLength(2);
    expect(segs[0]?.at(-1)?.year).toBe(2019);
    expect(segs[1]?.[0]?.year).toBe(2022);
  });

  it("toma el techo del año más cargado", () => {
    expect(techo(YEARS.map((year) => ({ year, n: CONTEOS[year] ?? 0 })))).toBe(1113);
  });

  it("en vertical el tiempo baja y el recuento abre a la derecha", () => {
    const muestras = YEARS.map((year) => ({ year, n: CONTEOS[year] ?? 0 }));
    const pts = puntosDe(muestras, 1113, "vertical");
    const a = pts.find((p) => p.year === 2011);
    const b = pts.find((p) => p.year === 2025);
    const c = pts.find((p) => p.year === 2026);
    expect(a && b && c).toBeTruthy();
    expect(b!.y).toBeGreaterThan(a!.y);
    expect(a!.y).toBeCloseTo((0.5 / YEARS.length) * 100);
    expect(c!.y).toBeCloseTo(((YEARS.length - 0.5) / YEARS.length) * 100);
    expect(b!.x).toBeGreaterThan(a!.x);
    expect(b!.x).toBeCloseTo(PAD.vertical.x1, 5);
    expect(c!.x).toBeGreaterThan(a!.x);
    expect(c!.x).toBeLessThan(b!.x);
  });

  it("en horizontal el tiempo corre a la derecha y el recuento sube", () => {
    const muestras = YEARS.map((year) => ({ year, n: CONTEOS[year] ?? 0 }));
    const pts = puntosDe(muestras, 1113, "horizontal");
    const a = pts.find((p) => p.year === 2011);
    const b = pts.find((p) => p.year === 2025);
    expect(a && b).toBeTruthy();
    expect(b!.x).toBeGreaterThan(a!.x);
    expect(b!.y).toBeLessThan(a!.y);
    expect(b!.y).toBeCloseTo(PAD.horizontal.y0, 5);
  });

  it("no interpola 2020 ni 2021 y no dibuja sus puntos", () => {
    const curva = curvaDe(YEARS, CONTEOS, "vertical");
    expect(curva.lineas).toHaveLength(2);
    expect(curva.areas).toHaveLength(2);
    expect(curva.puntos.some((p) => p.year === 2020 || p.year === 2021)).toBe(false);
    expect(curva.puntos).toHaveLength(YEARS.length - 2);
  });

  it("un solo punto no genera trazo", () => {
    const curva = curvaDe([2011, 2020, 2022], { 2011: 10, 2020: 0, 2022: 20 }, "vertical");
    expect(curva.lineas).toHaveLength(0);
    expect(curva.puntos).toHaveLength(2);
    expect(pathLinea(curva.puntos.slice(0, 1)).startsWith("M")).toBe(true);
  });

  it("nombra el recuento", () => {
    expect(etiquetaCanciones(0)).toBe("");
    expect(etiquetaCanciones(1)).toBe("1 canción");
    expect(etiquetaCanciones(782)).toBe(`${formatN(782)} canciones`);
  });

  it("la lupa enseña como mucho ±2 y no recentra en el borde", () => {
    expect(LUPA_RADIO).toBe(2);
    expect(añosVentana(YEARS, 2011)).toEqual([2011, 2012, 2013]);
    expect(añosVentana(YEARS, 2018)).toHaveLength(5);
    expect(añosVentana(YEARS, 2018)[0]).toBe(2016);
    expect(añosVentana(YEARS, 2018).at(-1)).toBe(2020);
    expect(añosVentana(YEARS, 2025)).toEqual([2023, 2024, 2025, 2026]);
    const a = vistaLupa(YEARS, 2011);
    const b = vistaLupa(YEARS, 2025);
    expect(a.h).toBeCloseTo((5 / YEARS.length) * 100);
    expect(b.h).toBeCloseTo(a.h);
    expect(a.y - a.y0).toBeCloseTo(a.h / 2);
    expect(b.y - b.y0).toBeCloseTo(b.h / 2);
    expect(a.y0).toBeLessThan(0);
    expect(b.pan).toBeLessThan(a.pan);
  });

  it("2011 queda bajo a la izquierda y 2025 abre a la derecha en la misma escala", () => {
    const curva = curvaDe(YEARS, CONTEOS, "vertical");
    const a = curva.puntos.find((p) => p.year === 2011);
    const b = curva.puntos.find((p) => p.year === 2025);
    expect(a && b).toBeTruthy();
    expect(a!.x).toBeLessThan(b!.x);
    expect(b!.x).toBeCloseTo(PAD.vertical.x1, 5);
    const v19 = vistaLupa(YEARS, 2019);
    const v22 = vistaLupa(YEARS, 2022);
    expect(v22.y - v19.y).toBeCloseTo(3 * v19.slot);
  });
});
