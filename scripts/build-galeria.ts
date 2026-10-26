import { execFile } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

/**
 * Pasa las fotos de `docs/FOTOS GALERÍA DE FOTOS` a JPEG de la cámara.
 * Deja fuera el video y el render de la carcasa (`cámara digital.png`).
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = path.join(ROOT, "public", "assets", "home", "camara", "galeria");
const MANIFIESTO = path.join(ROOT, "src", "escenas", "home", "galeria.json");
const LADO = 1600;
const CALIDAD = "74";

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const exec = promisify(execFile);

type Toma = { src: string; fecha: string; alt: string };
type Fuente = { archivo: string; fecha: string; orden: string };

function esFoto(nombre: string): boolean {
  if (/\.mov$/i.test(nombre)) return false;
  if (/cámara digital\.png$/i.test(nombre)) return false;
  return /\.(heic|jpe?g|png)$/i.test(nombre);
}

function altDe(fecha: string): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!partes) return "Foto de la galería";
  const mes = MESES[Number(partes[2]) - 1] ?? "";
  return `Foto del ${Number(partes[3])} de ${mes} de ${partes[1]}`;
}

async function marcaDe(archivo: string): Promise<{ fecha: string; orden: string }> {
  const { stdout } = await exec("sips", ["-g", "creation", archivo]);
  const linea = stdout.split("\n").find((l) => l.includes("creation:"));
  const cruda = linea?.split("creation:")[1]?.trim() ?? "";
  const m = /^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/.exec(cruda);
  if (!m) return { fecha: "", orden: "" };
  return {
    fecha: `${m[1]}-${m[2]}-${m[3]}`,
    orden: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`,
  };
}

async function main(): Promise<void> {
  const docs = path.join(ROOT, "docs");
  const carpetas = await readdir(docs);
  const nombre = carpetas.find((c) => c.normalize("NFC").startsWith("FOTOS GALER"));
  if (!nombre) throw new Error("No está la carpeta de la galería en docs/");
  const origen = path.join(docs, nombre);
  const nombres = (await readdir(origen)).filter(esFoto);
  const fuentes: Fuente[] = [];
  for (const archivo of nombres) {
    const marca = await marcaDe(path.join(origen, archivo));
    fuentes.push({ archivo, fecha: marca.fecha, orden: marca.orden });
  }
  fuentes.sort((a, b) => {
    if (a.orden && b.orden && a.orden !== b.orden) return a.orden < b.orden ? -1 : 1;
    if (a.orden && !b.orden) return -1;
    if (!a.orden && b.orden) return 1;
    return a.archivo.localeCompare(b.archivo, "es");
  });

  await mkdir(SALIDA, { recursive: true });
  const tomas: Toma[] = [];
  for (let i = 0; i < fuentes.length; i += 1) {
    const fuente = fuentes[i];
    if (!fuente) continue;
    const id = String(i + 1).padStart(2, "0");
    const destino = path.join(SALIDA, `${id}.jpg`);
    await exec("sips", [
      "-s",
      "format",
      "jpeg",
      "-s",
      "formatOptions",
      CALIDAD,
      "--resampleHeightWidthMax",
      String(LADO),
      path.join(origen, fuente.archivo),
      "--out",
      destino,
    ]);
    tomas.push({
      src: `/assets/home/camara/galeria/${id}.jpg`,
      fecha: fuente.fecha,
      alt: altDe(fuente.fecha),
    });
    console.log(`${id}  ${fuente.orden || "sin fecha"}  ${fuente.archivo}`);
  }
  await writeFile(MANIFIESTO, `${JSON.stringify(tomas, null, 2)}\n`);
  console.log(`\n${tomas.length} fotos → ${path.relative(ROOT, SALIDA)}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
