import type { ServiceContext } from "./context.js";

export class ContactAppService {
  constructor(private readonly ctx: ServiceContext) {}

  async createContact(input: {
    userId: string;
    displayName: string;
    stellarAddress: string;
    alias?: string | null;
  }) {
    return this.ctx.prisma.contact.create({
      data: {
        userId: input.userId,
        displayName: input.displayName.trim(),
        stellarAddress: input.stellarAddress.trim().toUpperCase(),
        alias: input.alias?.trim() || null,
        verifiedAt: new Date(),
      },
    });
  }

  async listContacts(userId: string) {
    return this.ctx.prisma.contact.findMany({
      where: { userId },
      orderBy: { displayName: "asc" },
    });
  }

  async deleteContact(userId: string, contactId: string) {
    await this.ctx.prisma.contact.deleteMany({
      where: { id: contactId, userId },
    });
  }
}
