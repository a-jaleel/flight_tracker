import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIG } from "@shared/index.js";
import { Poller, type PollerOptions } from "../src/datasource.js";
import type { RouteEnricher } from "../src/enrich/routes.js";

// The poller drives a single cloud API source. It should poll once immediately
// on start and then on a fixed cadence — no hidden second timer.

const stubEnricher = { enrichSync: () => ({}) } as unknown as RouteEnricher;

function makeOpts(over: Partial<PollerOptions> = {}): PollerOptions {
  return {
    apiUrlTemplate: "https://api.example/{lat}/{lon}/{r}",
    pollMs: 1000,
    getConfig: () => DEFAULT_CONFIG,
    enricher: stubEnricher,
    onSnapshot: () => {},
    onStatus: () => {},
    ...over,
  };
}

describe("Poller (API source)", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ aircraft: [] }),
    }));
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("polls once immediately, then on the configured cadence", async () => {
    const poller = new Poller(makeOpts());
    poller.start();
    await vi.advanceTimersByTimeAsync(4100); // immediate + 4 interval ticks
    poller.stop();
    // 1 immediate + 4 interval ticks = 5; a stray second timer would add more.
    expect(fetchSpy).toHaveBeenCalledTimes(5);
  });

  it("fills the API URL template from the active config", async () => {
    const poller = new Poller(makeOpts());
    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    poller.stop();
    const url = String(fetchSpy.mock.calls[0]?.[0]);
    expect(url).toContain(String(DEFAULT_CONFIG.centerLat));
    expect(url).toContain(String(DEFAULT_CONFIG.centerLon));
  });
});
