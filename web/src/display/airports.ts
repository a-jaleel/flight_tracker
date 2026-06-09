// Bundled airport geometry, drawn at true geographic position so departures and
// arrivals visibly line up with the runways. Coordinates from OurAirports
// (KLGA, KJFK, KEWR).

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

// John F. Kennedy (KJFK) — two parallel pairs, 4L/22R + 4R/22L and 13L/31R + 13R/31L.
export const JFK: Airport = {
  icao: "KJFK",
  name: "JFK",
  runways: [
    { leIdent: "4L", heIdent: "22R", le: [40.622002, -73.785599], he: [40.6488, -73.764702], widthFt: 200 },
    { leIdent: "4R", heIdent: "22L", le: [40.625401, -73.770302], he: [40.645199, -73.754898], widthFt: 200 },
    { leIdent: "13L", heIdent: "31R", le: [40.657799, -73.790199], he: [40.6437, -73.7593], widthFt: 200 },
    { leIdent: "13R", heIdent: "31L", le: [40.648399, -73.816704], he: [40.627899, -73.771599], widthFt: 200 },
  ],
};

// Newark Liberty (KEWR) — parallels 4L/22R + 4R/22L, plus crosswind 11/29.
export const EWR: Airport = {
  icao: "KEWR",
  name: "EWR",
  runways: [
    { leIdent: "4L", heIdent: "22R", le: [40.675392, -74.179456], he: [40.70257, -74.16217], widthFt: 150 },
    { leIdent: "4R", heIdent: "22L", le: [40.677588, -74.174253], he: [40.702299, -74.158539], widthFt: 150 },
    { leIdent: "11", heIdent: "29", le: [40.702815, -74.180748], he: [40.701203, -74.156502], widthFt: 150 },
  ],
};

/** Airports drawn on the map (true geographic position; off-screen ones don't show). */
export const AIRPORTS: Airport[] = [LGA, JFK, EWR];
