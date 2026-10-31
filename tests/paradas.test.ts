import { describe, expect, it } from "vitest";
import { anioDeParadas, avanceDibujado, cruceSuave, velosCruce, vistaParadas } from "../src/escenas/paradas";
import type { RutaParsed } from "../src/escenas/director/router";

const nombres = (escena: RutaParsed["name"], anio: number | null, tieneAlma = false) =>
  vistaParadas(escena, anio, tieneAlma).items.map((item) => ({
    nombre: item.nombre,
    estado: item.estado,
    href: item.href,
  }));

describe("vistaParadas", () => {
  it("en el home la parada actual es Home y la barra está al inicio", () => {
    const vista = vistaParadas("home", null, false);
    expect(vista.avance).toBe(0);
    expect(nombres("home", null)[0]).toEqual({ nombre: "Home", estado: "actual", href: null });
    expect(vista.items.every((item, i) => (i === 0 ? item.estado === "actual" : item.estado === "futura"))).toBe(
      true,
    );
  });

  it("en el título del home se puede saltar a Mi primera vez sin abrir el resto", () => {
    const vista = vistaParadas("home", null, false);
    expect(vista.items.find((item) => item.id === "primera")).toMatchObject({
      estado: "futura",
      href: "/#pregunta",
    });
    expect(vista.items.find((item) => item.id === "fila")?.href).toBeNull();
    expect(vista.items.find((item) => item.id === "mapa")?.href).toBeNull();
  });

  it("en la pregunta del home la parada actual es Mi primera vez", () => {
    const vista = vistaParadas("home", null, false, true);
    expect(vista.avance).toBeCloseTo(1 / 7);
    expect(vista.items.slice(0, 3).map((item) => ({ nombre: item.nombre, estado: item.estado, href: item.href }))).toEqual([
      { nombre: "Home", estado: "pasada", href: "/" },
      { nombre: "Mi primera vez", estado: "actual", href: null },
      { nombre: "La fila", estado: "futura", href: null },
    ]);
  });

  it("en la fila se puede volver al home y a la pregunta", () => {
    const vista = vistaParadas("hook", 2013, false);
    expect(vista.avance).toBeCloseTo(2 / 7);
    expect(nombres("hook", 2013).slice(0, 4)).toEqual([
      { nombre: "Home", estado: "pasada", href: "/" },
      { nombre: "Mi primera vez", estado: "pasada", href: "/#pregunta" },
      { nombre: "La fila", estado: "actual", href: null },
      { nombre: "El año", estado: "futura", href: null },
    ]);
  });

  it("en el archivo se puede volver a la fila y el cartel sigue cerrado", () => {
    expect(nombres("archivo", 2016).slice(0, 5)).toEqual([
      { nombre: "Home", estado: "pasada", href: "/" },
      { nombre: "Mi primera vez", estado: "pasada", href: "/#pregunta" },
      { nombre: "La fila", estado: "pasada", href: "/hook" },
      { nombre: "El año", estado: "actual", href: null },
      { nombre: "El cartel", estado: "futura", href: null },
    ]);
  });

  it("en el cartel se vuelve al año de esa edición", () => {
    const vista = vistaParadas("edicion", 2011, false);
    expect(vista.items.find((item) => item.id === "anio")?.href).toBe("/archivo?y=2011");
    expect(vista.items.find((item) => item.id === "cartel")).toMatchObject({
      estado: "actual",
      href: null,
    });
    expect(vista.items.find((item) => item.id === "ipod")?.estado).toBe("futura");
  });

  it("en el iPod la línea sigue completa", () => {
    const vista = vistaParadas("ipod", 2019, false);
    expect(vista.items).toHaveLength(8);
    expect(vista.items.find((item) => item.estado === "actual")?.nombre).toBe("Tu iPod");
    expect(vista.items.find((item) => item.id === "cartel")?.href).toBe("/edicion/2019");
    expect(vista.avance).toBeCloseTo(5 / 7);
  });

  it("sin año el cartel pasado no tiene a dónde volver", () => {
    const vista = vistaParadas("ipod", null, false);
    expect(vista.items.find((item) => item.id === "anio")?.href).toBe("/archivo");
    expect(vista.items.find((item) => item.id === "cartel")?.href).toBeNull();
  });

  it("el alma solo se puede reabrir si ya existe", () => {
    expect(vistaParadas("colectiva", 2022, false).items.find((item) => item.id === "alma")?.href).toBeNull();
    expect(vistaParadas("colectiva", 2022, true).items.find((item) => item.id === "alma")?.href).toBe(
      "/creacion",
    );
  });

  it("la cartografía llena la barra", () => {
    expect(vistaParadas("colectiva", 2022, true).avance).toBe(1);
  });

  it("volver atrás apaga las paradas que quedan delante", () => {
    const vista = vistaParadas("edicion", 2014, true);
    expect(vista.items.find((item) => item.id === "mapa")?.estado).toBe("futura");
    expect(vista.items.find((item) => item.id === "alma")?.href).toBeNull();
  });

  it("con el flujo completo se puede saltar a cualquier sección", () => {
    const vista = vistaParadas("hook", 2014, true, false, true);
    expect(vista.items.find((item) => item.id === "fila")).toMatchObject({ estado: "actual", href: null });
    expect(vista.items.find((item) => item.id === "home")?.href).toBe("/");
    expect(vista.items.find((item) => item.id === "anio")?.href).toBe("/archivo?y=2014");
    expect(vista.items.find((item) => item.id === "cartel")?.href).toBe("/edicion/2014");
    expect(vista.items.find((item) => item.id === "ipod")?.href).toBe("/ipod");
    expect(vista.items.find((item) => item.id === "alma")?.href).toBe("/creacion");
    expect(vista.items.find((item) => item.id === "mapa")?.href).toBe("/colectiva");
    expect(vista.avance).toBeCloseTo(2 / 7);
  });

  it("con el flujo completo el alma y el cartel siguen cerrados si no hay con qué abrirlos", () => {
    const vista = vistaParadas("home", null, false, false, true);
    expect(vista.items.find((item) => item.id === "alma")?.href).toBeNull();
    expect(vista.items.find((item) => item.id === "cartel")?.href).toBeNull();
    expect(vista.items.find((item) => item.id === "fila")?.href).toBe("/hook");
    expect(vista.items.find((item) => item.id === "mapa")?.href).toBe("/colectiva");
  });
});

describe("cruce de Home a Mi primera vez", () => {
  it("empieza en el título y termina al asentarse la pregunta", () => {
    expect(cruceSuave(0)).toBe(0);
    expect(cruceSuave(0.05)).toBe(0);
    expect(cruceSuave(0.19)).toBe(1);
    expect(cruceSuave(1)).toBe(1);
    expect(cruceSuave(0.12)).toBeGreaterThan(0.4);
    expect(cruceSuave(0.12)).toBeLessThan(0.6);
  });

  it("el nombre sale y el siguiente entra en un fundido largo", () => {
    expect(velosCruce(0)).toEqual({ sale: 1, entra: 0 });
    expect(velosCruce(0.08)).toEqual({ sale: 1, entra: 0 });
    const yendo = velosCruce(0.3);
    expect(yendo.entra).toBe(0);
    expect(yendo.sale).toBeGreaterThan(0.4);
    expect(yendo.sale).toBeLessThan(0.7);
    const medio = velosCruce(0.5);
    expect(medio.sale).toBeLessThan(0.08);
    expect(medio.entra).toBeLessThan(0.08);
    const viniendo = velosCruce(0.7);
    expect(viniendo.sale).toBe(0);
    expect(viniendo.entra).toBeGreaterThan(0.4);
    expect(velosCruce(0.92)).toEqual({ sale: 0, entra: 1 });
    expect(velosCruce(1)).toEqual({ sale: 0, entra: 1 });
  });

  it("en el home la barra sigue el cruce y fuera de él respeta el paso", () => {
    expect(avanceDibujado("home", 0, 0)).toBe(0);
    expect(avanceDibujado("home", 1 / 7, 0.5)).toBeCloseTo(0.5 / 7);
    expect(avanceDibujado("home", 1 / 7, 1)).toBeCloseTo(1 / 7);
    expect(avanceDibujado("hook", 2 / 7, 0)).toBeCloseTo(2 / 7);
  });
});

describe("anioDeParadas", () => {
  const rec = { yearHint: 2011, edicionAbierta: 2013 };

  it("la edición manda sobre el año guardado", () => {
    const ruta: RutaParsed = { name: "edicion", path: "/edicion", year: 2016 };
    expect(anioDeParadas(ruta, rec)).toBe(2016);
  });

  it("el archivo usa el año de la ruta", () => {
    const ruta: RutaParsed = { name: "archivo", path: "/archivo", year: 2019 };
    expect(anioDeParadas(ruta, rec)).toBe(2019);
  });

  it("sin año en la ruta cae a la edición abierta y luego al año elegido", () => {
    const ruta: RutaParsed = { name: "colectiva", path: "/colectiva" };
    expect(anioDeParadas(ruta, rec)).toBe(2013);
    expect(anioDeParadas(ruta, { yearHint: 2011, edicionAbierta: null })).toBe(2011);
    expect(anioDeParadas(ruta, { yearHint: null, edicionAbierta: null })).toBeNull();
  });
});
