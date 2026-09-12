import { describe, expect, it } from "vitest";
import copy from "../src/escenas/hook/hook.copy.json";
import { resolverAnio, resolverPuerta } from "../src/escenas/hook/anio";

const { pesos, desempate, revelados } = copy;

describe("resolverAnio", () => {
  it("quedas + lloras + conocido → 2011", () => {
    expect(resolverAnio(["quedas", "lloras", "conocido"], pesos, desempate)).toBe(2011);
  });

  it("quedas + lloras + desconocido → 2019", () => {
    expect(resolverAnio(["quedas", "lloras", "desconocido"], pesos, desempate)).toBe(2019);
  });

  it("frente + empujas + conocido → 2022", () => {
    expect(resolverAnio(["frente", "empujas", "conocido"], pesos, desempate)).toBe(2022);
  });

  it("frente + empujas + desconocido → 2026", () => {
    expect(resolverAnio(["frente", "empujas", "desconocido"], pesos, desempate)).toBe(2026);
  });
});

describe("resolverPuerta", () => {
  it("trae la línea del año ganador", () => {
    const puerta = resolverPuerta(["quedas", "lloras", "conocido"], pesos, desempate, revelados);
    expect(puerta).toEqual({
      year: 2011,
      linea: "El archivo todavía cabía en la palma.",
    });
  });
});
