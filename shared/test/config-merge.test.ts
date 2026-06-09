// Config deep-merge: partial patches must never drop sibling keys.

import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, mergeConfig } from "../src/config.js";

describe("mergeConfig nested sections", () => {
  it("deep-merges a partial showFields patch (keeps other fields)", () => {
    const merged = mergeConfig(DEFAULT_CONFIG, {
      showFields: { registration: true } as never,
    });
    expect(merged.showFields.registration).toBe(true);
    // The fields the patch DIDN'T mention must survive.
    expect(merged.showFields.airline).toBe(DEFAULT_CONFIG.showFields.airline);
    expect(merged.showFields.destination).toBe(DEFAULT_CONFIG.showFields.destination);
  });

  it("deep-merges a partial palette patch (keeps other colors)", () => {
    const merged = mergeConfig(DEFAULT_CONFIG, {
      palette: { accent: "#ff0000" } as never,
    });
    expect(merged.palette.accent).toBe("#ff0000");
    expect(merged.palette.bg).toBe(DEFAULT_CONFIG.palette.bg);
    expect(merged.palette.glyph).toBe(DEFAULT_CONFIG.palette.glyph);
  });
});

describe("mergeConfig locationProfiles (#18)", () => {
  const profile = { id: "a1", name: "LAX", lat: 33.94, lon: -118.4, radiusMiles: 5 };

  it("persists saved profiles and replaces the array wholesale on patch", () => {
    const withOne = mergeConfig(DEFAULT_CONFIG, { locationProfiles: [profile] });
    expect(withOne.locationProfiles).toEqual([profile]);
    // A later patch of the array replaces it (the client sends the full list).
    const cleared = mergeConfig(withOne, { locationProfiles: [] });
    expect(cleared.locationProfiles).toEqual([]);
  });

  it("keeps saved profiles when an unrelated field is patched", () => {
    const base = mergeConfig(DEFAULT_CONFIG, { locationProfiles: [profile] });
    const after = mergeConfig(base, { brightness: 0.5 });
    expect(after.locationProfiles).toEqual([profile]);
  });
});
