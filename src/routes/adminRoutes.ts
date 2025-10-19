import { Router } from "../deps.ts";
import { authMiddleware, requireRole } from "../middleware/auth.ts";
import { getDashboard, createStudent } from "../controllers/adminController.ts";

const router = new Router();

router.get(
  "/admin/dashboard",
  authMiddleware,
  requireRole("Administrador"),
  getDashboard
);

router.post(
  "/users/students",
  authMiddleware,
  requireRole("Administrador"),
  createStudent
);

export default router;

