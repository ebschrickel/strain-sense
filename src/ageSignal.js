import { Capacitor, registerPlugin } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { AGE, classifyAgeSignal, resolveAgeStatus } from "./ageSignal.logic.js";

export { AGE };

// ─── PLAY AGE SIGNAL ────────────────────────────────────────
// California AB 1043 (from 2027-01-01) requires asking the app store for the
// user's age range at launch. On Android that's the Play Age Signals API,
// reached through the small native plugin in MainActivity's package.
//
// A signal that says the user is under 18 is actual knowledge of a minor, and
// this app is cannabis information for adults, so it blocks — overriding the
// "I am 21 or older" tap. Play's top band is 18+, so 18–20 can't be told
// apart; the existing self-attested 21+ gate still covers them.
//
// Play's terms allow the signal only for age-appropriate experiences: it is
// never sent anywhere or used for analytics. The last KNOWN result is kept on
// the device so going offline doesn't reopen the app to a known minor.

const KEY = "ageSignal.v1";
const AgeSignals = registerPlugin("StrainSenseAgeSignals");

async function readStored() {
  try {
    const { value } = await Preferences.get({ key: KEY });
    return Object.values(AGE).includes(value) ? value : null;
  } catch {
    return null;
  }
}

/** Never throws. Resolves to one of AGE. Only Android asks; elsewhere UNKNOWN. */
export async function checkAgeSignal() {
  if (Capacitor.getPlatform() !== "android") return AGE.UNKNOWN;
  const stored = await readStored();
  let fresh = null;
  try {
    fresh = classifyAgeSignal(await AgeSignals.check());
  } catch {
    fresh = null;
  }
  const status = resolveAgeStatus(fresh, stored);
  if (fresh !== null) {
    try { await Preferences.set({ key: KEY, value: status }); } catch { /* next launch asks again */ }
  }
  return status;
}
