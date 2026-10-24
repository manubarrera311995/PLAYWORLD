/** Collage del año, pegado al cartel. 2020 y 2021 no están en la línea. */
const COLLAGES: Readonly<Record<number, string>> = {
  2010: "/assets/archivo/collages/2010.png",
  2011: "/assets/archivo/collages/2011.png",
  2012: "/assets/archivo/collages/2012.png",
  2013: "/assets/archivo/collages/2013.png",
  2014: "/assets/archivo/collages/2014.png",
  2015: "/assets/archivo/collages/2015.png",
  2016: "/assets/archivo/collages/2016.png",
  2017: "/assets/archivo/collages/2017.png",
  2018: "/assets/archivo/collages/2018.png",
  2019: "/assets/archivo/collages/2019.png",
  2022: "/assets/archivo/collages/2022.png",
  2023: "/assets/archivo/collages/2023.png",
  2024: "/assets/archivo/collages/2024.png",
  2025: "/assets/archivo/collages/2025.png",
  2026: "/assets/archivo/collages/2026.png",
};

export function collageDe(year: number): string | null {
  return COLLAGES[year] ?? null;
}
