import assert from "node:assert/strict";
import { clock12, clockRange12, hour12 } from "./clock-format.ts";

// Evening, morning, and the two twelves.
assert.equal(clock12(19 * 60), "7:00 م");
assert.equal(clock12(18 * 60 + 5), "6:05 م");
assert.equal(clock12(9 * 60 + 30), "9:30 ص");
assert.equal(clock12(0), "12:00 ص");
assert.equal(clock12(12 * 60), "12:00 م");
assert.equal(clock12(23 * 60 + 59), "11:59 م");
// A night that runs past midnight wraps instead of printing 25:00.
assert.equal(clock12(25 * 60), "1:00 ص");
assert.equal(clock12(19 * 60, "en"), "7:00 PM");
assert.equal(clock12(1 * 60 + 15, "en"), "1:15 AM");

// The period is said once inside one half of the day, twice across noon or midnight.
assert.equal(clockRange12(19 * 60, 19 * 60 + 20), "7:00 – 7:20 م");
assert.equal(clockRange12(11 * 60 + 30, 12 * 60 + 15), "11:30 ص – 12:15 م");
assert.equal(clockRange12(23 * 60 + 30, 24 * 60 + 30), "11:30 م – 12:30 ص");
assert.equal(clockRange12(17 * 60, 18 * 60, "en"), "5:00 – 6:00 PM");

assert.equal(hour12(19), "7 م");
assert.equal(hour12(0), "12 ص");
assert.equal(hour12(12, "en"), "12 PM");

console.log("clock format: 12-hour visitor clock assertions passed");
