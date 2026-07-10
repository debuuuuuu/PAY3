import "./env.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { authBackend, databaseProvider } from "./auth-store.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { historyRouter } from "./routes/history.js";
import { contactsRouter } from "./routes/contacts.js";
import { policyRouter } from "./routes/policy.js";
import { sessionsRouter } from "./routes/sessions.js";
import { smartAccountRouter } from "./routes/smart-account.js";
import { transactionsRouter } from "./routes/transactions.js";
import { approvalsRouter } from "./routes/approvals.js";
import { mcpRouter } from "./routes/mcp.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use(healthRouter);
app.use("/auth", authRouter);
app.use("/smart-account", smartAccountRouter);
app.use("/history", historyRouter);
app.use("/contacts", contactsRouter);
app.use("/sessions", sessionsRouter);
app.use("/policy", policyRouter);
app.use("/transactions", transactionsRouter);
app.use("/approvals", approvalsRouter);
app.use("/mcp", mcpRouter);

app.listen(port, () => {
  const backend = authBackend();
  console.log(`pay3-api listening on http://localhost:${port}`);
  if (backend === "memory") {
    console.warn(
      "DATABASE_URL not configured — using in-memory auth. See docs/DATABASE.md for Neon setup."
    );
  } else {
    console.log(`database: ${databaseProvider() ?? "PostgreSQL"}`);
  }
});
