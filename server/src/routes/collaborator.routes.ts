import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  listCollaborators,
  addCollaborator,
  removeCollaborator,
} from "../controllers/collaborator.controller";

const router = Router();

router.use(requireAuth);

router.get("/:id/collaborators", listCollaborators);
router.post("/:id/collaborators", addCollaborator);
router.delete("/:id/collaborators/:userId", removeCollaborator);

export default router;