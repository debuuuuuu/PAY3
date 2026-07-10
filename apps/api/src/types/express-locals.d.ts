import type { WalletAuthService } from "@pay3/auth";
import type { Pay3Config } from "@pay3/shared";
import type { RequestHandler } from "express";
import type { AppServices } from "../services/index.js";

declare module "express-serve-static-core" {
  interface Locals {
    requireAuth: RequestHandler;
    authService: WalletAuthService;
    services: AppServices;
    config: Pay3Config;
  }
}

export {};
