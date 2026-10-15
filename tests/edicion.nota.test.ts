import { describe, expect, it } from "vitest";
import { hzDe } from "../src/escenas/edicion/notaSonido";

describe("altura de la nota", () => {
  it("afina La en 440 y el Do una octava debajo del siguiente", () => {
    expect(hzDe("A")).toBeCloseTo(440, 5);
    expect(hzDe("C")).toBeCloseTo(261.6256, 3);
    expect(hzDe("C#")).toBeCloseTo(hzDe("C")! * 2 ** (1 / 12), 5);
  });

  it("acepta bemoles y descarta lo que no es nota", () => {
    expect(hzDe("Bb")).toBeCloseTo(hzDe("A#")!, 5);
    expect(hzDe("")).toBeNull();
    expect(hzDe("H")).toBeNull();
  });
});
