import assert from "node:assert/strict";
import { amountToI128, i128ToAmount } from "./vault.js";

assert.equal(amountToI128("5").toString(), "50000000");
assert.equal(amountToI128("5.5").toString(), "55000000");
assert.equal(i128ToAmount(50_000_000n), "5");
assert.equal(i128ToAmount(55_000_000n), "5.5");

console.log("pay3 stellar vault self-check passed");
