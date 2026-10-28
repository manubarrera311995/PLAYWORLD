/** Playlists públicas del festival, una por edición. */
const PLAYLISTS: Record<number, string> = {
  2010: "5GXQ6mLUgmtOvJkDDyHNQQ",
  2011: "22m74hnIhkj5zcjBRYeN1r",
  2012: "4aQdwNaUhgTSYRvZF0DSt2",
  2013: "4mDVTaVB9kAJ54qxn7o2F2",
  2014: "4a8NYS00oaLTYHRJ5LNkrL",
  2015: "3LEpPciu7cSoJHtTLcE2NS",
  2016: "3ZuBV1ZTW54bMfzYncLcrY",
  2017: "1Xch89CmMUySGwqFQt9DDT",
  2018: "49jeDSdA5LoA3PKJrh9wrB",
  2019: "7lURRb4Jtj5mHLbMSMhR8I",
  2022: "0TQ8piaRKjKHYxk3Jsxrcj",
  2023: "49fLc1Zhjpz3LwKzqHGqpK",
  2024: "2Si8hfnPmx9LiWe1x3jDcI",
  2025: "5AFRxwA6O8lwtmcm4SJ45h",
  2026: "530TI8lFsF6rWgZta2NHBs",
};

export function urlPlaylist(year: number): string | null {
  const id = PLAYLISTS[year];
  return id ? `https://open.spotify.com/playlist/${id}` : null;
}

/** Reproductor compacto de Spotify: carátula, nombre y play. */
export function urlEmbedPlaylist(year: number): string | null {
  const id = PLAYLISTS[year];
  return id ? `https://open.spotify.com/embed/playlist/${id}` : null;
}

export function urlTrack(spotifyId: string): string {
  return `https://open.spotify.com/track/${spotifyId}`;
}
