import assert from "node:assert/strict";

import { clockChecks } from "./agent-eval-clock.mjs";

const published = [1050, 1140, 1230, 1370, 1500];
const unknown = (reply) => clockChecks(reply, published).unknown;
assert.deepEqual(unknown("مواعيدها 5:30 م، 7:00 م، 8:30 م، و١٠:٥٠ م."), [], "accept displayed times for published slots");
assert.deepEqual(unknown("Hours: 5:30 – 7:00 PM"), []);
assert.deepEqual(unknown("Hours: 10:50 PM – 1:00 AM"), []);
assert.deepEqual(unknown("Starts at 22:50"), []);
assert.deepEqual(unknown("Starts at 5:30 AM"), ["5:30 AM"], "correct clock face with the wrong period is not grounded");
assert.deepEqual(unknown("Starts at 7:01 PM"), ["7:01 PM"], "unpublished times are not grounded");
assert.deepEqual(unknown("Starts at 13:00 PM"), ["13:00 PM"], "invalid 12-hour times are not grounded");
assert.equal(clockChecks("حوالي 30 ريال ومدتها 35 دقيقة", published).plain, "حوالي 30 ريال ومدتها 35 دقيقة", "ordinary numbers still reach the grounding check");

console.log('Agent evaluation clock grounding passed.');
