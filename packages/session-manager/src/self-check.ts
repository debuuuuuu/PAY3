import assert from "node:assert/strict";
import { decryptSecret, encryptSecret } from "./encryption.js";

const key = Buffer.alloc(32, 9);
const secret = "SABC123SECRETKEYFORSESSIONSIGNINGONLY";
const encrypted = encryptSecret(secret, key);

assert.notEqual(encrypted, secret);
assert.equal(decryptSecret(encrypted, key), secret);

console.log("pay3 session-manager self-check passed");
