import { describe, expect, it } from "vitest";
import copy from "../src/escenas/archivo/archivo.copy.json";
import { cartelDe } from "../src/escenas/archivo/carteles";

describe("cartelDe", () => {
  it("cada año de la línea tiene cartel, y 2020 y 2021 no están", () => {
    expect(copy.years).not.toContain(2020);
    expect(copy.years).not.toContain(2021);
    for (const year of copy.years) {
      expect(cartelDe(year)).toBe(`/assets/archivo/carteles/${year}.webp`);
    }
  });
});
