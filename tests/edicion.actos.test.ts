import { describe, expect, it } from "vitest";
import {
  DENSE_FROM,
  PAD,
  ROW_H,
  ROW_H_DENSE,
  SHARE_EPS,
  filasDe,
  geometria,
  repartoDe,
  xDe,
  yDe,
} from "../src/escenas/edicion/actos";

function acto(prefix: string, center: number, n = 3) {
  return {
    prefix,
    artist: prefix,
    center,
    songs: Array.from({ length: n }, (_, i) => ({ id: `${prefix}_${i}`, v: center })),
  };
}

describe("gráfica de actos", () => {
  it("el lienzo crece hacia abajo y nunca pide scroll horizontal", () => {
    const amplio = geometria(24, 1300);
    expect(amplio.width).toBe(1300);
    expect(amplio.rowH).toBe(ROW_H);
    expect(amplio.height).toBe(PAD.top + 24 * ROW_H + PAD.bottom);

    const estrecho = geometria(24, 360);
    expect(estrecho.width).toBe(360);
    expect(estrecho.left + estrecho.plotW + PAD.right).toBe(360);
  });

  it("aprieta la fila cuando el cartel es largo, sin truncar por ancho", () => {
    const largo = geometria(DENSE_FROM + 1, 1300);
    expect(largo.rowH).toBe(ROW_H_DENSE);
    expect(largo.maxChars).toBeGreaterThanOrEqual(8);
  });

  it("pone 0 al arranque del área y 100 en su borde derecho", () => {
    const geo = geometria(10, 1200);
    expect(xDe(0, geo)).toBe(geo.left);
    expect(xDe(100, geo)).toBe(geo.left + geo.plotW);
    expect(xDe(50, geo)).toBeCloseTo(geo.left + geo.plotW / 2);
  });

  it("apila los actos en filas de arriba abajo", () => {
    const geo = geometria(3, 1200);
    expect(yDe(0, geo)).toBe(geo.top + geo.rowH / 2);
    expect(yDe(2, geo)).toBe(geo.top + 2.5 * geo.rowH);
    expect(yDe(2, geo)).toBeLessThan(geo.bottom);
  });

  it("da a cada acto su fila, su mitad central y su mediana", () => {
    const { geo, rows } = filasDe(
      [
        {
          prefix: "A",
          artist: "A",
          center: 50,
          songs: [0, 40, 60, 100].map((v, i) => ({ id: `A_${i}`, v })),
        },
        acto("B", 20, 4),
      ],
      800,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.y).toBe(geo.top + geo.rowH / 2);
    expect(rows[1]?.y).toBe(geo.top + 1.5 * geo.rowH);
    expect(rows[0]?.cx).toBe(xDe(50, geo));
    expect(rows[0]?.lo).toBe(xDe(30, geo));
    expect(rows[0]?.hi).toBe(xDe(70, geo));
  });

  it("la barra ignora los extremos: mín–máx cruzaría el lienzo entero", () => {
    const { geo, rows } = filasDe(
      [{ prefix: "A", artist: "A", center: 50, songs: [0, 48, 50, 52, 100].map((v, i) => ({ id: `A_${i}`, v })) }],
      800,
    );
    expect(rows[0]!.hi - rows[0]!.lo).toBeLessThan(geo.plotW * 0.2);
  });

  it("separa en vertical las canciones que comparten valor", () => {
    const { rows } = filasDe([acto("A", 40, 4)], 900);
    const xs = new Set(rows[0]?.songs.map((s) => s.x));
    const ys = new Set(rows[0]?.songs.map((s) => s.y));
    expect(xs.size).toBe(1);
    expect(ys.size).toBeGreaterThan(1);
  });

  it("el jitter de una canción es estable", () => {
    const a = filasDe([acto("CSS", 40, 2)], 900);
    const b = filasDe([acto("CSS", 40, 2)], 900);
    expect(a.rows[0]?.songs[0]?.y).toBe(b.rows[0]?.songs[0]?.y);
  });

  it("marca los actos con pocas canciones, donde la mediana dice poco", () => {
    const { rows } = filasDe([acto("A", 40, 2), acto("B", 30, 3)], 900);
    expect(rows[0]?.thin).toBe(true);
    expect(rows[1]?.thin).toBe(false);
  });
});

describe("reparto del clima", () => {
  it("cuenta los actos que caen cerca del centro del año, con el borde incluido", () => {
    const centros = [20, 30, 40, 50, 60];
    const reparto = repartoDe(centros, 40);
    expect(reparto?.total).toBe(5);
    expect(reparto?.n).toBe(3);
    expect(repartoDe([40 - SHARE_EPS, 40 + SHARE_EPS], 40)?.n).toBe(2);
    expect(repartoDe([40 - SHARE_EPS - 0.1], 40)?.n).toBe(0);
  });

  it("distingue un cartel unánime de uno sostenido por unos pocos", () => {
    expect(repartoDe([48, 49, 50, 51, 52], 50)?.n).toBe(5);
    expect(repartoDe([5, 20, 50, 80, 95], 50)?.n).toBe(1);
  });

  it("no inventa reparto sin actos ni sin centro del año", () => {
    expect(repartoDe([], 40)).toBeNull();
    expect(repartoDe([10, 20], null)).toBeNull();
  });
});
