import type { Request, Response } from "express";
import { sendData } from "./response.js";
import { optionalString, requireString, requireUuid } from "./validation.js";

export async function listContacts(req: Request, res: Response): Promise<void> {
  const contacts = await res.locals.services.contact.listContacts(req.auth!.userId);
  sendData(req, res, contacts);
}

export async function createContact(req: Request, res: Response): Promise<void> {
  const contact = await res.locals.services.contact.createContact({
    userId: req.auth!.userId,
    displayName: requireString(req.body?.displayName, "displayName"),
    stellarAddress: requireString(req.body?.stellarAddress, "stellarAddress"),
    alias: optionalString(req.body?.alias) ?? null,
  });
  sendData(req, res, contact, 201);
}

export async function deleteContact(req: Request, res: Response): Promise<void> {
  const contactId = requireUuid(req.params.contactId, "contactId");
  await res.locals.services.contact.deleteContact(req.auth!.userId, contactId);
  res.status(204).send();
}
