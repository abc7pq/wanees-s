import assert from "node:assert/strict";
import { foldBins } from "./audio-meter.ts";

// The call screen's waveform: analyser bins (0..255) folded into bars in 0..1.
assert.deepEqual(foldBins(new Uint8Array(32), 8), Array(8).fill(0), "silence is flat");
const loud = foldBins(new Uint8Array(32).fill(255), 8);
assert.equal(loud.length, 8);
assert.ok(loud.every((value) => value === 1), "full scale clamps to 1");
const low = new Uint8Array(32); low.fill(200, 0, 4);
const bars = foldBins(low, 8);
assert.ok(bars[0] > 0.5 && bars[7] === 0, "low pitches land in the first bars");
assert.equal(foldBins([], 5).length, 5, "always returns the requested number of bars");
console.log("audio meter tests passed");
