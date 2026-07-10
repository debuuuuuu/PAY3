import assert from "node:assert/strict";
import {
  APPROVAL_EXPIRED_MESSAGE,
  APPROVAL_EXPIRY_POLL_MS,
  STUCK_SIGNING_THRESHOLD_MS,
} from "../src/workers/constants.js";

assert.match(
  APPROVAL_EXPIRED_MESSAGE,
  /expired after 2 minutes/i,
);
assert.equal(APPROVAL_EXPIRY_POLL_MS, 15_000);
assert.equal(STUCK_SIGNING_THRESHOLD_MS, 45_000);

console.log("workers-self-check passed");
