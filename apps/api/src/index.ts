import { bootstrapEnvFiles } from "@pay3/shared";
import { connectDatabase, disconnectDatabase } from "@pay3/database";
import { createApp } from "./app.js";
import { getConfig } from "./config/index.js";
import { createWorkerRuntime, startWorkers } from "./workers/index.js";

bootstrapEnvFiles();

const config = getConfig();
const app = createApp();
const workerRuntime = createWorkerRuntime(config);
const workers = startWorkers(workerRuntime);

await connectDatabase();

const server = app.listen(config.server.port, config.server.host, () => {
  console.log(
    `Pay3 API listening on http://${config.server.host}:${config.server.port}`,
  );
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}, shutting down...`);
  workers.stop();
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
