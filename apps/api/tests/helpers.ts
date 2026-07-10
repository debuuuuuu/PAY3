import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.js";

export async function withTestServer(
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const app = createApp();
  const server = await new Promise<Server>((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server.");
  }

  const baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

export async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}
