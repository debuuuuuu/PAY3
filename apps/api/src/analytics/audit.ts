import type { PrismaClient } from "@pay3/database";

const SENSITIVE_KEY_PATTERN =
  /secret|private|key|token|signature|encrypted/i;

function sanitizeDetails(details: unknown): unknown {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return details ?? {};
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

export async function listAuditLogs(
  prisma: PrismaClient,
  userId: string,
  limit = 50,
) {
  const rows = await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      actor: true,
      details: true,
      transactionId: true,
      aiSessionId: true,
      ipAddress: true,
      createdAt: true,
    },
  });

  return rows.map((row) => ({
    ...row,
    details: sanitizeDetails(row.details),
    createdAt: row.createdAt.toISOString(),
  }));
}
