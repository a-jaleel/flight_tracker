// Central, fully-adjustable configuration for the flight tracker.
// This object is the single source of truth shared between the display
// (wall-mounted screen) and the control panel (phone). Everything here is
// live-tunable and persisted server-side so changes survive reboots.

export type Theme = "ambient" | "telemetry" | "focus";
export type LabelDensity = "all" | "nearestN" | "nearestOnly";
/** Aircraft come from a free cloud ADS-B API (airplanes.live). */
export type DataSource = "api";
/** Ground-speed display unit. ADS-B reports knots; the rest are converted. */
export type SpeedUnit = "kt" | "mph" | "kmh";
/** map = flat ground plan; sky = look-up dome with altitude-aware motion. */
export type ProjectionMode = "map" | "sky";

export interface Palette {
  bg: string;
  glyph: string;
  trail: string;
  accent: string;
  warn: string;
  /** Range rings / compass ticks. */
  grid: string;
  /** Label / card text. */
  text: string;
}

export interface Fonts {
  label: string;
  mono: string;
}

/** A saved place you can jump the view to from the control panel. */
export interface LocationProfile {
  id: string;
  name: string;
  lat: number;
  lon: number;
  radiusMiles: number;
}

export interface ShowFields {
  airline: boolean;
  flight: boolean;
  type: boolean;
  altitude: boolean;
  speed: boolean;
  verticalRate: boolean;
  destination: boolean;
  registration: boolean;
}

export interface Config {
  // --- location & scope ---
  centerLat: number;
  centerLon: number;
  /** Human-readable place name for the current location (shown in the panel). */
  locationName: string;
  radiusMiles: number;
  /** Saved places (airports/cities) switchable from the control panel. */
  locationProfiles: LocationProfile[];

  // --- orientation (line the map up with how the screen is mounted) ---
  /** Rotate the whole field, degrees (e.g. to put a runway/north where you
   *  want it on a wall-mounted screen). */
  rotationDeg: number;
  /** Horizontal flip (for awkward mounts / rear-projection). */
  mirrorX: boolean;
  /** Vertical flip (for awkward mounts). */
  mirrorY: boolean;
  /** Rotate only the text labels independent of the field rotation. Degrees. */
  labelRotationDeg: number;
  /** How aircraft are placed (map = flat top-down plan; sky = look-up dome). */
  projectionMode: ProjectionMode;

  // --- filtering ---
  minAltitudeFt: number;
  maxAltitudeFt: number;
  hideOnGround: boolean;

  // --- motion ---
  /** Display interpolation toggle (server poll cadence is separate). */
  interpolate: boolean;
  maxExtrapolationSec: number;
  staleSec: number;
  /** Ease factor toward each fresh fix (0 = snap, 1 = never move). */
  smoothing: number;
  /** Cap the render loop, frames per second. 0 = uncapped (use display
   *  refresh rate). Lower this to cut GPU/CPU load (and laptop fan noise). */
  maxFps: number;

  // --- visuals ---
  theme: Theme;
  palette: Palette;
  fonts: Fonts;
  glyphSizePx: number;
  /** Color the glyph by altitude. */
  altitudeColor: boolean;
  trailSeconds: number;
  /** Global brightness 0..1 (helps keep the LCD's blacks deep). */
  brightness: number;

  // --- labels ---
  labelDensity: LabelDensity;
  nearestN: number;
  showFields: ShowFields;
  /** Unit for the speed shown on labels (ADS-B is knots). */
  speedUnit: SpeedUnit;

  // --- overlays ---
  rangeRings: boolean;
  compass: boolean;
  highlightEmergency: boolean;
  /** Draw the airport (runways) at its true geographic position. */
  showAirport: boolean;
  /** Show the on-screen calibration HUD on the display. */
  showHud: boolean;

  // --- sky layer (sun / moon / stars / satellites at true positions) ---
  showStars: boolean;
  showSun: boolean;
  showMoon: boolean;
  showSatellites: boolean; // includes the ISS
  /** Label non-ISS satellites with their names (the ISS is always labelled). */
  satelliteLabels: boolean;
  /** Draw the naked-eye planets (Venus, Jupiter, Mars, Saturn, Mercury). */
  showPlanets: boolean;
  /** Faintest star magnitude to draw (higher = more stars). */
  starMagLimit: number;
  /** Faintest star magnitude to label with its name (higher = more names). */
  starLabelMagLimit: number;
  /** Offset the sky clock for testing/scrubbing, minutes (0 = live). */
  skyTimeOffsetMin: number;

  // --- "window to elsewhere" ---
  /** Faint great-circle arc toward each plane's destination. */
  showDestArc: boolean;
  /** Add destination local time + distance-to-go to labels. */
  showRouteDetail: boolean;
}

export const DEFAULT_CONFIG: Config = {
  // Default center: San Francisco International (SFO). Set this to your own
  // location — the spot you want centered on the screen.
  centerLat: 37.6213,
  centerLon: -122.379,
  locationName: "San Francisco International",
  radiusMiles: 3,
  locationProfiles: [],

  // Wall-mounted, front-viewed screen: north-up, no mirroring by default.
  rotationDeg: 0,
  mirrorX: false,
  mirrorY: false,
  labelRotationDeg: 0,
  // Default to the flat ground plan (the original look); "sky" is opt-in.
  projectionMode: "map",

  minAltitudeFt: 100,
  maxAltitudeFt: 60000,
  hideOnGround: true,

  interpolate: true,
  maxExtrapolationSec: 5,
  staleSec: 20,
  smoothing: 0.18,
  maxFps: 0,

  theme: "ambient",
  palette: {
    bg: "#000000",
    glyph: "#E8ECFF",
    trail: "#6B7280",
    accent: "#9B7ECF",
    warn: "#FF5A47",
    grid: "#3A4256",
    text: "#AEB6C6",
  },
  fonts: {
    label: "Inter, system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  glyphSizePx: 22,
  altitudeColor: true,
  trailSeconds: 45,
  brightness: 1,

  labelDensity: "all",
  nearestN: 5,
  showFields: {
    airline: true,
    flight: true,
    type: true,
    altitude: true,
    speed: true,
    verticalRate: false,
    destination: true,
    registration: false,
  },
  speedUnit: "kt",

  rangeRings: true,
  compass: true,
  highlightEmergency: true,
  showAirport: true,
  showHud: false,

  showStars: true,
  showSun: true,
  showMoon: true,
  showSatellites: true,
  satelliteLabels: false,
  showPlanets: true,
  starMagLimit: 2.6,
  starLabelMagLimit: 0.3,
  skyTimeOffsetMin: 0,

  showDestArc: true,
  showRouteDetail: true,
};

/**
 * Deep-merge a partial config onto a base, so persisted/partial payloads
 * never drop nested keys (palette, showFields, fonts).
 */
export function mergeConfig(base: Config, patch: Partial<Config>): Config {
  return {
    ...base,
    ...patch,
    palette: { ...base.palette, ...(patch.palette ?? {}) },
    fonts: { ...base.fonts, ...(patch.fonts ?? {}) },
    showFields: { ...base.showFields, ...(patch.showFields ?? {}) },
  };
}
