import { toPrismaNetwork } from "@pay3/auth";
import type { ServiceContext } from "./context.js";

export class SmartAccountAppService {
  constructor(private readonly ctx: ServiceContext) {}

  async linkSmartAccount(input: {
    userId: string;
    walletId: string;
    contractId: string;
  }) {
    const wallet = await this.ctx.prisma.wallet.findFirst({
      where: { id: input.walletId, userId: input.userId },
    });
    if (!wallet) {
      throw new Error("Wallet not found.");
    }

    const contractId = input.contractId.trim().toUpperCase();
    if (!/^[A-Z0-9]{56}$/.test(contractId)) {
      throw new Error("Contract ID must be a 56-character Stellar address.");
    }

    const network = toPrismaNetwork(this.ctx.config.stellar.network);

    return this.ctx.prisma.smartAccount.upsert({
      where: {
        contractId_network: { contractId, network },
      },
      create: {
        userId: input.userId,
        walletId: input.walletId,
        contractId,
        network,
      },
      update: {
        userId: input.userId,
        walletId: input.walletId,
      },
    });
  }

  async listSmartAccounts(userId: string) {
    return this.ctx.prisma.smartAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}
