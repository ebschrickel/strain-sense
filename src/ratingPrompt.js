import { Preferences } from "@capacitor/preferences";
import { InAppReview } from "@capacitor-community/in-app-review";

// ─── RATING PROMPT ──────────────────────────────────────────
// Asks for a store rating only after the user has told us, through their own
// actions, that the app worked. Never asks on a cold open, after an error, or
// while the Counter card is up — that view gets held out to a budtender with a
// line waiting, which is the worst possible moment to interrupt.
//
// State lives in Preferences, NOT localStorage. Everything else in this app
// uses localStorage, but a WKWebView can have that evicted under storage
// pressure, which would silently re-prompt people who already rated.
// Preferences maps to UserDefaults / SharedPreferences and survives.

const KEY = "ratingPrompt.v1";

const MIN_SESSIONS = 3;
const MIN_DAYS_INSTALLED = 3;
const MIN_DAYS_BETWEEN_PROMPTS = 120;
const DAY_MS = 86_400_000;

// Reset per app launch rather than persisted — these are session facts.
let promptedThisSession = false;
let errorThisSession = false;

async function readState() {
  try {
    const { value } = await Preferences.get({ key: KEY });
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

async function writeState(state) {
  try {
    await Preferences.set({ key: KEY, value: JSON.stringify(state) });
  } catch {
    // A failed write means we may ask again later. Acceptable; never surface it.
  }
}

/** Call once when the app mounts. Counts the session and arms the prompt. */
export async function startRatingSession() {
  promptedThisSession = false;
  errorThisSession = false;

  const state = await readState();
  await writeState({
    ...state,
    installDate: state.installDate ?? Date.now(),
    sessions: (state.sessions ?? 0) + 1,
  });
}

/**
 * Disarm the prompt for this session. Call from anywhere that shows the user
 * an error — someone who just hit a failure is not someone to ask for stars.
 */
export function noteRatingError() {
  errorThisSession = true;
}

/**
 * Ask for a review, if every condition holds.
 *
 * Deliberately has no pre-prompt ("Are you enjoying this?"). Two reasons:
 * App Store guideline 1.1.7 disallows custom review prompts, and the trigger
 * here is already the user pressing "liked" on a product — asking whether they
 * are happy immediately after they said so is redundant.
 *
 * @param {object}  ctx
 * @param {boolean} ctx.activated  user has saved at least 2 scans
 * @param {boolean} ctx.busy       counter card open, loading, or still gated
 */
export async function maybePromptForReview({ activated, busy }) {
  if (!activated || busy || promptedThisSession || errorThisSession) return;

  const state = await readState();
  const now = Date.now();

  if ((state.sessions ?? 0) < MIN_SESSIONS) return;
  if (now - (state.installDate ?? now) < MIN_DAYS_INSTALLED * DAY_MS) return;
  if (state.lastPromptVersion === __APP_VERSION__) return;
  if (state.lastPromptDate && now - state.lastPromptDate < MIN_DAYS_BETWEEN_PROMPTS * DAY_MS) return;

  // Record before asking. Both stores may silently decline to show anything,
  // and that is indistinguishable from success — so a request that showed
  // nothing still has to count, or we would ask again on the next "liked".
  promptedThisSession = true;
  await writeState({
    ...state,
    lastPromptVersion: __APP_VERSION__,
    lastPromptDate: now,
  });

  try {
    await InAppReview.requestReview();
  } catch {
    // No dialog is a normal outcome, not a failure worth showing anyone.
  }
}
