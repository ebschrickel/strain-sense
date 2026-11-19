// Pure age-signal rules, kept free of Capacitor so node --test can run them.
// Why these rules: see ageSignal.js.

export const AGE = Object.freeze({ ADULT: "adult", MINOR: "minor", UNKNOWN: "unknown" });

/** Bounds are inclusive; ageUpper is null for the open top band (18+). */
export function classifyAgeSignal(signal) {
  const lower = signal?.ageLower ?? null;
  const upper = signal?.ageUpper ?? null;
  if (upper !== null && upper < 18) return AGE.MINOR;
  if (lower !== null && lower >= 18) return AGE.ADULT;
  // No signal, or a custom band straddling 18, proves nothing.
  return AGE.UNKNOWN;
}

/**
 * Combine a fresh check with what the device last knew. A failed request
 * (offline, sideloaded, no Play) keeps the stored answer; a successful one
 * replaces it, so a user who stops sharing or ages up isn't gated forever.
 */
export function resolveAgeStatus(fresh, stored) {
  if (fresh === null || fresh === undefined) return stored ?? AGE.UNKNOWN;
  return fresh;
}
