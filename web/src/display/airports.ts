// Bundled airport geometry, drawn at true geographic position so departures and
// arrivals visibly line up with the runways. Coordinates from OurAirports (KLGA).

export interface Runway {
  leIdent: string;
  heIdent: string;
  le: [number, number]; // [lat, lon]
  he: [number, number];
  widthFt: number;
}

export interface Airport {
  icao: string;
  name: string;
  runways: Runway[];
}

// LaGuardia (KLGA) — two intersecting runways, 4/22 and 13/31.
export const LGA: Airport = {
  icao: "KLGA",
  name: "LGA",
  runways: [
    { leIdent: "4", heIdent: "22", le: [40.778294, -73.886241], he: [40.789258, -73.872684], widthFt: 150 },
    { leIdent: "13", heIdent: "31", le: [40.785889, -73.889561], he: [40.772678, -73.875611], widthFt: 150 },
  ],
};

/** Airports drawn on the map (currently just LGA; easy to extend). */
export const AIRPORTS: Airport[] = [LGA];
