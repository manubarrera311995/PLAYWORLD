import { describe, expect, it } from "vitest";
import { uriSpotify } from "../src/ipod/spotify";

describe("uri de Spotify", () => {
  it("arma la uri de un id suelto", () => {
    expect(uriSpotify("4iRiiVUx1ytFW3OEAsfKIL")).toBe("spotify:track:4iRiiVUx1ytFW3OEAsfKIL");
  });

  it("respeta una uri que ya viene armada", () => {
    expect(uriSpotify("spotify:track:abc")).toBe("spotify:track:abc");
  });
});
