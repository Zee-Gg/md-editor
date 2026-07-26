import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { listVersions, getVersion } from "../controllers/version.controller";

const router = Router();

router.use(requireAuth);

router.get("/:id/versions", listVersions);
router.get("/:id/versions/:versionId", getVersion);

export default router;