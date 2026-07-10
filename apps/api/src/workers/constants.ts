/** ponytail: in-process polling; upgrade path = dedicated job queue when scale requires it. */

export const APPROVAL_EXPIRY_POLL_MS = 15_000;
export const SESSION_EXPIRY_POLL_MS = 60_000;
export const RETRY_TRANSFER_POLL_MS = 30_000;

/** Stuck SIGNING longer than this is treated as an interrupted submission attempt. */
export const STUCK_SIGNING_THRESHOLD_MS = 45_000;

export const APPROVAL_EXPIRED_MESSAGE =
  "Payment was not executed because the approval request expired after 2 minutes. Create a new payment request to try again.";

export const STUCK_SUBMITTING_MESSAGE =
  "Submission was interrupted. Verify the payment on-chain before creating a new request.";
