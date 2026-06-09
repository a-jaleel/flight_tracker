// Data acquisition: poll the free cloud ADS-B API (airplanes.live), normalize
// records into our Aircraft shape, enrich them, and emit snapshots. The API
// uses the readsb JSON schema.

import type { Aircraft, Config } from "@shared/index.js";
import type { SourceStatus } from "@shared/index.js";
import { lookupAirline, lookupType } from "./enrich/tables.js";
import type { RouteEnricher } from "./enrich/routes.js";

/** Raw readsb-style aircraft record (subset we use). */
interface RawAircraft {
  hex?: string;
  flight?: string;
  lat?: number;
  lon?: number;
  alt_baro?: number | "ground";
  alt_geom?: number;
  gs?: number;
  track?: number;
  baro_rate?: number;
  squawk?: string;
  category?: string;
  r?: string;
  t?: string;
  seen?: number;
  rssi?: number;
}

function normalize(raw: RawAircraft, ts: number): Aircraft | null {
  if (!raw.hex) return null;
  const onGround = raw.alt_baro === "ground";
  return {
    hex: raw.hex,
    flight: raw.flight?.trim() || undefined,
    lat: raw.lat,
    lon: raw.lon,
    altBaro: onGround ? null : (raw.alt_baro as number | undefined) ?? null,
    altGeom: raw.alt_geom ?? null,
    gs: raw.gs,
    track: raw.track,
    baroRate: raw.baro_rate ?? null,
    squawk: raw.squawk,
    category: raw.category,
    onGround,
    registration: raw.r,
    typeCode: raw.t,
    seen: raw.seen,
    rssi: raw.rssi,
    ts,
  };
}

const NM_PER_MILE = 0.868976;

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface PollerOptions {
  /** airplanes.live point template, {lat}/{lon}/{r} are filled from config. */
  apiUrlTemplate: string;
  pollMs: number;
  getConfig: () => Config;
  enricher: RouteEnricher;
  onSnapshot: (now: number, aircraft: Aircraft[]) => void;
  onStatus: (status: SourceStatus) => void;
}

/** Enrichment we've resolved for an aircraft, kept sticky for its session. */
interface StickyEnrichment {
  typeName?: string;
  airline?: string;
  origin?: string;
  destination?: string;
  registration?: string;
  originName?: string;
  destName?: string;
  originLat?: number;
  originLon?: number;
  destLat?: number;
  destLon?: number;
  lastSeen: number;
}

export class Poller {
  private timer: ReturnType<typeof setInterval> | null = null;
  private status: SourceStatus;
  private last: Aircraft[] = [];
  /** hex -> last good enrichment, so resolved routes never flicker back to "—". */
  private sticky = new Map<string, StickyEnrichment>();

  constructor(private o: PollerOptions) {
    this.status = {
      source: "api",
      ok: false,
      count: 0,
      lastOk: null,
    };
  }

  getSnapshot(): { now: number; aircraft: Aircraft[] } {
    return { now: Date.now(), aircraft: this.last };
  }
  getStatus(): SourceStatus {
    return this.status;
  }

  start(): void {
    if (this.timer) return;
    void this.tick();
    this.timer = setInterval(() => void this.tick(), this.o.pollMs);
  }
  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async fetchList(now: number): Promise<Aircraft[] | null> {
    try {
      const json = await fetchJson(this.buildApiUrl());
      const rawList: RawAircraft[] = json.aircraft ?? json.ac ?? [];
      const list: Aircraft[] = [];
      for (const raw of rawList) {
        const ac = normalize(raw, now);
        if (ac) list.push(ac);
      }
      return list;
    } catch {
      return null;
    }
  }

  private buildApiUrl(): string {
    const c = this.o.getConfig();
    const r = Math.min(250, Math.ceil(c.radiusMiles * NM_PER_MILE) + 1);
    return this.o.apiUrlTemplate
      .replace("{lat}", String(c.centerLat))
      .replace("{lon}", String(c.centerLon))
      .replace("{r}", String(r));
  }

  private async tick(): Promise<void> {
    const now = Date.now();
    const list = await this.fetchList(now);
    if (list === null) {
      this.status = { ...this.status, ok: false, message: "source fetch failed" };
      this.o.onStatus(this.status);
      return;
    }
    for (const ac of list) this.enrich(ac, now);
    this.last = list;
    this.pruneSticky(now);
    this.status = {
      source: "api",
      ok: true,
      count: list.length,
      lastOk: now,
    };
    this.o.onSnapshot(now, list);
    this.o.onStatus(this.status);
  }

  private enrich(ac: Aircraft, now: number): void {
    // Instant table lookups first.
    ac.typeName = lookupType(ac.typeCode);
    ac.airline = lookupAirline(ac.flight);

    // adsbdb fills gaps (route + better type), from cache when available.
    const e = this.o.enricher.enrichSync(ac.hex, ac.flight, now);
    if (e.route) {
      ac.airline = ac.airline ?? e.route.airline;
      ac.origin = e.route.origin ?? ac.origin;
      ac.destination = e.route.destination ?? ac.destination;
      ac.originName = e.route.originName ?? ac.originName;
      ac.destName = e.route.destName ?? ac.destName;
      ac.originLat = e.route.originLat ?? ac.originLat;
      ac.originLon = e.route.originLon ?? ac.originLon;
      ac.destLat = e.route.destLat ?? ac.destLat;
      ac.destLon = e.route.destLon ?? ac.destLon;
    }
    if (e.aircraft) {
      ac.typeName = ac.typeName ?? e.aircraft.typeName;
      ac.registration = ac.registration ?? e.aircraft.registration;
    }

    // Sticky merge: once we've resolved something for this hex, never drop it
    // back to undefined on a later snapshot (prevents label flicker).
    const prev = this.sticky.get(ac.hex);
    ac.typeName = ac.typeName ?? prev?.typeName;
    ac.airline = ac.airline ?? prev?.airline;
    ac.origin = ac.origin ?? prev?.origin;
    ac.destination = ac.destination ?? prev?.destination;
    ac.registration = ac.registration ?? prev?.registration;
    ac.originName = ac.originName ?? prev?.originName;
    ac.destName = ac.destName ?? prev?.destName;
    ac.originLat = ac.originLat ?? prev?.originLat;
    ac.originLon = ac.originLon ?? prev?.originLon;
    ac.destLat = ac.destLat ?? prev?.destLat;
    ac.destLon = ac.destLon ?? prev?.destLon;
    this.sticky.set(ac.hex, {
      typeName: ac.typeName,
      airline: ac.airline,
      origin: ac.origin,
      destination: ac.destination,
      registration: ac.registration,
      originName: ac.originName,
      destName: ac.destName,
      originLat: ac.originLat,
      originLon: ac.originLon,
      destLat: ac.destLat,
      destLon: ac.destLon,
      lastSeen: now,
    });
  }

  /** Drop sticky entries for aircraft long gone (keep the map small). */
  private pruneSticky(now: number): void {
    for (const [hex, s] of this.sticky) {
      if (now - s.lastSeen > 600_000) this.sticky.delete(hex);
    }
  }
}
