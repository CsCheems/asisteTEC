import { Router } from "../deps.ts";
import { AppState } from "../types.ts";
import { authMiddleware, requireRole } from "../middleware/auth.ts";
import {
  recordAssistance,
  getAssistanceHistory,
} from "../controllers/assistanceController.ts";

const router = new Router<AppState>();

router.post(
  "/assistance/record",
  authMiddleware,
  requireRole("Profesor"),
  recordAssistance
);

router.get(
  "/assistance/history/:alumnoId",
  authMiddleware,
  getAssistanceHistory
);

export default router;

