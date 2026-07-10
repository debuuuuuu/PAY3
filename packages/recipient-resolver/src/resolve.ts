import type { PrismaClient } from "@pay3/database";
import { StrKey } from "@stellar/stellar-sdk";
import { RecipientError } from "./errors.js";

export interface ResolvedRecipient {
  stellarAddress: string;
  contactId: string | null;
  displayName: string | null;
  matchedBy: "address" | "contact";
}

function normalizeAddress(address: string): string {
  return address.trim().toUpperCase();
}

function normalizeQuery(query: string): string {
  return query.trim();
}

export async function resolveRecipient(
  prisma: PrismaClient,
  userId: string,
  recipientInput: string,
): Promise<ResolvedRecipient> {
  const query = normalizeQuery(recipientInput);
  if (!query) {
    throw new RecipientError("RECIPIENT_NOT_FOUND", "Recipient is required.");
  }

  if (StrKey.isValidEd25519PublicKey(normalizeAddress(query))) {
    const address = normalizeAddress(query);
    const contact = await prisma.contact.findFirst({
      where: { userId, stellarAddress: address },
      select: { id: true, displayName: true },
    });

    return {
      stellarAddress: address,
      contactId: contact?.id ?? null,
      displayName: contact?.displayName ?? null,
      matchedBy: "address",
    };
  }

  const contacts = await prisma.contact.findMany({
    where: {
      userId,
      OR: [
        { displayName: { equals: query, mode: "insensitive" } },
        { alias: { equals: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      displayName: true,
      stellarAddress: true,
    },
  });

  if (contacts.length === 0) {
    throw new RecipientError(
      "RECIPIENT_NOT_FOUND",
      `No verified contact found for "${query}".`,
    );
  }

  if (contacts.length > 1) {
    throw new RecipientError(
      "RECIPIENT_AMBIGUOUS",
      `Multiple contacts match "${query}". Ask the user to clarify.`,
    );
  }

  const contact = contacts[0]!;
  return {
    stellarAddress: contact.stellarAddress,
    contactId: contact.id,
    displayName: contact.displayName,
    matchedBy: "contact",
  };
}
