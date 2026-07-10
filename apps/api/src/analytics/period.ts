export interface UsagePeriod {
  year: number;
  month: number;
}

export function resolveUsagePeriod(
  year?: number,
  month?: number,
  now = new Date(),
): UsagePeriod {
  const resolvedYear = year ?? now.getUTCFullYear();
  const resolvedMonth = month ?? now.getUTCMonth() + 1;

  if (!Number.isInteger(resolvedYear) || resolvedYear < 2000 || resolvedYear > 9999) {
    throw new Error("year must be a valid four-digit year.");
  }
  if (!Number.isInteger(resolvedMonth) || resolvedMonth < 1 || resolvedMonth > 12) {
    throw new Error("month must be between 1 and 12.");
  }

  return { year: resolvedYear, month: resolvedMonth };
}

export function formatUsageRecord<T extends { totalAmount: { toString(): string }; transactionCount: number }>(
  record: T,
) {
  return {
    ...record,
    totalAmount: record.totalAmount.toString(),
  };
}
