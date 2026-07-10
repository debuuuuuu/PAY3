import { Router } from "express";
import {
  createContact,
  deleteContact,
  listContacts,
} from "../controllers/contact.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";

export function createContactRoutes() {
  const router = Router();
  router.get("/", asyncHandler(listContacts));
  router.post("/", asyncHandler(createContact));
  router.delete("/:contactId", asyncHandler(deleteContact));
  return router;
}
