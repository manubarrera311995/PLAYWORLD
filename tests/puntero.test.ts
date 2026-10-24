import { describe, expect, it } from "vitest";
import { punteroSobreClaro, type CapaFondo } from "../src/ui/puntero";

const capa = (backgroundColor: string, backgroundImage = "none", cubre = false): CapaFondo => ({
  backgroundColor,
  backgroundImage,
  cubre,
});

const transparente = "rgba(0, 0, 0, 0)";

describe("punteroSobreClaro", () => {
  it("pinta negro sobre la carcasa blanca del iPod", () => {
    const carcasa = capa(
      transparente,
      "radial-gradient(120% 55% at 50% 0%, rgba(255, 255, 255, 0.96), transparent 46%), linear-gradient(180deg, #fcfcfb 0%, #f0f0ee 46%, #e2e2df 100%)",
    );
    expect(punteroSobreClaro([carcasa])).toBe(true);
  });

  it("pinta negro sobre la pantalla y la rueda", () => {
    expect(punteroSobreClaro([capa("#f3f3f3")])).toBe(true);
    expect(punteroSobreClaro([capa("rgb(244, 244, 244)")])).toBe(true);
    expect(
      punteroSobreClaro([
        capa(
          transparente,
          "radial-gradient(circle at 50% 38%, #ffffff 0%, #f6f6f4 46%, #e4e4e1 78%, #cfcfcc 100%)",
        ),
      ]),
    ).toBe(true);
    expect(
      punteroSobreClaro([
        capa(transparente, "linear-gradient(180deg, #f7f7f7 0%, #d5d5d5 100%)"),
      ]),
    ).toBe(true);
  });

  it("sigue crema en el marco negro y en la fila azul", () => {
    expect(
      punteroSobreClaro([
        capa(transparente, "linear-gradient(180deg, #2a2a2a 0%, #0a0a0a 38%, #161616 100%)"),
      ]),
    ).toBe(false);
    expect(
      punteroSobreClaro([
        capa(transparente, "linear-gradient(180deg, #6aafff 0%, #2d78e8 42%, #1c62d6 100%)"),
      ]),
    ).toBe(false);
  });

  it("atraviesa un botón transparente hasta el blanco de detrás", () => {
    expect(punteroSobreClaro([capa(transparente), capa("#f4f4f4")])).toBe(true);
  });

  it("ignora un velo blanco translúcido y mira el fondo oscuro", () => {
    expect(
      punteroSobreClaro([capa("rgba(255, 255, 255, 0.42)"), capa("#100a12")]),
    ).toBe(false);
  });

  it("deja el asterisco crema sobre el rosa del home", () => {
    expect(
      punteroSobreClaro([
        capa(
          transparente,
          "linear-gradient(162deg, #f48ca1 0%, #eb899f 24%, #c7709c 52%, #a74f98 78%, #a04294 100%)",
        ),
      ]),
    ).toBe(false);
  });

  it("no adivina el color de una foto", () => {
    expect(punteroSobreClaro([capa(transparente, 'url("/foto.jpg")', true), capa("#fff")])).toBe(
      false,
    );
  });
});
