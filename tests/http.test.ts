import { describe, expect, it } from "vitest";
import { textoEsJson } from "../src/datos/http";

describe("textoEsJson", () => {
  it("acepta objetos y arrays", () => {
    expect(textoEsJson('{"a":1}')).toBe(true);
    expect(textoEsJson("  [1,2]")).toBe(true);
  });

  it("rechaza el fallback HTML del SPA", () => {
    expect(textoEsJson("<!DOCTYPE html><html>")).toBe(false);
    expect(textoEsJson("not json")).toBe(false);
  });
});
