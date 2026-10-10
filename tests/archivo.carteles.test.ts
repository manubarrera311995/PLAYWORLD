import { describe, expect, it } from "vitest";
import copy from "../src/escenas/archivo/archivo.copy.json";
import { cartelDe } from "../src/escenas/archivo/carteles";

describe("cartelDe", () => {
  it("deja 2020 y 2021 en el cielo y cubre el resto del archivo", () => {
    for (const year of copy.years) {
      const src = cartelDe(year);
      if (year === 2020 || year === 2021) {
        expect(src).toBeNull();
      } else {
        expect(src).toBe(`/assets/archivo/carteles/${year}.webp`);
      }
    }
  });
});
