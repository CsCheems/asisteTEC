import { Router } from "../deps.ts";
import { authMiddleware, requireRole } from "../middleware/auth.ts";
import { AppState } from "../types.ts";
import {
  approveJustification,
  getPendingJustifications,
} from "../controllers/justificationsController.ts";

const router = new Router<AppState>();

router.put(
  "/justifications/:id/approve",
  authMiddleware,
  requireRole("Profesor"),
  approveJustification
);

router.get(
  "/justifications/pending",
  authMiddleware,
  requireRole("Profesor"),
  getPendingJustifications
);

export default router;

