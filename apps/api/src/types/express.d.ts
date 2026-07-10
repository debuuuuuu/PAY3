import type { AuthenticatedWalletContext } from "@pay3/auth";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: AuthenticatedWalletContext;
    }
  }
}

export {};
