import { Router } from "express";
import { prisma } from "@pay3/database";
import {
  createAllocationKeypair,
  formatXlm,
  fundTestnetAccount,
  getAccountBalances,
} from "@pay3/stellar";
import { encryptSecret } from "../crypto.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const smartAccountRouter = Router();

smartAccountRouter.use(requireAuth);

smartAccountRouter.get("/", async (req, res) => {
  const { userId } = req as AuthedRequest;

  const account = await prisma.smartAccount.findUnique({
    where: { userId },
  });

  if (!account || account.status === "pending" || !account.publicKey) {
    res.json({
      smartAccount: account
        ? { status: account.status, publicKey: null, balances: [] }
        : null,
    });
    return;
  }

  let balances: { asset: string; balance: string }[] = [];
  try {
    balances = await getAccountBalances(account.publicKey);
  } catch (err) {
    console.error("balance fetch failed:", err);
  }

  const xlm = balances.find((b) => b.asset === "XLM");

  res.json({
    smartAccount: {
      status: account.status,
      publicKey: account.publicKey,
      balances,
      xlmBalance: xlm ? formatXlm(xlm.balance) : "0",
      network: "testnet",
      // ponytail: interim G-address allocation account until Soroban (§45)
      model: "allocation-account",
    },
  });
});

smartAccountRouter.post("/link", async (req, res) => {
  const { userId } = req as AuthedRequest;

  const existing = await prisma.smartAccount.findUnique({
    where: { userId },
  });

  if (existing?.publicKey && existing.status !== "pending") {
    res.status(409).json({
      error: "smart account already linked",
      publicKey: existing.publicKey,
    });
    return;
  }

  try {
    const { publicKey, secret } = createAllocationKeypair();
    await fundTestnetAccount(publicKey);
    const encryptedSecret = encryptSecret(secret);

    const account = existing
      ? await prisma.smartAccount.update({
          where: { userId },
          data: {
            publicKey,
            encryptedSecret,
            contractRef: publicKey,
            status: "linked",
          },
        })
      : await prisma.smartAccount.create({
          data: {
            userId,
            publicKey,
            encryptedSecret,
            contractRef: publicKey,
            status: "linked",
          },
        });

    // Never return encryptedSecret or secret
    res.status(201).json({
      smartAccount: {
        status: account.status,
        publicKey: account.publicKey,
        network: "testnet",
        model: "allocation-account",
        fundedByFriendbot: true,
      },
    });
  } catch (err) {
    console.error("smart-account/link failed:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "failed to link smart account",
    });
  }
});
