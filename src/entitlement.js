import { Capacitor, registerPlugin } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

// ─── ENTITLEMENT ────────────────────────────────────────────
// Strain Sense is free to download on iOS with a few results on the house,
// then a one-time unlock. On Google Play it is still a paid app, so Android
// users have already bought everything and must never see a paywall — every
// check here short-circuits to unlocked off iOS.
//
// A "result" is any route that produces new guidance, not just the camera:
// scanning a label, typing values in by hand, and picking a mood all count.
// Gating only the scanner would leave the app's whole promise free, since
// manual entry runs the same classifier and the mood presets answer the same
// question — you would just be charging for OCR.
//
// Deriving from results already paid for stays free: the saved library, the
// counter card, comparing two saved products, and the sources reading.

const StrainSenseIAP = registerPlugin("StrainSenseIAP");

export const FREE_RESULTS = 3;

const USED_KEY = "entitlement.resultsUsed.v1";
const IOS = "ios";

/** Only iOS sells an unlock. Everywhere else is already paid for. */
export const isPaywalledPlatform = () => Capacitor.getPlatform() === IOS;

async function readResultsUsed() {
  try {
    const { value } = await Preferences.get({ key: USED_KEY });
    const parsed = Number.parseInt(value ?? "0", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

/**
 * Current entitlement, as one object the UI can render directly.
 *
 * `unlocked` covers both routes in: bought the unlock, or bought the app back
 * when it cost $9.99. The native side decides which — see `isGrandfathered`.
 */
export async function loadEntitlement() {
  if (!isPaywalledPlatform()) {
    return { unlocked: true, grandfathered: false, resultsUsed: 0, freeRemaining: FREE_RESULTS, price: "" };
  }

  const resultsUsed = await readResultsUsed();

  let status = { unlocked: false, grandfathered: false, price: "" };
  try {
    status = await StrainSenseIAP.getStatus();
  } catch {
    // The store being unreachable must not lock a paying customer out of an
    // app they own. Fall through on the free allowance and re-check later.
  }

  return {
    unlocked: Boolean(status.unlocked),
    grandfathered: Boolean(status.grandfathered),
    price: status.price || "",
    resultsUsed,
    freeRemaining: Math.max(0, FREE_RESULTS - resultsUsed),
  };
}

/** True when this request for new guidance should be stopped and the paywall shown. */
export function needsUnlock(entitlement) {
  if (!isPaywalledPlatform()) return false;
  return !entitlement.unlocked && entitlement.freeRemaining <= 0;
}

/**
 * Spend one of the free results. Only called once guidance has actually been
 * produced — a scan that errored is not one of your three.
 */
export async function recordResultUsed(entitlement) {
  if (!isPaywalledPlatform() || entitlement.unlocked) return entitlement;

  const resultsUsed = entitlement.resultsUsed + 1;
  try {
    await Preferences.set({ key: USED_KEY, value: String(resultsUsed) });
  } catch {
    // Losing the count costs a free result, not a sale. Never surface it.
  }
  return { ...entitlement, resultsUsed, freeRemaining: Math.max(0, FREE_RESULTS - resultsUsed) };
}

/**
 * @returns {Promise<{unlocked: boolean, cancelled: boolean, pending: boolean, error?: string}>}
 */
export async function purchaseUnlock() {
  try {
    const result = await StrainSenseIAP.purchase();
    return {
      unlocked: Boolean(result.unlocked),
      cancelled: Boolean(result.cancelled),
      pending: Boolean(result.pending),
    };
  } catch (e) {
    return { unlocked: false, cancelled: false, pending: false, error: e?.message || "That didn't go through." };
  }
}

/** Apple requires a visible way to restore a purchase on a new device. */
export async function restoreUnlock() {
  try {
    const result = await StrainSenseIAP.restore();
    return { unlocked: Boolean(result.unlocked) };
  } catch {
    return { unlocked: false };
  }
}

/**
 * Ask To Buy and bank confirmations land minutes or days after the purchase
 * call returned, so the native side pushes the result instead.
 * @returns {Promise<() => void>} an unsubscribe function
 */
export async function onEntitlementChanged(handler) {
  if (!isPaywalledPlatform()) return () => {};
  try {
    const listener = await StrainSenseIAP.addListener("entitlementChanged", handler);
    return () => listener.remove();
  } catch {
    // No plugin, no listener. Losing the late-arriving unlock is survivable —
    // the next launch re-reads entitlement — but an unhandled rejection is not.
    return () => {};
  }
}
