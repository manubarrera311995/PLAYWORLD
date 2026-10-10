/** Cartel del año, servido como textura. 2020 y 2021 no tienen pieza. */
const CARTELES: Readonly<Record<number, string>> = {
  2010: "/assets/archivo/carteles/2010.webp",
  2011: "/assets/archivo/carteles/2011.webp",
  2012: "/assets/archivo/carteles/2012.webp",
  2013: "/assets/archivo/carteles/2013.webp",
  2014: "/assets/archivo/carteles/2014.webp",
  2015: "/assets/archivo/carteles/2015.webp",
  2016: "/assets/archivo/carteles/2016.webp",
  2017: "/assets/archivo/carteles/2017.webp",
  2018: "/assets/archivo/carteles/2018.webp",
  2019: "/assets/archivo/carteles/2019.webp",
  2022: "/assets/archivo/carteles/2022.webp",
  2023: "/assets/archivo/carteles/2023.webp",
  2024: "/assets/archivo/carteles/2024.webp",
  2025: "/assets/archivo/carteles/2025.webp",
  2026: "/assets/archivo/carteles/2026.webp",
};

export function cartelDe(year: number): string | null {
  return CARTELES[year] ?? null;
}
