/** Mando del embed de Spotify. El audio no sale de su reproductor. */
export type MandoSpotify = {
  alternar: () => void;
  oir: () => void;
};

type ControlEmbed = {
  play: () => void;
  togglePlay: () => void;
  destroy: () => void;
};

type ApiEmbed = {
  createController: (
    element: HTMLElement,
    options: { uri: string; width: number; height: number },
    callback: (control: ControlEmbed) => void,
  ) => void;
};

const SCRIPT = "https://open.spotify.com/embed/iframe-api/v1";
const ALTO = 152;

let carga: Promise<ApiEmbed> | null = null;

export function uriSpotify(id: string): string {
  const limpio = id.trim();
  if (limpio.startsWith("spotify:track:")) return limpio;
  return `spotify:track:${limpio}`;
}

export function cargarSpotify(): Promise<ApiEmbed> {
  if (carga) return carga;
  carga = new Promise((resolve, reject) => {
    const w = window as Window & { onSpotifyIframeApiReady?: (api: ApiEmbed) => void };
    const previo = w.onSpotifyIframeApiReady;
    w.onSpotifyIframeApiReady = (api) => {
      previo?.(api);
      resolve(api);
    };
    document.querySelector(`script[src="${SCRIPT}"]`)?.remove();
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onerror = () => {
      script.remove();
      carga = null;
      reject(new Error("spotify"));
    };
    document.body.appendChild(script);
  });
  return carga;
}

/** Monta el embed en `slot` (Spotify lo reemplaza por su iframe) y devuelve cómo desmontarlo. */
export function abrirPreview(
  slot: HTMLElement,
  spotifyId: string,
  alListo: (mando: MandoSpotify) => void,
  alFallar?: () => void,
): () => void {
  let control: ControlEmbed | null = null;
  let cancelado = false;
  const ancho = Math.max(160, Math.round(slot.parentElement?.clientWidth || 280));
  void cargarSpotify()
    .then((api) => {
      if (cancelado) return;
      api.createController(slot, { uri: uriSpotify(spotifyId), width: ancho, height: ALTO }, (c) => {
        if (cancelado) {
          c.destroy();
          return;
        }
        control = c;
        alListo({
          alternar: () => c.togglePlay(),
          oir: () => c.play(),
        });
      });
    })
    .catch(() => {
      if (!cancelado) alFallar?.();
    });
  return () => {
    cancelado = true;
    try {
      control?.destroy();
    } catch {
      /* Spotify ya retiró el iframe. */
    }
  };
}
