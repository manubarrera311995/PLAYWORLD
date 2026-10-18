import { describe, expect, it } from "vitest";
import { envolver, extremosDegradado, nombreArchivo, repartirBandas } from "../src/escenas/creacion/tarjeta";

describe("bandas de la tarjeta", () => {
  it("reparte el alto según el peso", () => {
    const bandas = repartirBandas([1, 3], 100, 200);
    expect(bandas[0]).toEqual({ y: 100, alto: 50 });
    expect(bandas[1]).toEqual({ y: 150, alto: 150 });
  });

  it("suma el alto pedido", () => {
    const bandas = repartirBandas([0.8, 1.2, 2, 0.9, 1.1], 40, 900);
    const suma = bandas.reduce((a, b) => a + b.alto, 0);
    expect(suma).toBeCloseTo(900);
    expect(bandas[0]?.y).toBe(40);
  });
});

describe("degradado", () => {
  it("a 180° baja de arriba a abajo", () => {
    const linea = extremosDegradado(180, 1080, 1920);
    expect(linea.x0).toBeCloseTo(linea.x1);
    expect(linea.y0).toBeCloseTo(0);
    expect(linea.y1).toBeCloseTo(1920);
  });

  it("a 90° cruza de izquierda a derecha", () => {
    const linea = extremosDegradado(90, 200, 400);
    expect(linea.y0).toBeCloseTo(linea.y1);
    expect(linea.x0).toBeCloseTo(0);
    expect(linea.x1).toBeCloseTo(200);
  });
});

describe("envolver", () => {
  const cabe = (max: number) => (linea: string) => linea.length <= max;

  it("deja una sola línea cuando entra", () => {
    expect(envolver("Genesis", 2, cabe(20))).toEqual(["Genesis"]);
  });

  it("corta en dos líneas", () => {
    expect(envolver("Age of Anxiety II", 2, cabe(12))).toEqual(["Age of", "Anxiety II"]);
  });

  it("cierra con puntos lo que no entra", () => {
    const lineas = envolver("Age of Anxiety II Rabbit Hole", 2, cabe(12));
    expect(lineas).toHaveLength(2);
    expect(lineas[1]?.endsWith("…")).toBe(true);
  });

  it("calla si no hay texto", () => {
    expect(envolver("   ", 2, cabe(12))).toEqual([]);
  });
});

describe("nombre del archivo", () => {
  it("usa el alias", () => {
    expect(nombreArchivo("Lina")).toBe("playworld-lina.png");
    expect(nombreArchivo("Inés")).toBe("playworld-ines.png");
  });

  it("tiene un nombre cuando no hay alias", () => {
    expect(nombreArchivo("  ")).toBe("playworld-alma.png");
  });
});
