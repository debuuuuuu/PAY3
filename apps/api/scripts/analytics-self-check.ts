import assert from "node:assert/strict";
import { resolveUsagePeriod } from "../src/analytics/period.js";

assert.deepEqual(
  resolveUsagePeriod(2026, 7),
  { year: 2026, month: 7 },
);

assert.deepEqual(
  resolveUsagePeriod(undefined, undefined, new Date("2026-03-15T12:00:00.000Z")),
  { year: 2026, month: 3 },
);

assert.throws(() => resolveUsagePeriod(2026, 13), /month must be between 1 and 12/);

console.log("analytics-self-check passed");
