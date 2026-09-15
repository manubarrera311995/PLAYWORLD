import { describe, expect, it } from "vitest";
import {
  LOCK,
  ONDA_VB,
  fmt,
  focoDe,
  ondaDe,
  panDe,
  pathBezier,
  puntosDeOnda,
  xDeFoco,
} from "../src/escenas/archivo/onda";

const YEARS = [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

describe("onda del archivo", () => {
  it("alinea el año al ancla: 2011 corre a la derecha, 2026 a la izquierda", () => {
    expect(focoDe(2011, YEARS)).toBe(0);
    expect(focoDe(2026, YEARS)).toBe(1);
    const a = panDe(focoDe(2011, YEARS));
    const b = panDe(focoDe(2012, YEARS));
    const c = panDe(focoDe(2026, YEARS));
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);
    expect(a + xDeFoco(0)).toBeCloseTo(LOCK.x);
    expect(c + xDeFoco(1)).toBeCloseTo(LOCK.x);
  });

  it("tres velos abiertos y silueta fija", () => {
    const o = ondaDe();
    expect(o.lejos.startsWith("M")).toBe(true);
    expect(o.medio.startsWith("M")).toBe(true);
    expect(o.cerca.startsWith("M")).toBe(true);
    expect(o.lejos.includes("Z")).toBe(false);
    expect(ondaDe()).toEqual(o);
  });

  it("las colas quedan fuera del cuadro en 2011 y 2026", () => {
    const pts = puntosDeOnda();
    const head = pts[0].x + panDe(0);
    const tail = pts[pts.length - 1].x + panDe(1);
    expect(head).toBeLessThan(-80);
    expect(tail).toBeGreaterThan(ONDA_VB.w + 80);
  });

  it("formatea y no dibuja una curva vacia", () => {
    expect(fmt(12.345)).toBe("12.35");
    expect(pathBezier([])).toBe("");
    expect(pathBezier([{ x: 1, y: 2 }])).toBe("M1.00 2.00");
  });
});
