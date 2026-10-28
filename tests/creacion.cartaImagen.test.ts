import { describe, expect, it } from "vitest";
import { CARTA, medidas } from "../src/escenas/creacion/cartaImagen";

describe("medidas de la card", () => {
  it("deja el dibujo entre la ceja y el nombre", () => {
    const m = medidas(CARTA.ancho, CARTA.alto, 2);
    expect(m.dibujo.y).toBeGreaterThan(m.ceja.y + m.ceja.alto);
    expect(m.nombre.y).toBeGreaterThan(m.dibujo.y + m.dibujo.alto);
    expect(m.pastilla.y + m.pastilla.alto).toBeLessThanOrEqual(CARTA.alto);
  });

  it("en una card de pantalla el pie cabe y el dibujo sigue siendo el cuerpo", () => {
    const m = medidas(468, 832, 2);
    expect(m.dibujo.alto).toBeGreaterThan(500);
    expect(m.dibujo.alto).toBeLessThan(600);
    expect(m.nombre.alto).toBeCloseTo(m.nombre.altoLinea * 2);
  });

  it("con tres líneas el dibujo no se aplasta", () => {
    const m = medidas(CARTA.ancho, CARTA.alto, 3);
    expect(m.dibujo.alto).toBeGreaterThan(CARTA.alto * 0.5);
  });
});
