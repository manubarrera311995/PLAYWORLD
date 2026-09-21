/**
 * Sonda de la gráfica de actos: arma las filas con un año real del archivo y
 * escribe un SVG suelto para mirar el resultado sin levantar la app.
 * Uso: npx tsx scripts/preview-actos.ts 2010 energy 1300
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REF_EPS, filasDe, repartoDe, xDe } from "../src/escenas/edicion/actos";

const [, , yearArg = "2010", metric = "energy", widthArg = "1300", hoverArg = "-1"] = process.argv;
const hoverIdx = Number(hoverArg);
const width = Number(widthArg);
const dir = join(process.cwd(), "raw", `DATA_${yearArg}`);

type Crudo = Record<string, unknown>;

function mediana(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

const acts = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .reduce<Map<string, { artist: string; songs: { id: string; v: number }[] }>>((map, file) => {
    const prefix = file.replace(/\.json$/i, "").split("_")[0]!;
    const rows = JSON.parse(readFileSync(join(dir, file), "utf8")) as Crudo[];
    const entry = map.get(prefix) ?? { artist: "", songs: [] };
    rows.forEach((row, i) => {
      const v = row[metric];
      if (typeof v !== "number") return;
      entry.artist ||= String(row.spotifyArtist ?? prefix);
      entry.songs.push({ id: `${file}#${i}`, v });
    });
    if (entry.songs.length) map.set(prefix, entry);
    return map;
  }, new Map());

const entradas = [...acts.entries()]
  .map(([prefix, act]) => ({ prefix, artist: act.artist, center: mediana(act.songs.map((s) => s.v)), songs: act.songs }))
  .sort((a, b) => b.center - a.center);

const { geo, rows } = filasDe(entradas, width);
const songCenter = mediana(entradas.flatMap((a) => a.songs.map((s) => s.v)));
const actCenter = mediana(entradas.map((a) => a.center));
const split = Math.abs(songCenter - actCenter) > REF_EPS;

const corto = (name: string) => (name.length > geo.maxChars ? `${name.slice(0, geo.maxChars - 1)}…` : name);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const marks = rows
  .map(
    (row, i) => `
  <line x1="${geo.left}" x2="${geo.left + geo.plotW}" y1="${row.y}" y2="${row.y}" stroke="rgba(255,246,239,.05)"/>
  ${
    i === hoverIdx
      ? `<rect x="0" y="${row.y - geo.rowH / 2}" width="${geo.width}" height="${geo.rowH}" fill="rgba(255,255,255,.06)"/>
         <line x1="${row.lo}" x2="${row.hi}" y1="${row.y}" y2="${row.y}" stroke="rgba(255,148,102,.32)" stroke-width="9" stroke-linecap="round"/>`
      : ""
  }
  ${row.songs.map((s) => `<circle cx="${s.x}" cy="${s.y}" r="2.4" fill="rgba(255,190,158,.82)"/>`).join("")}
  <circle cx="${row.cx}" cy="${row.y}" r="${i === hoverIdx ? 5.4 : 4.2}" fill="${i === hoverIdx ? "#ff9466" : "#fff6ef"}"/>
  <text x="${geo.left - 42}" y="${row.y + 4}" text-anchor="end" fill="${row.thin ? "rgba(255,246,239,.38)" : "rgba(255,245,236,.9)"}" font-size="11" font-family="Inter,sans-serif">${esc(corto(row.artist))}</text>
  <text x="${geo.left - 14}" y="${row.y + 4}" text-anchor="end" fill="rgba(255,246,239,.42)" font-size="11" font-family="Inter,sans-serif">${row.n}</text>
  <text x="${geo.left + geo.plotW + 12}" y="${row.y + 4}" fill="rgba(255,246,239,.72)" font-size="11" font-family="Inter,sans-serif">${Math.round(row.center)}</text>`,
  )
  .join("");

const xs = xDe(songCenter, geo);
const xa = xDe(actCenter, geo);
const anchor = geo.left + geo.plotW - xs > 160 ? { a: "start", x: xs + 8 } : { a: "end", x: xs - 8 };

const reparto = repartoDe(entradas.map((a) => a.center), songCenter);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${geo.width}" height="${geo.height}" viewBox="0 0 ${geo.width} ${geo.height}">
<rect width="100%" height="100%" fill="#14081a"/>
<text x="16" y="${geo.top - 18}" fill="rgba(255,246,239,.42)" font-size="10" font-family="Inter,sans-serif" letter-spacing="1.4">${metric.toUpperCase()} · 0–100</text>
${[0, 50, 100]
  .map(
    (t, i) =>
      `<line x1="${xDe(t, geo)}" x2="${xDe(t, geo)}" y1="${geo.top - 10}" y2="${geo.bottom + 8}" stroke="rgba(255,246,239,${t === 50 ? ".14" : ".09"})" ${t === 50 ? 'stroke-dasharray="3 7"' : ""}/>
       <text x="${xDe(t, geo)}" y="${geo.top - 18}" text-anchor="${i === 0 ? "start" : i === 2 ? "end" : "middle"}" fill="rgba(255,246,239,.42)" font-size="10" font-family="Inter,sans-serif">${t}</text>`,
  )
  .join("")}
${
  split
    ? `<rect x="${Math.min(xs, xa)}" y="${geo.top - 10}" width="${Math.abs(xs - xa)}" height="${geo.bottom + 18 - geo.top}" fill="rgba(255,143,189,.12)"/>
       <line x1="${xa}" x2="${xa}" y1="${geo.top - 10}" y2="${geo.bottom + 8}" stroke="#ff8fbd" stroke-dasharray="3 4"/>
       <text x="${xa + 8}" y="${geo.bottom + 28}" fill="#ff8fbd" font-size="10" font-weight="600" font-family="Inter,sans-serif" letter-spacing="1.6">MEDIANA DE ACTOS · ${Math.round(actCenter)} (${actCenter > songCenter ? "+" : "−"}${Math.round(Math.abs(songCenter - actCenter))})</text>`
    : ""
}
<line x1="${xs}" x2="${xs}" y1="${geo.top - 10}" y2="${geo.bottom + 8}" stroke="#fff6ef" stroke-width="1.5"/>
<text x="${anchor.x}" y="${geo.top - 38}" text-anchor="${anchor.a}" fill="#fff6ef" font-size="10" font-weight="600" font-family="Inter,sans-serif" letter-spacing="1.6">MEDIANA DEL AÑO · ${Math.round(songCenter)}</text>
${marks}
</svg>`;

const dest = join(process.cwd(), ".preview");
mkdirSync(dest, { recursive: true });
const out = join(dest, "actos.svg");
writeFileSync(out, svg, "utf8");
writeFileSync(
  join(dest, "actos.html"),
  `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#14081a}img{display:block;width:${geo.width}px}</style><img src="./actos.svg" alt="">`,
  "utf8",
);
console.log(`${entradas.length} actos · rowH ${geo.rowH} · ${geo.width}×${geo.height} · maxChars ${geo.maxChars}`);
console.log(`mediana canciones ${Math.round(songCenter)} · mediana actos ${Math.round(actCenter)} · split ${split}`);
console.log(`reparto ${reparto?.n}/${reparto?.total} artistas en el clima del año`);
console.log(`bordes: ${rows[0]?.artist} ${Math.round(rows[0]?.center ?? 0)} · ${rows.at(-1)?.artist} ${Math.round(rows.at(-1)?.center ?? 0)}`);
console.log(`nombre más largo: ${Math.max(...rows.map((r) => r.artist.length))} caracteres`);
console.log(out);
