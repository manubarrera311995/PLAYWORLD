import { describe, expect, it } from "vitest";
import { distanciaDe, layoutGrafo } from "../src/escenas/colectiva/layout";
import type { Rastro } from "../src/rastros/tipos";
import type { AlmaId } from "../src/almas/almas";

function rastro(id: string, almaId: AlmaId, trackIds: string[]): Rastro {
  return {
    id,
    alias: id,
    almaId,
    trackIds,
    yearHint: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    origen: "semilla",
  };
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

describe("layout del grafo", () => {
  it("acorta el enlace cuantas más canciones se comparten", () => {
    expect(distanciaDe(1)).toBeGreaterThan(distanciaDe(3));
    expect(distanciaDe(3)).toBeGreaterThan(distanciaDe(5));
    expect(distanciaDe(5)).toBe(56);
  });

  it("junta por canciones compartidas aunque el alma sea otra", () => {
    const layout = layoutGrafo(
      [
        rastro("a", "noctambula", ["1", "2", "3", "4", "5"]),
        rastro("gemela", "intensa", ["1", "2", "3", "4", "5"]),
        rastro("lejana", "noctambula", ["1", "9", "8", "7", "6"]),
      ],
      1280,
      800,
      null,
      () => null,
    );
    const porId = new Map(layout.nodos.map((n) => [n.id, n]));
    const a = porId.get("a");
    const gemela = porId.get("gemela");
    const lejana = porId.get("lejana");
    if (!a || !gemela || !lejana) throw new Error("faltan nodos");
    expect(dist(a, gemela)).toBeLessThan(dist(a, lejana));
  });
});
