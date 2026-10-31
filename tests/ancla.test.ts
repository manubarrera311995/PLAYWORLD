import { beforeEach, describe, expect, it } from "vitest";
import { consumirPregunta, pedirPregunta, registrarSalto } from "../src/escenas/home/ancla";

describe("ancla de la pregunta", () => {
  beforeEach(() => {
    consumirPregunta();
    registrarSalto(() => undefined)();
  });

  it("sin home montado queda pedido para el próximo montaje", () => {
    expect(pedirPregunta()).toBe(false);
    expect(consumirPregunta()).toBe(true);
    expect(consumirPregunta()).toBe(false);
  });

  it("con el home montado salta y no deja el pedido colgado", () => {
    let n = 0;
    const soltar = registrarSalto(() => {
      n += 1;
    });
    expect(pedirPregunta()).toBe(true);
    expect(n).toBe(1);
    expect(consumirPregunta()).toBe(false);
    soltar();
    expect(pedirPregunta()).toBe(false);
    expect(consumirPregunta()).toBe(true);
  });
});
