import { describe, expect, it } from "vitest";
import { COL_MIN, PAD, VIEW_H, columnasDe, geometria, yDe } from "../src/escenas/edicion/actos";

function acto(prefix: string, center: number, n = 3) {
  return {
    prefix,
    artist: prefix,
    center,
    songs: Array.from({ length: n }, (_, i) => ({ id: `${prefix}_${i}`, v: center })),
  };
}

describe("gráfica de actos", () => {
  it("encaja el cartel cuando hay espacio y hace scroll si las columnas se aprietan", () => {
    const amplio = geometria(24, 1300);
    expect(amplio.width).toBe(1300);
    expect(amplio.col).toBeCloseTo((1300 - PAD.left - PAD.right) / 24);
    expect(amplio.dense).toBe(false);

    const apretado = geometria(96, 360);
    expect(apretado.col).toBe(COL_MIN);
    expect(apretado.width).toBeGreaterThan(360);
    expect(apretado.dense).toBe(true);

    const lleno = geometria(96, 1800);
    expect(lleno.width).toBe(1800);
    expect(lleno.dense).toBe(true);
  });

  it("pone 100 arriba y 0 abajo", () => {
    expect(yDe(100)).toBe(PAD.top);
    expect(yDe(0)).toBe(VIEW_H - PAD.bottom);
    expect(yDe(50)).toBeCloseTo(PAD.top + (VIEW_H - PAD.top - PAD.bottom) / 2);
  });

  it("alinea cada acto en una columna y separa canciones con el mismo valor", () => {
    const { geo, cols } = columnasDe([acto("A", 80, 4), acto("B", 20, 2)], 800);
    expect(cols).toHaveLength(2);
    expect(cols[0]?.x).toBeCloseTo(PAD.left + geo.col / 2);
    expect(cols[1]?.x).toBeCloseTo(PAD.left + geo.col * 1.5);
    expect(cols[0]?.y).toBe(yDe(80));
    const xs = new Set(cols[0]?.songs.map((s) => s.x));
    expect(xs.size).toBeGreaterThan(1);
  });

  it("el jitter de una canción es estable", () => {
    const a = columnasDe([acto("CSS", 40, 2)], 900);
    const b = columnasDe([acto("CSS", 40, 2)], 900);
    expect(a.cols[0]?.songs[0]?.x).toBe(b.cols[0]?.songs[0]?.x);
  });
});
