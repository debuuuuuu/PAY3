import { getAccountBalances } from "@pay3/stellar";
import type { ServiceContext } from "./context.js";

export class WalletAppService {
  constructor(private readonly ctx: ServiceContext) {}

  async getWalletOverview(userId: string, walletId: string) {
    const wallet = await this.ctx.prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });
    if (!wallet) {
      throw new Error("Wallet not found.");
    }

    const balances = await getAccountBalances(this.ctx.stellar, wallet.publicAddress);
    const smartAccounts = await this.ctx.prisma.smartAccount.findMany({
      where: { userId, walletId: wallet.id },
      select: { id: true, contractId: true, network: true, createdAt: true },
    });

    return {
      wallet: {
        id: wallet.id,
        publicAddress: wallet.publicAddress,
        network: wallet.network,
        isPrimary: wallet.isPrimary,
      },
      balances,
      smartAccounts,
    };
  }
}
