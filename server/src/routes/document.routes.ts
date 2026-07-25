import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createDocument,
  listDocuments,
  getDocument,
  deleteDocument,
} from "../controllers/document.controller";

const router = Router();

router.use(requireAuth); // every route below requires a valid token

router.post("/", createDocument);
router.get("/", listDocuments);
router.get("/:id", getDocument);
router.delete("/:id", deleteDocument);

export default router;