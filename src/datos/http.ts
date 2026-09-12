export type BytesFn = (loaded: number, total: number) => void;

export function textoEsJson(text: string): boolean {
  const t = text.trimStart();
  return t.startsWith("{") || t.startsWith("[");
}

function esHtml(res: Response): boolean {
  return (res.headers.get("content-type") ?? "").includes("text/html");
}

function juntar(chunks: Uint8Array[]): Uint8Array {
  const len = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(len);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export async function leerJson<T>(url: string, onBytes?: BytesFn): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok || esHtml(res)) return null;
    if (!onBytes || !res.body) {
      const data = (await res.json()) as unknown;
      return data as T;
    }
    const declared = Number(res.headers.get("content-length")) || 0;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      chunks.push(value);
      loaded += value.byteLength;
      onBytes(loaded, declared || loaded);
    }
    const text = new TextDecoder().decode(juntar(chunks));
    if (!textoEsJson(text)) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function enOleada<T>(items: T[], limite: number, fn: (item: T) => Promise<void>): Promise<void> {
  let i = 0;
  const n = Math.max(1, Math.min(limite, items.length));
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const item = items[i];
        i += 1;
        if (item !== undefined) await fn(item);
      }
    }),
  );
}
