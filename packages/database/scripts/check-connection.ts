import { bootstrapEnvFiles } from "@pay3/shared";
import {
  connectDatabase,
  disconnectDatabase,
  healthCheckDatabase,
  prisma,
} from "@pay3/database";

bootstrapEnvFiles();
await connectDatabase();

const ok = await healthCheckDatabase();
const tables = await prisma.$queryRaw<
  Array<{ tablename: string }>
>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;

console.log("health:", ok);
console.log(
  "tables:",
  tables.map((row) => row.tablename),
);

await disconnectDatabase();
