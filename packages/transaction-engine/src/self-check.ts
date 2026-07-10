import assert from "node:assert/strict";
import { isRetriableTransferError } from "./retry.js";

assert.equal(isRetriableTransferError("Horizon network timeout"), true);
assert.equal(isRetriableTransferError("Service temporarily unavailable"), true);
assert.equal(isRetriableTransferError("Insufficient balance"), false);
assert.equal(isRetriableTransferError("Policy rejection"), false);

console.log("pay3 transaction-engine self-check passed");
