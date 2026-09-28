Ya tengo lo que necesito: leí PLAYWORLD.md, la propuesta cliente, alcance/estilo, el mockup playworld-home completo (shell, main, home, hook, archivo, ipod, creación, colectiva y sus JSON), el experimento p5 de juego.html y un registro crudo de Audio DNA. Va el documento, listo para pegar en `PLAYWORLD/ARCHITECTURE.md`.

---

# PLAYWORLD · ARCHITECTURE.md

> Documento de cierre de stack y arquitectura. Quien implemente (Grok 4.6) construye sobre esto sin reabrir decisiones. playworld-home es musa; este doc es cimiento.

## 1. Tesis de arquitectura (máx. 12 líneas)

PLAYWORLD es una **SPA estática de siete escenas encadenadas** (un recorrido, no un sitio) compilada con Vite + Svelte 5 + TypeScript, con dos motores de expresión bien delimitados: **p5.js pinta píxeles** (grano, color-dato, LCD, collage de vidrio, grafo) en islas de canvas que viven dentro de cada escena, y **GSAP mueve números y DOM** (entradas, salidas, scroll, Flip entre escenas, micro-motion). Svelte es dueño del DOM y del estado; ni p5 ni GSAP tocan lo del otro.

El centro del recorrido es un objeto: el **iPod**, módulo de primera clase con máquina de estados propia (pila de menús, cursor, selección), dos modos de control sobre la misma metáfora (rueda para puntero fino, ruleta+toque para touch) y una única salida: una `Seleccion` de 5 canciones que el **motor de Almas** convierte en Alma y en un **Rastro anónimo**.

Los rastros son la única cosa que sale del navegador: `GET/POST rastros` contra Supabase sin auth, detrás de un puerto que también sabe leer una semilla local. El grafo colectivo se hidrata de semilla + vivos + el tuyo, y degrada sin caerse.

Se siente así: entras a un collage con grano que respira; una pregunta ocupa toda la pantalla; sintonizas años como en una radio; un año se abre como un póster; el mundo se encoge dentro de un LCD; giras una rueda con clics; el fondo cambia de color porque tu dato cambió; tu polaroid vuela y se posa entre las de otros. Color = dato. Objeto, no interfaz.

## 2. Decisión de stack

### Ganadora: **Vite + Svelte 5 (runes) + TypeScript**, SPA estática. p5 en instance mode como islas. GSAP + Flip + ScrollTrigger sobre DOM. Supabase (Postgres + PostgREST, sin auth) solo para rastros. Deploy en Vercel (o Netlify; equivalentes con un rewrite SPA).

**Por qué gana para una pieza artística, no "porque es estándar":**

- **Svelte compila a DOM directo, sin virtual DOM.** GSAP puede mutar `transform`, `opacity`, `clip-path` sin que un reconciliador se lo pise en el siguiente render. En React eso exige `useGSAP`, memoización y disciplina contra Strict Mode (doble `useEffect` = dos instancias de p5, dos timelines). Aquí no existe ese enemigo.
- **Lifecycle honesto para canvas.** `onMount` devuelve cleanup; `$effect` reacciona a stores. Montar un sketch p5 y destruirlo al salir de escena son cinco líneas, no un patrón.
- **CSS scoped por componente + tokens globales.** Cada escena tiene su piel sin que "la clase `.card`" del grafo choque con la del collage. Nadie va a instalar Tailwind ni una librería de componentes: la gravedad hacia "dashboard" es mucho menor que en React.
- **El iPod es una pila de pantallas.** Un árbol de componentes (`Menu`, `Lista`, `Cancion`, `MiIpod`) gobernado por una máquina de estados es exactamente lo que Svelte hace bien sin ceremonia.
- **Stores nativos** para el recorrido (año → selección → Alma → rastro). No hay que elegir entre Zustand/Redux/Context; no hay que escribir un bus de eventos casero como el de `main.js` del mockup.
- **Bundle pequeño**: Svelte runtime ~2 KB. El peso se lo lleva lo que importa (p5, GSAP, carátulas), no el framework.

**Descartadas y por qué:**

| Opción | Veredicto | Razón |
|---|---|---|
| A. Vite + TS vanilla | No | Es exactamente lo que ya falló en playworld-home: un `main.js` dios de 500 líneas con `body.classList` como router. Con iPod (pila de menús), grafo (filtros + ficha) y responsive (dos modos de control), el agente terminaría escribiendo un mini-framework de componentes, scoped CSS y estado. Mejor usar uno que ya compila a vanilla. |
| B. Vite + React + TS | No | Viable, pero pelea contra el medio: Strict Mode duplica montajes de p5/GSAP, cada re-render amenaza estilos animados, el ecosistema empuja a Tailwind/shadcn (piel genérica). Todo eso se puede mitigar, pero es energía que no va a la pieza. |
| D. Next.js / Remix / SvelteKit con SSR | No | No hay CMS, ni auth, ni SEO de producto. SSR complica canvas (`window` en servidor) sin pagar nada. Si en el futuro se quiere SvelteKit con `adapter-static`, la migración desde Svelte SPA es mecánica; hoy no aporta. |
| Angular | No | Peso, ceremonia, cero ventaja para canvas/motion. |
| React Three Fiber / Three.js como cimiento | No | alcance.html lo excluye. Three.js queda como **enchufe**: un sketch más dentro de `sketches/` si algún día se quiere el iPod en 3D o el grafo en profundidad. |
| Firebase (rastros) | No | SDK pesado (>100 KB), reglas de seguridad verbosas, no aporta sobre PostgREST para dos endpoints. |
| Cloudflare Worker + KV (rastros) | No (enchufe) | KV lista claves, no valores; para "listar rastros" habría que mantener un blob único con race conditions o pasar a D1/Durable Objects. Es más código y un segundo toolchain (wrangler) para lo mismo que Supabase da con una tabla y una política. Queda escrito como alternativa si Supabase molesta. |

**Se usa / no / más adelante:**

| Pieza | Decisión | Nota |
|---|---|---|
| Vite | Sí | Dev server + build estático. |
| TypeScript | Sí | Estricto. Tipos de `Track`, `Alma`, `Rastro` son el contrato entre módulos. |
| Svelte 5 (runes) | Sí | Dueño del DOM y del estado. Sin SvelteKit. |
| p5.js (instance mode) | Sí | Solo dentro de `sketches/`. Nunca global mode, nunca `new p5` fuera de `p5Isla`. |
| GSAP core + Flip + ScrollTrigger | Sí | Flip para transiciones "objeto que viaja"; ScrollTrigger solo en Archivo. |
| Lenis (scroll suave) | Más adelante | Enchufe en `motion/scroll.ts`; ScrollTrigger funciona sin él. |
| Router | Sí, mínimo propio | `escenas/director/router.ts` (~60 líneas, History API). No librería: siete rutas fijas y una transición coreografiada entre ellas no es lo que resuelve un router. |
| Store de estado | Svelte stores / runes | `estado/recorrido.ts`, `ipod/ipod.store.ts`, `rastros/store.ts`. |
| Store de rastros | Supabase (Postgres + PostgREST, anon key) | Una tabla, dos políticas RLS, constraints en DB. Sin SDK: `fetch` directo. |
| d3-force (solo layout) | Sí | Cálculo de posiciones del grafo; **no** renderiza. Render en p5. |
| Vitest | Sí | Motor de Almas, máquina del iPod, store compuesto de rastros. |
| Deploy | Vercel o Netlify | Estático + un rewrite `/* → /index.html`. |
| Three.js / shaders WebGL | Más adelante | Un sketch más. No cimiento. |
| Spotify API en vivo | No | Carátulas ya vienen en el JSON. Previews de audio ya no las entrega la API. |

## 3. Capas creativas

Cinco capas, cada una con un dueño. La regla de oro: **Svelte maneja el DOM, GSAP anima números, p5 pinta píxeles, los datos deciden el color, los rastros viven detrás de un puerto.**

| Capa | Dueño | Qué contiene | Qué NO hace |
|---|---|---|---|
| **Escenas (DOM)** | Svelte (`escenas/*`) | Estructura, texto, botones, listas accesibles, layout responsive, CSS scoped. | No dibuja en canvas. No calcula Almas. |
| **Director (motion de escena)** | `escenas/director/` + GSAP | Router, transición saliente→entrante, Flip de "objeto que viaja", `prefers-reduced-motion`. | No conoce el contenido de una escena; pide `salida()` y `entrada()` al contrato `Escena`. |
| **Sketches (píxeles)** | p5 instance mode (`sketches/*`) | Grano global, fondo LCD, collage de vidrio, revelado del Alma, grafo. Cada sketch lee un objeto `params` y una `paleta`. | No maneja DOM ni eventos de negocio. No enruta. No decide nada: pinta lo que `params` dice. |
| **Color-dato** | `datos/color.ts` + `almas/almas.ts` → `sketches/paleta.ts` | Convierte Audio DNA de un track o un Alma en `{c1,c2,c3, granoDensidad, granoVelocidad}` y lo publica en CSS vars (`--c1..--c3`) y en el store `paleta`. | Única fuente. CSS y p5 leen lo mismo; nadie hardcodea un color por escena. |
| **Datos y rastros** | `datos/`, `almas/`, `rastros/` | Loader lazy por año, pool del iPod, motor de Almas, puerto `RastrosPort` con adaptadores. | No sabe que existe un canvas. |

**Quién es dueño de qué:**

- **Escenas**: el Director las monta/desmonta; cada escena es un componente Svelte que implementa `Escena` (`entrada`, `salida`, `ruta`).
- **iPod**: módulo `src/ipod/` autónomo. La escena `escenas/ipod/IpodEscena.svelte` solo lo posiciona en pantalla y escucha `oncerrar(seleccion)`. El iPod se podría montar en otra escena sin cambiar una línea del módulo.
- **Grano**: un solo sketch global (`grano.sketch.ts`) montado en `App.svelte`, siempre encima con `mix-blend-mode: soft-light`, 12–20 fps. Lee `paleta.grano*`. Nunca se duplica por escena.
- **Color-dato**: `paleta` store. Cambia cuando cambia el Alma (Creación), la canción resaltada (iPod) o el año (Edición). GSAP interpola entre paletas (`gsap.to(paleta.params, {...})`) para que el cambio se sienta, no salte.
- **Rastros**: `rastros/store.ts` (compuesto). Nadie más hace `fetch`.

**Cómo se añade un sketch o efecto sin reescribir una escena:**

Cada escena expone hasta tres `<SketchSlot capa="fondo|capa|frente" sketch={factory} params={...}/>`. Un sketch es una función `(p: p5, params, paleta) => { setup, draw, resize, destroy }` registrada en `sketches/registro.ts`. Añadir "shader de ruido al Archivo" = escribir el sketch + una línea en el slot. La escena no cambia.

```ts
// sketches/p5Isla.ts — contrato de una isla
export type Sketch<P> = (p: p5, params: P, paleta: Readable<Paleta>) => {
  setup(): void; draw(): void; resize(w: number, h: number): void; destroy?(): void;
};
export function p5Isla<P>(mount: HTMLElement, sketch: Sketch<P>, params: P): {
  pause(): void; resume(): void; resize(): void; destroy(): void;
};
```

**Ciclo de vida p5 + GSAP:**

1. `onMount` de la escena → `gsap.context(() => {...}, root)` para todo su motion → `p5Isla(...)` por slot.
2. Director llama `entrada()` (timeline GSAP). Los sketches ya pintan.
3. Al navegar: Director llama `salida()` → espera → desmonta. `onDestroy` → `ctx.revert()` + `isla.destroy()` (p5 `remove()`). Cero fugas.
4. Escena inactiva pero montada (p. ej. Archivo bajo Edición): `isla.pause()` (`noLoop`). Nunca dos sketches pesados dibujando a la vez.
5. **Resize**: `ResizeObserver` sobre el mount, debounce 120 ms, `p.resizeCanvas` + repintado idempotente. Los sketches nunca leen `windowWidth`; leen su mount. El store `viewport` (`compacto | medio | cine`, `pointer: coarse|fine`) se pasa como param para que el sketch cambie densidad, no solo tamaño.
6. **`prefers-reduced-motion`**: `motion/reducedMotion.ts` expone `reduce`. Con `reduce`: grano estático (un frame), transiciones = crossfade 200 ms sin Flip, ScrollTrigger sin scrub de parallax, el grafo sin deriva. La rueda del iPod sigue funcionando; lo que se apaga es el ornamento, no el objeto.
7. **GSAP nunca anima el canvas**: anima `params` (números) que el sketch lee en `draw`. Así una timeline puede coreografiar DOM y píxeles con el mismo easing.

## 4. Ideas que potencian la pieza

Formato: qué es / escena / entra ahora vs enchufe / riesgo.

1. **Grano que respira con el dato.** Densidad y velocidad del grano y el tinte del gradiente salen de la paleta activa: oscuridad → grano más denso y frío; energy → grano más rápido; en el iPod cada canción resaltada tiñe el fondo un poco. / Todas, sobre todo iPod y Creación / **Entra al cimiento** (es el contrato de `paleta`) / Riesgo: si se exagera cansa; capar densidad y velocidad.

2. **Click wheel con tick sonoro y háptico.** Cada paso de la rueda dispara un tick de 3 ms sintetizado con WebAudio (sin assets) y `navigator.vibrate(5)` en móvil. Mute persistente en `preferencias`. / iPod / **Entra** (el módulo `ipod/sonido.ts` es 40 líneas) / Riesgo: autoplay policies; el AudioContext se crea en el primer gesto.

3. **Transiciones que cuentan algo (Director + Flip).** Home→Hook: los recortes se sacuden fuera de la "bolsa". Hook→Archivo: el año elegido en Anton gigante se encoge y se acopla al sintonizador. Archivo→Edición: chispazo de estática entre emisoras. Edición→iPod: la pantalla entera se encoge hasta el rectángulo del LCD y el iPod "arranca" con "PLAYWORLD ✱ · Ahora es tu momento" en 1-bit (aquí vive el "momento" del mockup, no como escena). iPod→Creación: la luz del LCD florece a pantalla completa. Creación→Colectiva: tu polaroid se levanta y vuela a su lugar en el grafo. / Entre escenas / **Entra** (el Director nace con soporte de "elemento que viaja") / Riesgo: Flip con elementos que cambian de contenedor; usar `Flip.fit` a un rect, no a un nodo.

4. **Carátulas como recortes de vidrio.** El collage de cada Edición se genera del dato: las 6–9 canciones más extremas del año (la más nostálgica, la más intensa, la más oscura…) como shards con `clip-path` poligonal, ligera rotación, grano encima y parallax al puntero. Cada shard dice por qué está ahí ("la más oscura de 2013"). / Home (v. reducida), Edición / **Entra** / Riesgo: 640 px por carátula pesa; usar la variante 300 px del CDN de Spotify (cambiar el prefijo `b273` → `00001e02`) y `loading=lazy`.

5. **LCD retro con backlight-dato.** El LCD es DOM (lista accesible, texto real) con un sketch p5 detrás: scanlines, ghosting leve, y en "Canción" un mini-visualizador de barras de su Audio DNA (happy/sad/energy/nostalgia). El color del backlight = color de la canción. / iPod / **Entra** (es `lcdFondo.sketch.ts`) / Riesgo: legibilidad en móvil; contraste mínimo 4.5:1 sobre el backlight.

6. **El hilo del grafo es una canción compartida.** Dos rastros se conectan solo si comparten al menos un `trackId`; grosor = cuántas comparten; hover/tap en el hilo muestra la canción. El grafo deja de ser "d3 con líneas bonitas" y pasa a ser archivo: lo que te une a otro es una canción real. / Colectiva / **Entra** / Riesgo: con pocos rastros hay pocos hilos; la semilla se cura para que compartan canciones.

7. **Posarse.** Cada rastro nuevo (el tuyo, o el de otro que llega por polling) cae desde arriba con easing de gravedad, rebota una vez, y emite una onda en el grano. Deriva perpetua con ruido Perlin para que el grafo nunca esté quieto. / Colectiva / **Entra** (polling 30 s); realtime Supabase = **enchufe** / Riesgo: muchas llegadas a la vez; cola con stagger.

8. **Sintonizar con inercia.** El Archivo se recorre con scroll y con el dial lateral (arrastre + rueda del mouse); los dígitos del año cambian como una frecuencia con blur direccional. En móvil el dial pasa a una cinta horizontal de años bajo el pulgar. / Archivo / **Entra** (ScrollTrigger); Lenis para inercia = **enchufe** / Riesgo: scroll-jacking; nunca bloquear el scroll nativo.

9. **Revelado fotográfico del Alma.** Creación arranca oscura y con grano grueso; en 1.6 s el grano se afina y la paleta del Alma "revela" la pantalla como una Polaroid; el nombre del Alma se escribe letra a letra en Anton. / Creación / **Entra** (`revelado.sketch.ts` + timeline) / Riesgo: si el usuario ya revisitó, acortar a 0.6 s.

10. **Nombra tu iPod.** En vez de "alias" como campo de formulario, al cerrar el iPod el LCD pregunta "Nombra tu iPod" (opcional, 12 caracteres, teclado del sistema). Es la única entrada de texto de toda la pieza y vive dentro de la metáfora. / iPod / **Entra** / Riesgo: texto ofensivo; filtro básico de palabras + moderación por borrado en Supabase.

11. **Drone ambiental por Alma.** Un pad sintetizado con WebAudio (dos osciladores + filtro) cuya frecuencia y brillo salen del Alma; casi inaudible, con mute. / Creación, Colectiva / **Enchufe posterior** / Riesgo: molesto si falla el mix; por eso no entra al cimiento.

**Se rechaza:**

- **Fragmentos de audio de las canciones**: la API de Spotify dejó de entregar `preview_url` a apps nuevas y el licenciamiento no es nuestro. Sonido = sintetizado o nada.
- **Grano por shader WebGL**: el canvas 2D a 12–20 fps ya da la textura; un shader entra solo si el perf lo exige (enchufe).
- **Cursor personalizado tipo púa/vinilo**: gimmick que muere en touch y molesta en a11y.
- **iPod en 3D / Three.js**: alcance lo excluye; la ilusión de objeto se logra con luz, sombra, rueda y clics.
- **Cover Flow real**: costoso y no aporta al perfilamiento; la lista LCD es la interacción.
- **Nube de géneros tipo Every Noise**: los tags de Spotify no están poblados en gran parte del archivo y es ilegible en móvil.
- **Cualquier pantalla nueva**: "Momento" del mockup se absorbe como boot del LCD; no hay octava escena.

## 5. Estructura de PLAYWORLD/

```
PLAYWORLD/
├─ ARCHITECTURE.md                 # este documento
├─ README.md                       # cómo correr, construir datos, desplegar
├─ package.json · vite.config.ts · svelte.config.js · tsconfig.json
├─ .env.example                    # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├─ index.html                      # un solo <div id="app">; fuentes self-hosted
│
├─ raw/                            # (gitignored) DATA_<año>/*.json + programacion/*.csv
├─ scripts/
│  ├─ build-archivo.ts             # raw → public/data/archivo/* (tracks por año, ediciones, percentiles)
│  ├─ build-pool.ts                # curaduría del pool del iPod (60–120 tracks, dnaCompleto)
│  └─ build-semilla.ts             # colectiva.json del mockup → src/rastros/semilla.json (+ SQL)
├─ supabase/
│  └─ schema.sql                   # tabla rastros, constraints, RLS, vista rastros_resumen, semilla
│
├─ public/
│  ├─ data/archivo/
│  │  ├─ ediciones.json            # 15 años: tesis, stats, hasDNA, collage (urls), conteo
│  │  ├─ tracks.2011.json · tracks.2013.json · tracks.2026.json   # lazy por año
│  │  ├─ pool.ipod.json            # lo que el iPod ofrece
│  │  └─ percentiles.json          # normalización para el motor de Almas
│  ├─ fonts/                       # Anton, Inter (woff2, OFL)
│  └─ assets/
│     ├─ recortes/                 # noria, manilla, festival… (webp + png fallback)
│     └─ ui/                       # asterisco.svg, texturas del iPod
│
└─ src/
   ├─ main.ts · App.svelte · app.css
   ├─ piel/                        # LA piel aprobada, como tokens. Se potencia, no se rediseña.
   │  ├─ tokens.css                # --c1..--c3 (gradiente durazno/magenta/índigo), --ink, easings, z-index
   │  ├─ tipografia.css            # Anton (título), Inter (UI), escalas clamp()
   │  ├─ vidrio.css                # .vidrio (collage de vidrio esmerilado), .shard
   │  ├─ grano.css                 # posicionamiento del canvas de grano, blend
   │  └─ motion.css                # @media reduce, utilidades will-change
   │
   ├─ escenas/
   │  ├─ director/
   │  │  ├─ Escena.ts              # contrato: ruta, entrada(), salida(), viajero?
   │  │  ├─ Director.svelte        # monta escena activa, orquesta salida→entrada
   │  │  ├─ router.ts              # History API, 7 rutas, deep-link con año
   │  │  └─ transiciones.ts        # timelines nombradas (bolsa, sintonia, lcdBoot, revelado, posarse)
   │  ├─ home/       Home.svelte · Collage.svelte · home.copy.json
   │  ├─ hook/       Hook.svelte · hook.copy.json
   │  ├─ archivo/    Archivo.svelte · Sintonizador.svelte · PasoAnio.svelte · archivo.copy.json
   │  ├─ edicion/    Edicion.svelte · CollageEdicion.svelte · ClimaEmocional.svelte
   │  ├─ ipod/       IpodEscena.svelte          # solo coloca el módulo ipod/ y escucha oncerrar
   │  ├─ creacion/   Creacion.svelte · Revelado.svelte · EcosDelArchivo.svelte
   │  └─ colectiva/  Colectiva.svelte · Grafo.svelte · FiltroAlmas.svelte · FichaRastro.svelte
   │
   ├─ ipod/                        # MÓDULO DE PRIMERA CLASE. No sabe de escenas.
   │  ├─ Ipod.svelte               # carcasa, layout rueda+LCD, modo de control
   │  ├─ ClickWheel.svelte         # geometría, ángulo→pasos, botones (menu, select, ‹‹, ››, ▶)
   │  ├─ Lcd.svelte                # DOM accesible + SketchSlot lcdFondo
   │  ├─ maquina.ts                # máquina de estados: pila de pantallas, cursor, selección
   │  ├─ ipod.store.ts             # estado reactivo del iPod (runes)
   │  ├─ pantallas/  Menu.svelte · Lista.svelte · Cancion.svelte · MiIpod.svelte · Nombrar.svelte
   │  ├─ entrada/    rueda.ts · toque.ts · teclado.ts     # tres fuentes, un solo evento `paso|select|back`
   │  ├─ sonido.ts · haptics.ts
   │  └─ ipod.copy.json
   │
   ├─ sketches/                    # p5 instance mode, y nada más aquí
   │  ├─ p5Isla.ts · SketchSlot.svelte · registro.ts · paleta.ts
   │  ├─ grano.sketch.ts           # global, un solo montaje en App
   │  ├─ lcdFondo.sketch.ts        # backlight-dato, scanlines, mini-visualizador
   │  ├─ collageVidrio.sketch.ts   # grano local sobre shards, brillo al puntero
   │  ├─ revelado.sketch.ts        # Creación
   │  └─ grafo.sketch.ts           # Colectiva (render); layout viene de colectiva/layout.ts
   │
   ├─ motion/
   │  ├─ gsap.ts                   # registerPlugin(Flip, ScrollTrigger) una vez
   │  ├─ contexto.ts               # helper gsap.context por escena
   │  ├─ presets.ts                # easings y duraciones de la casa
   │  ├─ scroll.ts                 # ScrollTrigger (+ Lenis como enchufe)
   │  └─ reducedMotion.ts
   │
   ├─ datos/
   │  ├─ tipos.ts                  # Track, AudioDNA, Edicion
   │  ├─ archivo.ts                # loader lazy: ediciones + tracks por año (cache)
   │  ├─ pool.ts                   # pool del iPod filtrable por año / mood
   │  └─ color.ts                  # dna → paleta (color = dato)
   │
   ├─ almas/
   │  ├─ almas.ts                  # 6 definiciones: id, nombre, texto, paleta, grano, pesos
   │  ├─ motor.ts                  # normalizar → puntuar → rankear → ecos del archivo
   │  └─ textos.json
   │
   ├─ rastros/
   │  ├─ tipos.ts                  # Rastro, RastroNuevo
   │  ├─ puerto.ts                 # interface RastrosPort { listar, guardar }
   │  ├─ adaptadores/ semilla.ts · local.ts · supabase.ts
   │  ├─ store.ts                  # compuesto: semilla ∪ vivos ∪ propio, con fallback
   │  ├─ semilla.json              # 12 rastros curados
   │  └─ sesion.ts                 # rastro propio en localStorage + pendientes
   │
   ├─ estado/
   │  ├─ recorrido.ts              # año → selección → alma → rastro (mirror en sessionStorage)
   │  ├─ viewport.ts               # compacto|medio|cine, pointer coarse|fine
   │  └─ preferencias.ts           # mute, modoControl, reduce
   │
   └─ ui/                          # átomos con la piel: Marca, Asterisco, Boton, Chip, Eyebrow
tests/                             # vitest: almas.motor, ipod.maquina, rastros.store, router
```

## 6. Mapa de escenas

Tres modos de viewport que las escenas leen del store `viewport`: **compacto** (< 768 px), **medio** (768–1023), **cine** (≥ 1024). Detalle de breakpoints en §11.

| # | Escena | Ruta | Módulo | Piel | JSON | ¿p5? | ¿GSAP? | Desktop (cine) | Móvil (compacto) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Home** | `/` | `escenas/home` | Gradiente completo, título Anton a 14vw, asterisco, collage de vidrio | `home.copy.json`, `ediciones.json` (para saber qué años brillan) | Grano global; `collageVidrio` en slot `capa` | Entrada "bolsa" (recortes caen con stagger), parallax al puntero, salida hacia Hook | Collage libre de 6–8 recortes alrededor del play; hero 100dvh + collage abajo (scroll corto) | Collage en pila de 4 recortes con offset, título a 18vw en dos líneas, sin parallax (usa `deviceorientation` si hay permiso, si no, deriva lenta) |
| 2 | **Hook** | `/hook` | `escenas/hook` | Pregunta en Anton a pantalla, chips de vidrio | `hook.copy.json` | No (grano global) | Pregunta se escribe; chip elegido crece y se convierte en el año del sintonizador (Flip) | Chips en fila | Chips en grid 2 columnas, pregunta a 12vw; el año elegido ocupa la pantalla antes de viajar |
| 3 | **Archivo** | `/archivo?y=2013` | `escenas/archivo` | Tipografía de año tipo Enrock; 2011/2013/2026 opacos, resto fantasma; dial radio | `archivo.copy.json`, `ediciones.json` | Grano global; opcional `estatica` en cambio de año (slot `frente`) | ScrollTrigger: año actual pinned, dígitos con blur; dial sincronizado | Dial vertical fijo a la izquierda + scroll vertical de 17 pasos | Dial pasa a **cinta horizontal** inferior (thumb zone); pasos a pantalla con snap; tap en año = abrir |
| 4 | **Edición** | `/edicion/2013` | `escenas/edicion` | Año gigante + 3 líneas de tesis + collage de shards + "clima emocional" (barras mudas / nube de puntos) | `ediciones.json` + `tracks.<año>.json` (lazy) | `collageVidrio`; opcional nube de puntos en p5 | Entrada "sintonía"; shards entran en stagger; salida hacia el LCD (Flip a rect) | Póster a dos columnas: tesis + collage; clima abajo | Una columna: año, tesis, collage en carrusel horizontal de shards, clima como franja; años sin DNA muestran plantilla "memoria en construcción" |
| 5 | **iPod** | `/ipod` | `escenas/ipod` + módulo `ipod/` | Carcasa clara (blanco cálido/gris), LCD con backlight-dato, rueda | `pool.ipod.json`, `ipod.copy.json` | `lcdFondo` dentro del LCD | Boot del LCD (1-bit), pulso en cada paso, "cerrar" que se contrae | iPod centrado ~360×600, rueda con puntero; a la derecha, contexto flotante (carátula grande y DNA de la canción resaltada) | iPod ocupa toda la pantalla: LCD arriba (55%), ruleta abajo en la zona del pulgar; **modo toque** por defecto (tap en lista + flick de ruleta) |
| 6 | **Creación** | `/creacion` | `escenas/creacion` | Paleta del Alma toma el gradiente; nombre en Anton; 5 tuyas + 4 ecos del archivo (rejilla 3×3) | `almas/textos.json`, `pool.ipod.json` (ecos) | `revelado` en slot `fondo` | Revelado 1.6 s; celdas de la rejilla entran en stagger; polaroid "tú" lista para viajar | Rejilla 3×3 con carátulas | Rejilla 3×3 compacta (carátulas 96 px) o lista si < 360 px; texto del Alma primero |
| 7 | **Colectiva** | `/colectiva` | `escenas/colectiva` | Campo oscuro-índigo del gradiente, polaroids de vidrio, hilos finos, filtros como chips | `semilla.json` + API | `grafo.sketch.ts` (render) | "Posarse" del tuyo y de los que llegan; deriva perpetua; hilos que se encienden al filtrar | Grafo a pantalla, ficha lateral al tocar un rastro | Grafo a pantalla con pinch/drag; ficha como bottom-sheet; filtros en fila scrollable arriba; LOD agresivo |

**Qué se toma de playworld-home (look/copy) y qué se inventa (código):**

- **Se toma**: gradiente exacto de `shell.css` (radiales + lineal 158°), `--ink` y derivados, Anton + Inter con las escalas `clamp()`, el asterisco `✱`, el eyebrow con `letter-spacing: 0.44em`, todo el copy de los JSON (`home`, `hook`, `archivo`, `ipod`, `colectiva`, textos de Almas), el orden emocional de las escenas, la idea del dial-radio, la rejilla 3×3 de Creación, la ficha lateral de Colectiva, `grain.js` como referencia de qué textura queremos (no su código).
- **Se inventa**: todo el código. Director en vez de `body.classList`; rutas en vez de `#hash=`; componentes en vez de `querySelector('[data-*]')`; p5 en vez de canvas 2D a mano para el grano; GSAP en vez de `setTimeout(650)`; el iPod completo (el del mockup es un drop-zone); el grafo (el del mockup es SVG con posiciones fijas y `nearestLinks` por distancia en pantalla, no por dato); el motor de Almas normalizado; toda la persistencia.

## 7. iPod como sistema

**Metáfora**: un iPod Classic. Rueda, botón central, cuatro botones cardinales (MENU, ‹‹, ››, ▶‖), LCD de 4:3 con lista. Ilusión de objeto: luz, sombra suave, carcasa con leve textura, LCD con backlight que responde al dato.

**Pantallas (pila, `maquina.ts`):**

```
Boot ("PLAYWORLD ✱ · Ahora es tu momento")
└─ Menú principal
   ├─ Por año            → Lista de años con DNA → Lista de canciones → Canción
   ├─ Por mood           → [Noche, Lágrima, Fiesta, Calma, Furia, Rareza] → Lista → Canción
   ├─ Al azar            → Canción (baraja del pool)
   ├─ Mi iPod (n/5)      → Lista de elegidas → Canción (con "Quitar")
   └─ Cerrar el iPod     → (solo con 5) Nombrar → emite `cerrar(seleccion)`
```

`Canción` muestra carátula 64 px, artista, título, año, mini-visualizador DNA, y la acción central **"Meter al iPod"** (o "Quitar" si ya está). El LCD lleva siempre una barra superior con `n / 5`. El año del Hook (`yearHint`) preselecciona "Por año" y ordena el pool (primero las del año elegido), pero no limita: se puede curar con canciones de cualquier año con DNA.

**Interacción — tres fuentes de entrada, un solo evento:**

```ts
// ipod/entrada — todas emiten lo mismo
type EntradaIpod =
  | { tipo: 'paso'; delta: 1 | -1 }        // rueda, ruleta, flechas, wheel del mouse
  | { tipo: 'select' }                      // centro, Enter, tap en ítem resaltado
  | { tipo: 'back' }                        // MENU, Backspace/Esc, swipe derecha en LCD
  | { tipo: 'saltar'; a: number };          // tap directo en un ítem (modo toque)
```

- **Modo rueda** (pointer fino, por defecto en cine/medio): `pointerdown` en el anillo captura; el ángulo acumulado respecto al centro se convierte en pasos cada 18° (20 pasos por vuelta). `wheel` del mouse también da pasos. Cada paso: tick sonoro + resaltado. Teclado completo (flechas, Enter, Esc) para accesibilidad; la rueda tiene `role="slider"` con `aria-valuenow` = índice.
- **Modo toque** (pointer coarse, por defecto en compacto): la misma rueda funciona como **ruleta con inercia** (flick → velocidad angular → pasos que decaen con fricción), y además la lista del LCD acepta **tap** para saltar a un ítem y **swipe hacia la derecha** para volver. Doble vía porque la rueda clásica en touch es imprecisa; la ruleta hace que siga siendo divertida.
- Toggle "rueda / toque" en `preferencias`; el sistema elige por `pointer: coarse` pero el usuario manda.
- Haptics: `vibrate(5)` por paso, `vibrate([10, 30, 10])` al meter una canción. Sonido: tick, "clic" grave al select, dos notas al meter, acorde al cerrar. Todo sintetizado; mute persistente.

**Estado (`ipod.store.ts`):**

```ts
type EstadoIpod = {
  pila: Pantalla[];              // stack de navegación; la última es la visible
  cursor: number;                // índice resaltado en la pantalla visible
  seleccion: Track[];            // 0..5, orden de inserción
  capacidad: 5;
  resaltada: Track | null;       // alimenta paleta (backlight) y el contexto flotante
  modoControl: 'rueda' | 'toque';
  alias: string;                 // 0..12 chars, se pide al cerrar
};
```

**Cómo vuelca al Alma y al rastro:**

`Cerrar el iPod` solo se habilita con 5 canciones. Al confirmar el nombre (opcional), el módulo emite `oncerrar({ trackIds, tracks, alias, yearHint, cerradaEn })`. La escena `IpodEscena` hace tres cosas, en este orden: `recorrido.seleccion = s` → `recorrido.alma = motor.rankear(s.tracks, percentiles)[0]` → `rastros.guardar({ alias, almaId, trackIds, yearHint })` (async, no bloquea) → Director navega a `/creacion`. El iPod no sabe qué es un Alma; solo entrega canciones.

**Límites (ilusión de objeto, no firmware):** no reproduce audio de las canciones; no hay Cover Flow, ajustes, ni juegos; la pila tiene profundidad máxima 4; el pool son 60–120 canciones curadas con DNA completo, no 9.013; la "batería" y la "hora" del LCD son decorado estático; no hay hold switch. Si algo hay que recortar, se recorta "Por mood" y "Al azar", nunca la rueda ni "Mi iPod".

## 8. Modelo de datos

```ts
type AudioDNA = {
  happy: number; sad: number; relaxed: number; aggressive: number; nostalgia: number;
  oscuridad: number; energy: number; danceability: number; tempo: number;
  spectralFlatness: number; approachability?: number; engagement?: number;
  scale: 'Mayor' | 'Menor'; keyNote: string;
};
type Track = {
  id: string;                 // "CCS_7" (sin .json)
  year: number; artist: string; track: string;
  art: string | null;         // URL Spotify CDN; el front cambia el prefijo de tamaño
  spotifyId?: string; genre?: string;
  dna: AudioDNA; dnaPct: Partial<Record<keyof AudioDNA, number>>;   // percentil 0–100 en el archivo
  dnaCompleto: boolean;       // false si nostalgia/oscuridad venían null
};
type Edicion = {
  year: number; hasDNA: boolean; conteo: number;
  tesis: string[];            // 3 líneas (copy curado, no generado)
  stats: { mediana: Partial<AudioDNA>; pctMenor: number; tempoMedio: number };
  collage: { trackId: string; porQue: string }[];   // 6–9 shards con su razón
  caption: string;
};
type AlmaId = 'noctambula' | 'melancolica' | 'exploradora' | 'colectiva' | 'intensa' | 'nostalgica';
type Alma = {
  id: AlmaId; nombre: string; corto: string; texto: string;
  paleta: { c1: string; c2: string; c3: string }; grano: { densidad: number; velocidad: number };
  puntuar: (m: MediaDNA, ctx: ContextoSeleccion) => number;   // 0–100
};
type Seleccion = { trackIds: string[]; tracks: Track[]; yearHint: number | null; alias: string; cerradaEn: string };
type Rastro = {
  id: string; alias: string | null; almaId: AlmaId; trackIds: string[];
  yearHint: number | null; createdAt: string; origen: 'semilla' | 'visitante';
};
```

**Reglas de las 6 Almas** (`almas/motor.ts`). Se toma la versión de `mockup-fep/juego.html` (mejor que la de `ipod.json`, porque tiene términos de "cercanía a un valor", no solo pesos lineales) con un cambio no negociable: **se puntúa sobre percentiles del archivo, no sobre valores crudos.** En el archivo real la nostalgia vive entre 60 y 95 en casi todo; sin normalizar, Nostálgica y Melancólica ganarían siempre. Sea `m` la media de `dnaPct` de las 5 canciones:

| Alma | Fórmula (0–100) |
|---|---|
| Noctámbula | `0.34·oscuridad + 0.33·danceability + 0.33·energy` |
| Melancólica Feliz | `0.55·nostalgia + 0.45·(100 − |happy − 50|)` |
| Exploradora | `0.4·(0.5·spectralFlatness + 0.5·(100 − |energy − 50|)) + 0.6·diversidad` donde `diversidad = 100·(0.45·artistasÚnicos/5 + 0.25·añosÚnicos/añosDisponibles + 0.30·min(1, σ(spectralFlatness)/25))`; si hay `approachability`, se suma `0.2·(100 − approachability)` reescalando |
| Colectiva | `0.55·relaxed + 0.45·(100 − |energy − 40|)` |
| Intensa | `0.5·aggressive + 0.5·energy` |
| Nostálgica | `0.62·nostalgia + 0.38·(100 − tempo)` (tempo ya es percentil: lento = alto) |

Resultado: ranking de las 6. La primera es **el Alma**; la segunda es **el eco** (se muestra en Creación como "con algo de…"). Los "ecos del archivo" (4 canciones que completan la rejilla 3×3) son las de mayor `alma.puntuar(track)` fuera de la selección. Los pesos viven en `almas.ts` como datos, no en código disperso, para que Manuela pueda calibrarlos; `tests/almas.motor.test.ts` fija que cinco canciones de Carla Morrison dan Nostálgica y cinco de Crystal Castles a 100 de energy dan Intensa o Noctámbula.

**Mock vs real del archivo musical:**

- **Real con DNA**: 2011 (carpeta `DATA_2011`, ~260 registros), 2013 (~262, ya en `playworld-home/data/edicion/2013.json`), 2026 (~644 según alcance). El pipeline procesa lo que haya en `raw/DATA_<año>/`.
- **Sistema sin dato**: los otros 12 años existen en `ediciones.json` con `hasDNA: false`, tesis genérica curada y sin collage. El Archivo los muestra en fantasma; la Edición muestra la plantilla "memoria en construcción". Cuando llegue un `DATA_<año>/`, correr el script y el año se enciende solo.
- **Registros con `nostalgia: null` / `oscuridad: null`** (existen: Diamante Eléctrico, Foals, Two Door…): se marcan `dnaCompleto: false`, se imputan por mediana del año para stats, y **no entran al pool del iPod**.

**Pipeline (`scripts/build-archivo.ts`, Node + tsx, se corre a mano, no en runtime):**

1. Lee `raw/DATA_<año>/*.json` (un track por archivo, formato Audio DNA) y, si existen, los CSV de programación (banda, escenario, hora, país) para enriquecer `Edicion`.
2. Normaliza: `id` sin `.json`, `art` como URL base (prefijo de tamaño lo decide el front), `genre` desde `genre`/`spotifyGenres[0]`.
3. Calcula **percentiles por métrica sobre todo el archivo** → `percentiles.json` y `dnaPct` por track.
4. Emite `tracks.<año>.json` compactos (~180 B/track; 9.013 tracks ≈ 1.6 MB en total, pero nunca se carga todo: lazy por año).
5. Emite `ediciones.json` (stats, `pctMenor`, collage = 6–9 extremos con su `porQue`).
6. `build-pool.ts`: elige 60–120 tracks con `dnaCompleto`, cubriendo las 6 Almas y todos los años con DNA, con carátula válida → `pool.ipod.json`.
7. `build-semilla.ts`: convierte `playworld-home/data/colectiva.json` (9 players) a 12 `Rastro` con `origen: 'semilla'`, garantizando canciones compartidas entre ellos → `semilla.json` + `INSERT`s en `schema.sql`.

**Rastro: semilla vs escrito por visitantes.** Mismo shape. `origen` distingue. Los de semilla tienen `id` legible (`semilla-luna`), los vivos `uuid` del servidor. El grafo no los trata distinto salvo que la semilla nunca se marca como "tú". La semilla vive en el bundle **y** en la tabla (para que el `GET` sea coherente); el store deduplica por `id`.

## 9. Estado del recorrido + persistencia

**Recorrido (`estado/recorrido.ts`)** — sesión, obligatorio:

```ts
type Recorrido = {
  yearHint: number | null;      // Hook / Archivo
  edicionAbierta: number | null;
  seleccion: Seleccion | null;  // al cerrar el iPod
  alma: { principal: AlmaId; eco: AlmaId; puntajes: Record<AlmaId, number> } | null;
  rastroPropio: Rastro | null;  // cuando se guardó (o se encoló)
};
```

Se espeja en `sessionStorage` en cada cambio: un refresh en `/creacion` no te manda al Home ni pierde el Alma. El Director valida prerrequisitos por ruta (entrar a `/creacion` sin `alma` redirige a `/ipod`; a `/ipod` sin `yearHint` funciona igual, solo sin preselección).

**Tres capas, sin mezclar:**

| Capa | Dónde | Qué guarda | Para qué |
|---|---|---|---|
| 1. Sesión | store + `sessionStorage` | `Recorrido` completo | Refresh, back/forward, deep-link |
| 2. Local | `localStorage['playworld.rastro']` + `['playworld.pendientes']` | Último `Rastro` propio de este browser; POSTs fallidos | "Volver a tu creación" desde Home; marcar "tú" en el grafo en visitas futuras; reintento |
| 3. Compartido | Supabase vía `RastrosPort` | Todos los rastros (semilla + visitantes) | Grafo vivo |

**Puerto y adaptadores (`rastros/`):**

```ts
export interface RastrosPort {
  listar(opts?: { limite?: number; almaId?: AlmaId }): Promise<Rastro[]>;
  guardar(nuevo: RastroNuevo): Promise<Rastro>;      // devuelve con id y createdAt del servidor
  resumen?(): Promise<Record<AlmaId, number>>;       // conteo por Alma (para densidad / filtros)
}
// adaptadores/semilla.ts  → listar() desde semilla.json; guardar() lanza NoEscribible
// adaptadores/supabase.ts → fetch a /rest/v1/rastros con apikey anon
// store.ts (compuesto)    → listar = dedupe(semilla ∪ remoto ∪ propioLocal); guardar = remoto con fallback a pendientes
```

Cambiar de JSON local a API (o a Cloudflare, o a nada) es cambiar el adaptador que recibe `store.ts`. El grafo importa `rastros/store.ts` y nada más.

**Servicio elegido: Supabase.** Una tabla, sin SDK (PostgREST + `fetch`), panel para que Manuela borre spam. `supabase/schema.sql`, en esencia:

```sql
create table rastros (
  id uuid primary key default gen_random_uuid(),
  alias text check (alias is null or char_length(alias) between 1 and 12),
  alma_id text not null check (alma_id in ('noctambula','melancolica','exploradora','colectiva','intensa','nostalgica')),
  track_ids text[] not null check (array_length(track_ids, 1) between 3 and 7),
  year_hint smallint check (year_hint between 2010 and 2026),
  origen text not null default 'visitante',
  created_at timestamptz not null default now()
);
alter table rastros enable row level security;
create policy "leer" on rastros for select to anon using (true);
create policy "posar" on rastros for insert to anon with check (origen = 'visitante');
-- sin update ni delete para anon; vista rastros_resumen: alma_id, count(*)
```

**Contrato lógico:**

- `GET /rastros?limite=500&almaId?` → `Rastro[]` ordenados por `createdAt desc`. Con PostgREST: `GET /rest/v1/rastros?order=created_at.desc&limit=500&alma_id=eq.X`.
- `POST /rastros` body `{ alias?, almaId, trackIds, yearHint? }` → `201 Rastro`. Con PostgREST: `POST /rest/v1/rastros` con `Prefer: return=representation`. El front valida antes (alias ≤ 12, 5 ids del pool) y **solo hace un POST por cierre de iPod**; la DB rechaza lo que no cumpla constraints.
- `GET /rastros/resumen` → `{ almaId: n }` vía la vista.

**Hidratación del grafo:** al entrar a Colectiva: (1) pinta **inmediatamente** semilla + `rastroPropio` (cero espera, día 1 no vacío); (2) `listar()` remoto en paralelo; al llegar, hace merge por `id`, y los nuevos "se posan" con stagger; (3) polling cada 30 s mientras la escena esté activa (`visibilitychange` lo pausa); (4) realtime de Supabase queda como enchufe en el adaptador.

**Marcar "tú":** el `id` que devolvió el `POST` (o el `id` temporal `local-<uuid>` si está pendiente) se guarda en `sesion.ts`. En el grafo, el nodo cuyo `id === propio.id` se renderiza con badge "Tú", borde de luz, aparece último y es el que "se posa" con la animación grande. En visitas futuras, si `localStorage` tiene un rastro, ese nodo se marca "Tú (antes)".

**Si la API falla:** el documental no se cae. `guardar()` atrapa el error, guarda el rastro en `pendientes` con id local, devuelve ese rastro, y Creación/Colectiva funcionan igual. El grafo muestra semilla + local con un aviso mínimo en el pie: "el archivo está sin señal · tu rastro quedó guardado aquí". En el próximo arranque, `sesion.ts` reintenta los pendientes. `listar()` fallido = semilla + local, sin spinner infinito (timeout 4 s).

## 10. Grafo colectivo

**Cómo se visualiza:** **layout con d3-force (headless) + render en p5** (`grafo.sketch.ts`) + **DOM encima para lo que debe ser accesible**: filtros por Alma (chips), ficha del rastro (`FichaRastro.svelte`, lateral en cine / bottom-sheet en compacto) y una lista oculta `aria` con los rastros visibles para lectores de pantalla. Hit-testing en el sketch (nodo más cercano dentro del radio); el clic dispara `onrastro(id)` hacia Svelte.

Por qué p5 y no SVG/DOM: 50 polaroids en DOM está bien, 5.000 no; y queremos grano local, deriva y ondas que en SVG son caras y en p5 son tres líneas.

**Fuerzas:** `forceManyBody` suave (repulsión), `forceCollide` por radio, `forceX/Y` hacia un **centro por Alma** (seis campos dispuestos en anillo, así el grafo tiene geografía emocional legible sin leyenda), y `forceLink` solo en los **hilos por canción compartida** (§4.6), con fuerza proporcional a canciones en común. El layout se simula 300 ticks al cargar y luego se congela; las llegadas nuevas se insertan cerca de su campo y reactivan 60 ticks locales. Encima, deriva Perlin de ±3 px para que respire.

**Filtro por Alma:** chips "Todas · Noctámbula · … ". Al filtrar, los demás nodos bajan a 12 % de opacidad y sus hilos se apagan; el campo elegido se acerca (zoom suave GSAP sobre `params.zoom`). Chip "los de la mía" preseleccionado cuando vienes de Creación, con "los de otras" a un tap.

**Densidad (no reventar):**

| Rastros | Estrategia |
|---|---|
| ≤ 60 | Cada rastro es una polaroid de vidrio (carátula 64 px de su primera canción + alias + Alma), hilos completos. |
| 60–400 | Polaroids solo para: tú, los 24 más recientes, y los 4 más cercanos al puntero. El resto son "fichas" (rectángulos 14×18 px con el color de su Alma y grano). Hilos solo con ≥ 2 canciones compartidas. |
| > 400 | El servidor entrega `limite=500` más recientes + `resumen` por Alma. El resto se representa como **densidad**: cada campo de Alma tiene un halo de grano cuya intensidad = conteo real ("2.318 Noctámbulas"). Nadie ve 5.000 nodos; ve un cielo con seis constelaciones y las 500 estrellas más nuevas. |

Carátulas del grafo se cargan con `createImg` bajo demanda y caché LRU de 80; nunca se piden 500 imágenes.

**Archivo, no red:** no hay follows, likes, comentarios, perfiles, feed ni orden por popularidad. La ficha muestra alias (o "alguien"), Alma, sus 5 canciones y, si compartes alguna, "comparten: Plague". Nada más. El único "vínculo" posible entre dos personas es una canción del archivo.

**Ideas para que se sienta vivo:** posarse con gravedad y onda en el grano; polling que trae recién llegados ("hace 2 min se posó una Intensa" en el pie, sin notificación intrusiva); latido: el borde de cada polaroid pulsa a un BPM derivado del tempo medio de su rastro (imperceptible en masa, evidente al hacer foco); al pasar por un hilo, suena un tick con el tono de la canción compartida (derivado de `keyNote`; enchufe si el mute está activo); "tú" tarda 900 ms en encontrar su sitio y busca a su Alma antes de posarse.

## 11. Responsive y dirección de arte

**Breakpoints** (en `piel/tokens.css` como custom media y en `estado/viewport.ts` como store, porque los sketches y el iPod necesitan saberlo en JS, no solo en CSS):

| Nombre | Rango | Pointer típico | Qué cambia |
|---|---|---|---|
| **compacto** | < 768 px | coarse | iPod a pantalla completa en modo toque; dial → cinta horizontal; ficha → bottom-sheet; collage en pila; tipografía Anton a 16–20vw en dos líneas; grano 12 fps |
| **medio** | 768–1023 px | mixto | Layout de cine con márgenes reducidos; iPod centrado 320×540; el modo de control lo decide `pointer` |
| **cine** | ≥ 1024 px | fine | Todo el aparato: parallax, contexto flotante del iPod, ficha lateral, dial vertical |
| **ancho** | ≥ 1440 px | fine | Solo escalas tipográficas y densidad de collage; nada nuevo |

Umbral de altura: `< 640 px de alto` (móvil horizontal) → el iPod pasa a rueda a la izquierda y LCD a la derecha; Hook reduce chips a una fila scrollable.

**Qué nunca se pierde**: el gradiente y el grano; Anton para lo grande e Inter para lo pequeño; el asterisco; el color-dato; la rueda del iPod (cambia de modo, no desaparece); las 7 escenas en el mismo orden; el grafo con hilos; "tú" marcado; las transiciones con sentido (en reduced-motion se vuelven cortes limpios, pero el Director sigue existiendo).

**Qué se simplifica en móvil:**

- **iPod**: modo toque por defecto, LCD más alto (55 % de la pantalla), sin contexto flotante (la carátula grande vive dentro de `Cancion`), botones cardinales más grandes, ruleta con inercia.
- **Grafo**: LOD arranca un nivel antes (polaroids solo para ≤ 30), pinch-zoom y drag nativos en el canvas (`touch-action: none` solo en el stage), ficha como bottom-sheet con las 5 canciones, deriva Perlin desactivada por batería.
- **Archivo**: sin blur direccional (caro en móvil), snap por paso, dial horizontal.
- **Edición**: shards en carrusel con `scroll-snap`, no dispersos.
- **Home**: 4 recortes, sin parallax por puntero.

**Performance (p5 + scroll + carátulas + grafo):**

- Un solo grano global, `pixelDensity(1)`, tile de 128 px reutilizado, 12–20 fps por reloj (no por `frameRate` de p5 que fuerza redibujo).
- Máximo **dos sketches activos** a la vez (grano + el de la escena). Las islas de escenas no visibles hacen `pause()`.
- Carátulas: prefijo `4851` (64 px) en listas/grafo, `00001e02` (300 px) en collage, `b273` (640) solo para la carátula grande del iPod en cine. `loading="lazy"`, `decoding="async"`.
- Tracks por año lazy y en caché; el pool del iPod (< 40 KB) se precarga al entrar al Archivo.
- ScrollTrigger solo en Archivo; `will-change` solo en lo que GSAP anima ahora; sin `backdrop-filter` en más de 8 elementos simultáneos en compacto (vidrio se falsea con gradiente semitransparente + grano).
- Fuentes self-hosted en woff2 con `font-display: swap` y subset latino.
- Presupuesto: JS inicial < 250 KB gz (p5 ~ 90, GSAP + Flip + ScrollTrigger ~ 40, d3-force ~ 8, Svelte + app ~ 40); LCP < 2.5 s en 4G; 60 fps en cine y ≥ 40 fps en un Android medio con el grafo en LOD.

## 12. Contrato para Grok 4.6

**Reglas inviolables:**

1. **No rediseñar la piel.** Gradiente, grano, Anton + Inter, collage de vidrio, asterisco: se toman de `playworld-home/css/shell.css` como tokens y se potencian. Nada de kraft, nada de dashboard oscuro, nada de Tailwind/shadcn/MUI.
2. **No dashboard.** Ninguna escena muestra KPIs, radares con leyenda, tablas ni "cards de métricas". El dato se vuelve color, tamaño, textura, texto en prosa.
3. **p5 no es framework.** Solo instance mode, solo dentro de `sketches/`, solo montado por `p5Isla`. Un sketch no toca DOM, no enruta, no hace fetch.
4. **GSAP anima números y DOM; nunca píxeles.** Cada escena usa `gsap.context` y lo revierte al destruir. Flip solo vía el Director.
5. **Sin SSR de cimiento.** Vite + Svelte SPA. Sin SvelteKit, sin Next.
6. **El iPod es usable**, no un drop-zone: rueda con pasos, pila de menús, "Mi iPod", cierre con 5, dos modos de control, teclado accesible. Vive en `src/ipod/` sin importar nada de `escenas/`.
7. **Responsive desde el día 1.** Cada componente se escribe compacto-primero y se abre a cine. Los sketches reciben `viewport` y ajustan densidad. Nunca `transform: scale()` del layout de escritorio.
8. **Rastros anónimos.** Sin email, login, nombre real, cookies de tracking ni "quién eres". Alias ≤ 12 opcional. Un POST por cierre de iPod.
9. **Grafo vivo con semilla.** Día 1 muestra 12 rastros curados; cada cierre escribe uno real; `GET` pinta; "tú" se distingue; filtro por Alma; hilos = canciones compartidas. Sin follows, likes, comentarios, feed.
10. **Sin auth. Sin backend propio.** Supabase con anon key y RLS. Nada de servidores Node, funciones serverless ni moderación de texto largo.
11. **Siete escenas.** Ninguna octava. "Momento" es el boot del LCD. Las ideas de §4 marcadas "entra" se implementan como capas (sketch, timeline, adaptador); las "enchufe" se dejan con su punto de extensión listo pero vacío.
12. **Color = dato.** Ningún color de Alma o de canción se escribe a mano en una escena; sale de `datos/color.ts` y `almas/almas.ts` vía `paleta`.
13. **Copy en JSON**, nunca en el template. Se parte del copy del mockup.
14. **playworld-home no se copia**: ni su HTML, ni `main.js`, ni `#hash`, ni `body.classList`, ni `setTimeout` como transición.

**Checklist de bootstrap del repo vacío `PLAYWORLD/`:**

- [ ] `npm create vite@latest . -- --template svelte-ts`; añadir `gsap`, `p5`, `@types/p5`, `d3-force`, `@types/d3-force`, `vitest`; TypeScript estricto.
- [ ] Copiar este documento como `ARCHITECTURE.md`; escribir `README.md` con: correr, construir datos, variables de entorno, desplegar.
- [ ] Self-host Anton e Inter en `public/fonts/` (OFL); `piel/tokens.css` con el gradiente y tokens extraídos de `shell.css`; `tipografia.css`, `vidrio.css`, `grano.css`, `motion.css`.
- [ ] `App.svelte` con el grano global (`p5Isla` + `grano.sketch.ts`) y el `Director` montado. `prefers-reduced-motion` respetado desde este commit.
- [ ] `escenas/director/`: contrato `Escena`, `router.ts` (7 rutas, History API, deep-link `?y=`), `Director.svelte`, `transiciones.ts` con las 6 transiciones nombradas (inicialmente crossfade; se enriquecen después).
- [ ] Las 7 escenas como componentes vacíos con su copy JSON del mockup y su ruta funcionando. Recorrido completo navegable con placeholders antes de cualquier efecto.
- [ ] `estado/recorrido.ts` (+ mirror sessionStorage), `estado/viewport.ts`, `estado/preferencias.ts`.
- [ ] `scripts/build-archivo.ts` + `build-pool.ts` sobre `raw/DATA_2011`, `DATA_2013`, `DATA_2026`; commit de `public/data/archivo/*` generado. `raw/` en `.gitignore`.
- [ ] `almas/almas.ts` + `motor.ts` con percentiles; test que fija los dos casos extremos.
- [ ] `src/ipod/` completo: `maquina.ts` con test, `ClickWheel`, `Lcd`, pantallas, entrada rueda/toque/teclado, sonido, haptics. Probar en un móvil real antes de seguir.
- [ ] `rastros/`: tipos, puerto, `semilla.json` (desde `colectiva.json` con `build-semilla.ts`), adaptador semilla, adaptador Supabase, store compuesto con fallback y pendientes; `supabase/schema.sql` aplicado; `.env.example`.
- [ ] Colectiva: `layout.ts` (d3-force) + `grafo.sketch.ts` + filtros + ficha + LOD + polling.
- [ ] Sketches de escena: `collageVidrio`, `lcdFondo`, `revelado`. Transiciones enriquecidas (bolsa, sintonía, lcdBoot, revelado, posarse) con Flip.
- [ ] Pase de responsive: compacto / medio / cine / móvil horizontal, en las 7 escenas y en el iPod en ambos modos.
- [ ] Deploy en Vercel/Netlify con rewrite SPA; variables de entorno; comprobar que el grafo funciona con la API caída (degrada a semilla + local).

## 13. Riesgos (máx. 6)

| Riesgo | Mitigación en una línea |
|---|---|
| **Peso de datos** (9.013 tracks, carátulas 640 px) | Lazy por año, pool del iPod curado < 40 KB, prefijos de tamaño del CDN de Spotify, LRU de imágenes en el grafo. |
| **Canvas + scroll a la vez** (Archivo con grano + ScrollTrigger en móvil) | Un solo sketch de escena activo, grano a 12 fps en compacto, sin blur direccional en móvil, snap en vez de scrub continuo. |
| **Rueda en móvil** imprecisa o frustrante | Modo toque por defecto en `pointer: coarse` (tap en lista + ruleta con inercia), toggle explícito, prueba en dispositivo real antes de pulir efectos. |
| **API caída o anon key abusada** | Store compuesto con fallback a semilla + local y cola de pendientes; constraints en DB; un POST por sesión; borrado desde el panel. |
| **Cold start del grafo** (pocos rastros, sin hilos) | Semilla de 12 curados con canciones compartidas entre sí; el tuyo siempre presente; campos por Alma dan estructura aunque haya 13 nodos. |
| **Volumen de rastros** (5.000+) | `limite=500` + `resumen` por Alma; LOD en tres niveles; densidad como halo de grano en vez de nodos. |

---

Tres notas al margen del documento, para quien lo reciba:

- La normalización por percentiles del motor de Almas (§8) es la decisión más importante que no estaba en ninguna fuente: con los valores crudos del archivo (nostalgia casi siempre entre 60 y 95) las seis Almas no son alcanzables. Conviene validarla con Manuela con datos reales antes de calibrar pesos.
- La propuesta cliente dice "rastros de muestra curada" para Colectiva; este documento sube a grafo vivo con backend porque así lo pediste. Es un delta de alcance respecto al contrato; conviene dejarlo por escrito con ella.
- Los previews de audio de Spotify se descartan por razones técnicas (la API ya no los entrega a apps nuevas), no por gusto. Si aparece otra fuente legítima de fragmentos, el punto de enchufe está en `Cancion.svelte` del iPod.