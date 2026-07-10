import assert from "node:assert/strict";
import test from "node:test";
import { bootstrapEnvFiles } from "@pay3/shared";
import { readJson, withTestServer } from "./helpers.js";

bootstrapEnvFiles();

test("GET /health exposes service metadata", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await readJson<{
      service: string;
      database: boolean;
      requestId: string;
    }>(response);

    assert.equal(body.service, "pay3-api");
    assert.equal(typeof body.database, "boolean");
    assert.ok(typeof body.requestId === "string" && body.requestId.length > 0);
    assert.ok(response.status === 200 || response.status === 503);
  });
});

test("protected routes require authentication", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/dashboard`);
    const body = await readJson<{ error: string; message: string }>(response);

    assert.equal(response.status, 401);
    assert.equal(body.error, "UNAUTHORIZED");
  });
});

test("POST /api/auth/challenge validates input", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/challenge`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await readJson<{ error: string; message: string }>(response);

    assert.equal(response.status, 400);
    assert.equal(body.error, "BAD_REQUEST");
    assert.match(body.message, /walletAddress/i);
  });
});

test("unknown routes return 404", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/unknown-route`);
    const body = await readJson<{ error: string }>(response);

    assert.equal(response.status, 404);
    assert.equal(body.error, "NOT_FOUND");
  });
});

test("analytics routes require authentication", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/analytics/usage`);
    assert.equal(response.status, 401);
  });
});
