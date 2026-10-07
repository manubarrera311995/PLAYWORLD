import { describe, expect, it } from "vitest";
import copy from "../src/escenas/hook/hook.copy.json";
import { resolverAnio, resolverPuerta } from "../src/escenas/hook/anio";

const { pesos, desempate, revelados } = copy;

describe("resolverAnio", () => {
  it("gente + lloro + recuerda → 2011", () => {
    expect(resolverAnio(["gente", "lloro", "recuerda"], pesos, desempate)).toBe(2011);
  });

  it("gente + lloro + noConozco → 2019", () => {
    expect(resolverAnio(["gente", "lloro", "noConozco"], pesos, desempate)).toBe(2019);
  });

  it("frente + bailo + recuerda → 2022", () => {
    expect(resolverAnio(["frente", "bailo", "recuerda"], pesos, desempate)).toBe(2022);
  });

  it("frente + bailo + noConozco → 2026", () => {
    expect(resolverAnio(["frente", "bailo", "noConozco"], pesos, desempate)).toBe(2026);
  });
});

describe("resolverPuerta", () => {
  it("trae la línea del año ganador", () => {
    const puerta = resolverPuerta(["gente", "lloro", "recuerda"], pesos, desempate, revelados);
    expect(puerta).toEqual({
      year: 2011,
      linea: "El archivo todavía cabía en la palma.",
    });
  });
});
