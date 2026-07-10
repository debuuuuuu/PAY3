import type { Prisma, PrismaClient } from "@pay3/database";
import type { StellarNetwork as ConfigNetwork } from "@pay3/shared";
import { toPrismaNetwork, normalizeWalletAddress } from "./network.js";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function findOrCreateUserWallet(
  prisma: DbClient,
  walletAddress: string,
  network: ConfigNetwork,
): Promise<{ userId: string; walletId: string }> {
  const publicAddress = normalizeWalletAddress(walletAddress);
  const prismaNetwork = toPrismaNetwork(network);

  const existing = await prisma.wallet.findUnique({
    where: {
      publicAddress_network: {
        publicAddress,
        network: prismaNetwork,
      },
    },
    select: { id: true, userId: true },
  });

  if (existing) {
    return { userId: existing.userId, walletId: existing.id };
  }

  const user = await prisma.user.create({ data: {} });
  const wallet = await prisma.wallet.create({
    data: {
      userId: user.id,
      publicAddress,
      network: prismaNetwork,
      isPrimary: true,
    },
  });

  return { userId: user.id, walletId: wallet.id };
}
