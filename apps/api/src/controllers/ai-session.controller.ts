import { AiClientType } from "@pay3/database";
import type { Request, Response } from "express";
import { sendData } from "./response.js";
import {
  BadRequestError,
  optionalString,
  requireString,
  requireUuid,
} from "./validation.js";

function parseAiClientType(value: unknown): AiClientType {
  const clientType = requireString(value, "clientType").toUpperCase();
  if (!Object.values(AiClientType).includes(clientType as AiClientType)) {
    throw new BadRequestError(`Invalid clientType "${clientType}".`);
  }
  return clientType as AiClientType;
}

export async function listAiSessions(req: Request, res: Response): Promise<void> {
  const sessions = await res.locals.services.aiSession.listActiveSessions(
    req.auth!.userId,
  );
  sendData(req, res, sessions);
}

export async function createAiSession(req: Request, res: Response): Promise<void> {
  const result = await res.locals.services.aiSession.createSession({
    userId: req.auth!.userId,
    smartAccountId: requireUuid(req.body?.smartAccountId, "smartAccountId"),
    policyId: requireUuid(req.body?.policyId, "policyId"),
    clientType: parseAiClientType(req.body?.clientType),
    authorizationTxHash: optionalString(req.body?.authorizationTxHash),
  });

  sendData(req, res, {
    ...result,
    mcpConfig: {
      apiBaseUrl: res.locals.config.mcp.apiBaseUrl,
      mcpAuthToken: result.mcpAuthToken,
      stdio: {
        command: "node",
        args: ["apps/mcp-server/dist/index.js"],
        env: {
          PAY3_MCP_AUTH_TOKEN: result.mcpAuthToken,
        },
      },
    },
  }, 201);
}

export async function revokeAllAiSessions(req: Request, res: Response): Promise<void> {
  const count = await res.locals.services.aiSession.revokeAllSessions(req.auth!.userId);
  sendData(req, res, { revokedCount: count });
}

export async function revokeAiSession(req: Request, res: Response): Promise<void> {
  const sessionId = requireUuid(req.params.sessionId, "sessionId");
  await res.locals.services.aiSession.revokeSession(req.auth!.userId, sessionId);
  res.status(204).send();
}
