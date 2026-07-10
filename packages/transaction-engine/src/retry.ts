export function isRetriableTransferError(message: string): boolean {
  return /timeout|temporarily|unavailable|network/i.test(message);
}
