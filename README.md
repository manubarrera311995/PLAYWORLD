# PLAYWORLD

Pieza / documental emocional interactivo. Siete escenas encadenadas.
No es SaaS, no es dashboard, no es red social.

Arquitectura: ver [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Correr

```bash
npm install
npm run data          # opcional: reconstruir public/data/archivo desde raw/
npm run dev
```

Abre `http://localhost:5173`. Recorrido:

Home → Hook → Archivo → Edición → iPod (meter 5) → Creación → Colectiva.

```bash
npm test              # motor de Almas + máquina del iPod
npm run build
npm run preview
```

## Datos

Los JSON públicos viven en `public/data/archivo/`.

Para reconstruirlos desde crudos:

1. Coloca `DATA_<año>/*.json` (formato Audio DNA) en `raw/` **o** deja las carpetas en el workspace padre (`DATA_2011`, `audio-dna/DATA_2013`, `playworld-home/data/edicion`).
2. Corre `npm run data`.
3. `raw/` no se commitea.

Años sin DNA aparecen en el Archivo como fantasma; la Edición muestra «memoria en construcción».

## Entorno

Copia `.env.example` a `.env`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Si faltan, los rastros siguen en pie con semilla local + `localStorage`. Sin auth.

Esquema: `supabase/schema.sql` (tabla `rastros`, RLS de lectura anónima e insert de visitantes).

## Deploy

Estático (Vercel o Netlify). Rewrite SPA: `/* → /index.html`.

- Vercel: `vercel.json` ya incluido.
- Netlify: `netlify.toml` ya incluido.

Variables: las mismas `VITE_SUPABASE_*`. El grafo no se cae si la API falta.

## Stack

Vite + Svelte 5 (runes) + TypeScript estricto. SPA. p5.js en instance mode. GSAP en DOM. d3-force solo para layout del grafo.
