// Run: npm test  (node's built-in runner; no extra dependencies)
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyAgeSignal, resolveAgeStatus, AGE } from "../src/ageSignal.logic.js";

test("default Play bands", () => {
  assert.equal(classifyAgeSignal({ ageLower: 0, ageUpper: 12 }), AGE.MINOR);
  assert.equal(classifyAgeSignal({ ageLower: 13, ageUpper: 15 }), AGE.MINOR);
  assert.equal(classifyAgeSignal({ ageLower: 16, ageUpper: 17 }), AGE.MINOR);
  assert.equal(classifyAgeSignal({ ageLower: 18, ageUpper: null }), AGE.ADULT);
});

test("no signal is unknown", () => {
  assert.equal(classifyAgeSignal({ ageLower: null, ageUpper: null }), AGE.UNKNOWN);
  assert.equal(classifyAgeSignal({}), AGE.UNKNOWN);
  assert.equal(classifyAgeSignal(null), AGE.UNKNOWN);
});

test("custom band straddling 18 proves nothing", () => {
  assert.equal(classifyAgeSignal({ ageLower: 15, ageUpper: null }), AGE.UNKNOWN);
  assert.equal(classifyAgeSignal({ ageLower: 16, ageUpper: 19 }), AGE.UNKNOWN);
});

test("failed request keeps what the device last knew", () => {
  assert.equal(resolveAgeStatus(null, AGE.MINOR), AGE.MINOR);
  assert.equal(resolveAgeStatus(null, null), AGE.UNKNOWN);
});

test("a fresh answer replaces the stored one", () => {
  assert.equal(resolveAgeStatus(AGE.UNKNOWN, AGE.MINOR), AGE.UNKNOWN);
  assert.equal(resolveAgeStatus(AGE.ADULT, AGE.MINOR), AGE.ADULT);
  assert.equal(resolveAgeStatus(AGE.MINOR, null), AGE.MINOR);
});
